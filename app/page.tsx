'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-14">
      <div>
        <p>
          This demo allows you to collect Lens publications on Momoka with Phala's LensAPI Oracle.
          Learn more at <a className="text-emerald-600" href="https://www.loom.com/share/448c07afec5b46fb85eb438ea402f4f8?sid=86005f21-5c00-4aa2-90bf-2409643d4c15">Phala Oracle Demo Video</a>.
          Forked from The Lens Algorithm Playground.
        </p>
        <p className="mt-5">The currently supported APIs are linked here:</p>
        
        <Link href="/lens">
          <p className="text-xl text-slate-400 mt-4">Lens</p>
        </Link>
        <a href="https://docs.lens.xyz/docs/explore-publications" target="_blank" rel="no-opener">
          <p className="mt-1 text-blue-500">Docs</p>
        </a>
      </div>
    </main>
  )
}
