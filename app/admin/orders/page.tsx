'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaFilter, FaCircleCheck, FaArrowLeft, FaArrowRotateLeft, FaBox, FaClock, FaMagnifyingGlass, FaTruckFast, FaCircleXmark } from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { OrderResponseDTO } from '@/lib/types'

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  PLACED: { color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400', icon: FaClock },
  CONFIRMED: { color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400', icon: FaCircleCheck },
  PACKED: { color: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400', icon: FaBox },
  SHIPPED: { color: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400', icon: FaTruckFast },
  OUT_FOR_DELIVERY: { color: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400', icon: FaTruckFast },
  DELIVERED: { color: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', icon: FaCircleCheck },
  CANCELLED: { color: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400', icon: FaCircleXmark },
  RETURNED: { color: 'bg-gray-100 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400', icon: FaArrowRotateLeft },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const loadOrders = async (p: number) => {
    try {
      setLoading(true)
      const res = await apiClient.getAdminOrders(p, 10)
      setOrders(res.data.data.content)
      setTotalPages(res.data.data.totalPages)
      setTotalElements(res.data.data.totalElements)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders(page) }, [page])

  return (
    <>
      <Link href="/admin" className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <FaArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and track customer orders ({totalElements} total)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <FaMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search orders..." className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <button className="flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
            <FaFilter size={16} /> FaFilter
          </button>
        </div>
      </div>
      
      <div className="mt-8 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Order #</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Items</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No orders found.</td>
                </tr>
              ) : orders.map(order => {
                const config = statusConfig[order.orderStatus] || statusConfig.PLACED
                const StatusIcon = config.icon
                return (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-bold">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(order.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.orderItems?.[0]?.primaryImageUrl && (
                          <img src={order.orderItems[0].primaryImageUrl} alt="" className="h-8 w-8 object-cover rounded border border-border" />
                        )}
                        <span className="text-muted-foreground">{order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${config.color}`}>
                        <StatusIcon size={14} />
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        order.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                        order.paymentStatus === 'PENDING' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                        'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                      }`}>{order.paymentStatus}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{formatINR(order.totalAmount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages || 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </>
  )
}
