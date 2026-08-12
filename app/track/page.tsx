'use client'

import dynamic from 'next/dynamic'
import { Check, Truck } from 'lucide-react'

// LiveTrackingMap uses Leaflet which requires window object, so we disable SSR
const LiveTrackingMap = dynamic(() => import('@/components/live-tracking-map').then(mod => mod.LiveTrackingMap), { ssr: false })

export default function TrackPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Order #MM-82914</p>
      <h1 className="mt-1 text-3xl font-black">It&apos;s on the way</h1>
      <p className="mt-2 text-sm text-muted-foreground">Estimated delivery today by 4:30 PM</p>
      
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-2">
          <LiveTrackingMap position={{ lat: 12.9716, lng: 77.5946 }} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Courier</p>
          <p className="mt-1 font-bold">BlueDart Express</p>
          <div className="mt-8 flex flex-col gap-7">
            <div className="flex gap-3">
              <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check size={14} />
              </span>
              <div>
                <p className="text-sm font-bold">Order picked up</p>
                <p className="text-xs text-muted-foreground">Bengaluru hub · 10:12 AM</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                <Truck size={13} />
              </span>
              <div>
                <p className="text-sm font-bold">Out for delivery</p>
                <p className="text-xs text-muted-foreground">Nearby · arriving soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
