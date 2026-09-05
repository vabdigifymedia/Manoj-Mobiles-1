'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import type { UserProfileResponseDTO, OrderResponseDTO } from '@/lib/types'
import { FaBoxOpen, FaHeart, FaMapLocationDot } from 'react-icons/fa6'
import Link from 'next/link'
import { useStore } from '@/components/store-provider'

export default function AccountOverview() {
  const { user } = useAuth()
  const { wishlist } = useStore()
  const [profile, setProfile] = useState<UserProfileResponseDTO | null>(null)
  const [recentOrder, setRecentOrder] = useState<OrderResponseDTO | null>(null)

  useEffect(() => {
    apiClient.getUserProfile().then(res => setProfile(res.data.data)).catch(() => {})
    apiClient.getUserOrders(0, 1).then(res => {
      if (res.data?.data?.content?.length) {
        setRecentOrder(res.data.data.content[0])
      }
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Welcome back, {profile?.name || (user as any)?.email?.split('@')[0] || 'User'}!</h2>
        <p className="text-muted-foreground mt-2">Manage your orders, addresses, and account details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/account/orders" className="p-6 rounded-3xl border border-border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all group">
          <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FaBoxOpen size={24} />
          </div>
          <h3 className="font-bold text-lg">My Orders</h3>
          <p className="text-sm text-muted-foreground">Track, return, or buy things again</p>
        </Link>
        
        <Link href="/account/wishlist" className="p-6 rounded-3xl border border-border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all group">
          <div className="size-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FaHeart size={24} />
          </div>
          <h3 className="font-bold text-lg">Wishlist</h3>
          <p className="text-sm text-muted-foreground">{wishlist.length} saved items</p>
        </Link>

        <Link href="/account/addresses" className="p-6 rounded-3xl border border-border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all group">
          <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FaMapLocationDot size={24} />
          </div>
          <h3 className="font-bold text-lg">Addresses</h3>
          <p className="text-sm text-muted-foreground">Edit addresses for orders</p>
        </Link>
      </div>

      {recentOrder && (
        <div className="rounded-3xl border border-border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border bg-slate-50 dark:bg-zinc-950/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Most Recent Order</h3>
              <p className="text-sm text-muted-foreground">Placed on {new Date(recentOrder.placedAt).toLocaleDateString()}</p>
            </div>
            <Link href="/account/orders" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-lg">{recentOrder.orderItems.length} Item(s)</p>
                <p className="text-sm text-muted-foreground">Status: <span className="font-bold text-foreground">{recentOrder.orderStatus}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
