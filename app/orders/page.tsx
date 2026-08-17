import Link from 'next/link'
import { FaLocationDot } from 'react-icons/fa6'
import { orders, formatINR } from '@/lib/api'

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Your account</p>
      <h1 className="mt-1 text-3xl font-black">Order history</h1>
      <div className="mt-8 flex flex-col gap-4">
        {orders.map(order => (
          <article key={order.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-sm font-bold">Order {order.id}</p>
                <p className="mt-1 text-xs text-muted-foreground">Placed on {order.date}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <img src={order.image} alt={order.product} className="size-16 rounded-xl bg-muted object-contain" />
              <div className="flex-1">
                <p className="font-bold">{order.product}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatINR(order.total)}</p>
              </div>
              {order.status === 'In transit' && (
                <Link href="/track" className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground sm:flex">
                  <FaLocationDot size={15} /> Track order
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
