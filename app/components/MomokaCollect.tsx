import { useState, useEffect} from 'react'

import {Button} from './Button'
import {Loading} from './Loading'

function sleep() {
    return new Promise(resolve => setInterval(resolve, 1000))
}

export function MomokaCollect({
    publicationId, ...buttonProps
  }) {
    const [loading, setLoading] = useState(false)
    const [tx, setTx] = useState('')

    async function onClick() {
        setLoading(true)
        console.log('Clicked', publicationId)
        await sleep()
        setLoading(false)
    }

    return loading
        ? (<Loading />)
        : (<>
            <Button
                text="Momoka Collect"
                buttonProps={buttonProps}
                onClick={onClick}
                className='bg-purple-500'
            />
            {tx ? tx : publicationId}
        </>)
  }