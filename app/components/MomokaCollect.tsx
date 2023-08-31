import { useState, useEffect} from 'react'
import { ethers } from 'ethers'

import {Button} from './Button'
import {Loading} from './Loading'

function sleep() {
    return new Promise(resolve => setInterval(resolve, 1000))
}

import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { Keyring } from '@polkadot/api';
import * as Phala from '@phala/sdk';
import MomokaOracleAbi from './abis/momoka_publication.json';
import { stringToHex, u8aToHex } from "@polkadot/util";

const PHAT_CONTRACT = '0x54d7aa1928bdbfbc19c647232b686ccb8bf58cda87327bb1620b336485a75fea'
const ACT_HUB_CONTRACT = '0x7b9FA9d77794167c2606ddD230523cD6F25B4c0D'
const ACT_COLLECT_CONTRACT = '0x027AfbD7628221A0222eD4851EE63dF449d9dAE7'

async function getAttestation(fullPubId: string): Promise<string> {
  const provider = new WsProvider('wss://poc5.phala.network/ws');
  const api = new ApiPromise(Phala.options({ provider }));
  await api.isReady;

  const keyring = new Keyring({ type: 'sr25519' });
  const pair = keyring.addFromUri('//Alice');
  const address = pair.address;
  const cert = await Phala.signCertificate({ pair, api });

  const contractId = PHAT_CONTRACT;
  const registry = await Phala.OnChainRegistry.create(api);
  const contractKey = await registry.getContractKeyOrFail(contractId);

  const oracle = new Phala.PinkContractPromise(api, registry, MomokaOracleAbi, contractId, contractKey);

  const hexStr = stringToHex(fullPubId);
  const mainnet = (process.env['NODE_ENV'] == 'production')
  // @ts-ignore
  const result: any = await oracle.query.checkLensPublication(address, {cert}, hexStr, mainnet);
  if (!result.output.isOk || !result.output.asOk.isOk) {
      console.log('Failed:', result.output.toHuman());
  }
  const attestation = u8aToHex(result.output.asOk.asOk);
  return attestation;
}

interface MomokaCollectParams {
    publicationId: string;
    provider?: ethers.BrowserProvider;
    profile: any;
}

function parseMomokaPublicationId(publicationId: string): [BigInt, BigInt] {
    const [hexProfileId, hexPubRefId, _, hexDaId] = publicationId.split('-')
    const profileId = BigInt(hexProfileId)
    const pubRefId = BigInt(hexPubRefId)
    const daId = BigInt('0x' + hexDaId)
    const pubId = (daId << BigInt(128)) | pubRefId
    return [profileId, pubId]
}

export function MomokaCollect({
    publicationId, provider, profile, ...buttonProps
  }: MomokaCollectParams) {
    const [loading, setLoading] = useState(false)
    const [attestation, setAttestation] = useState('')
    const [tx, setTx] = useState('')

    async function onClick() {
        const [profileId, pubId] = parseMomokaPublicationId(publicationId);

        setLoading(true)
        console.log('Clicked', publicationId)
        const oracleAttestation = await getAttestation(publicationId)
        setAttestation(oracleAttestation)
        console.log('Attest', oracleAttestation)

        if (!profile || !profile.id || !provider) {
            setLoading(false)
            setTx('Not logged in')
            return;
        }

        const PublicationActionParams = `(${[
            'uint256 publicationActedProfileId',
            'uint256 publicationActedId',
            'uint256 actorProfileId',
            'uint256[] referrerProfileIds',
            'uint256[] referrerPubIds',
            'address actionModuleAddress',
            'bytes actionModuleData',
        ].join(',')})`
        const abi = [
            `function momokaAct(${PublicationActionParams} params, bytes oracleAttestation) view returns (bytes)`,
        ]
        const signer = await provider.getSigner();
        const actHub = new ethers.Contract(ACT_HUB_CONTRACT, abi, signer)

        const actParams = [
            profileId,
            pubId,
            profile.id,
            [], [],
            ACT_COLLECT_CONTRACT,
            '0x'
        ]
        
        const gas = await actHub.momokaAct.estimateGas(actParams, oracleAttestation);
        console.log('Estimated gas', gas)

        const tx = await actHub.momokaAct.send(actParams, oracleAttestation);
        const receipt = await tx.wait();
        console.log('Tx', receipt.hash)
        setTx(receipt.hash)

        setLoading(false)
    }

    return <>
        {loading
            ? (<Loading />)
            : (<>
                <Button
                    {...buttonProps}
                    text="Momoka Collect"
                    onClick={onClick}
                    className='bg-purple-500'
                />
                {publicationId}
            </>)
        }
        {attestation && (<p>Attestation: <code style={{display: 'block', width: '300px', overflow: 'hidden', textOverflow: 'ellipsis'}}>{attestation}</code></p>)}
        {tx && (<p>Tx: <code>{tx}</code></p>)}
    </>
  }