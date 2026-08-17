'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaBell, FaBox, FaBagShopping, FaUser, FaChartSimple } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import { formatINR } from '@/lib/apiClient'
import { DashboardStatsDTO } from '@/lib/types'

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient.getDashboardStats()
      .then(res => setStats(res.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-red-500 font-semibold">{error || 'No data'}</p>
      </div>
    )
  }

  const revenue = stats.salesChart || []
  const max = revenue.length > 0 ? Math.max(...revenue.map(r => r.revenue), 1) : 1

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Dashboard</p>
          <h1 className="mt-1 text-3xl font-black">Store overview</h1>
        </div>
        <Link href="/admin/products/new" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
          + Add product
        </Link>
      </div>
      
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Orders', String(stats.totalOrders), FaBagShopping],
          ['Total Products', String(stats.totalProducts), FaBox],
          ['Total Customers', String(stats.totalCustomers), FaUser],
          ['Low Stock Count', String(stats.lowStockCount), FaBell]
        ].map(([label, value, Icon]) => {
          const DynamicIcon = Icon as React.ElementType
          return (
            <div key={label as string} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label as string}</p>
                <DynamicIcon size={18} className="text-primary" />
              </div>
              <p className="mt-4 text-2xl font-black">{value as string}</p>
            </div>
          )
        })}
      </div>
      
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">Revenue overview</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sales chart</p>
          </div>
          <FaChartSimple className="text-primary" size={20} />
        </div>
        {revenue.length > 0 ? (
          <div className="mt-6 flex h-56 items-end gap-3 border-b border-border px-2">
            {revenue.map((item, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div 
                  className="w-full rounded-t-lg bg-primary transition hover:bg-accent" 
                  style={{ height: `${Math.max(12, (item.revenue / max) * 100)}%` }} 
                  title={formatINR(item.revenue)} 
                />
                <span className="text-[10px] text-muted-foreground truncate max-w-full">{item.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground text-center py-8">No sales data yet.</p>
        )}
      </div>

      {/* Recent Orders */}
      {stats.recentOrders && stats.recentOrders.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-semibold">Order #</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 font-bold">{order.orderNumber}</td>
                    <td className="px-6 py-3 text-muted-foreground">{order.customerName}</td>
                    <td className="px-6 py-3 font-semibold">{formatINR(order.totalAmount)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">{order.orderStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
