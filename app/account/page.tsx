'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient, formatINR } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import { useStore } from '@/components/store-provider'
import type { UserProfileResponseDTO, OrderResponseDTO } from '@/lib/types'
import { 
  FaBoxOpen, 
  FaHeart, 
  FaMapLocationDot, 
  FaUser, 
  FaChevronRight, 
  FaArrowRight, 
  FaGear, 
  FaArrowRightFromBracket,
  FaBagShopping
} from 'react-icons/fa6'

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = (status || '').toUpperCase()

  let colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
  if (normalized === 'DELIVERED') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
  } else if (normalized === 'OUT_FOR_DELIVERY') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
  } else if (normalized === 'CANCELLED') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
  } else if (normalized === 'SHIPPED') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
  }

  const label = normalized.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase ${colorClasses}`}>
      {label}
    </span>
  )
}

export default function AccountOverviewPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { wishlist } = useStore()

  const [profile, setProfile] = useState<UserProfileResponseDTO | null>(null)
  const [orders, setOrders] = useState<OrderResponseDTO[]>([])
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [addressCount, setAddressCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([
      apiClient.getUserProfile(),
      apiClient.getUserOrders(0, 5),
      apiClient.getUserAddresses(0, 50)
    ]).then(([profileRes, ordersRes, addressesRes]) => {
      if (!isMounted) return

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.data) {
        setProfile(profileRes.value.data.data)
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.data) {
        const orderData = ordersRes.value.data.data
        setOrders(orderData.content || [])
        setTotalOrders(typeof orderData.totalElements === 'number' ? orderData.totalElements : (orderData.content?.length || 0))
      }

      if (addressesRes.status === 'fulfilled' && addressesRes.value.data?.data) {
        const addrData = addressesRes.value.data.data
        setAddressCount(typeof addrData.totalElements === 'number' ? addrData.totalElements : (addrData.content?.length || 0))
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Resolve customer name
  const customerName = profile?.name || user?.name || ''
  const welcomeHeading = customerName ? `Welcome back, ${customerName} 👋` : 'Welcome back! 👋'

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-300">
      
      {/* 1. Account Header */}
      <div className="space-y-1.5 border-b border-slate-200/80 dark:border-zinc-800 pb-6">
        <span className="text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full">
          My Account
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white pt-2" suppressHydrationWarning>
          {welcomeHeading}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 font-medium">
          Manage your orders, wishlist, addresses, and account details.
        </p>
      </div>

      {/* 2. Quick Account Cards (4 in a row on desktop, 2 on tablet, 1 on mobile) */}
      <section aria-label="Quick Account Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          
          {/* Card 1: My Orders */}
          <Link
            href="/account/orders"
            className="group p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaBoxOpen size={20} />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {totalOrders !== null ? `${totalOrders} ${totalOrders === 1 ? 'Order' : 'Orders'}` : 'View'}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  My Orders
                </h3>
                <FaArrowRight size={12} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Track and manage your orders
              </p>
            </div>
          </Link>

          {/* Card 2: Wishlist */}
          <Link
            href="/account/wishlist"
            className="group p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="size-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaHeart size={20} />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {`${wishlist.length} ${wishlist.length === 1 ? 'Item' : 'Items'}`}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Wishlist
                </h3>
                <FaArrowRight size={12} className="text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Your saved products
              </p>
            </div>
          </Link>

          {/* Card 3: Addresses */}
          <Link
            href="/account/addresses"
            className="group p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaMapLocationDot size={20} />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {addressCount !== null ? `${addressCount} Saved` : 'Manage'}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Addresses
                </h3>
                <FaArrowRight size={12} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Manage your delivery addresses
              </p>
            </div>
          </Link>

          {/* Card 4: Profile */}
          <Link
            href="/account/profile"
            className="group p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaUser size={20} />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                Settings
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Profile
                </h3>
                <FaArrowRight size={12} className="text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Manage your account details
              </p>
            </div>
          </Link>

        </div>
      </section>

      {/* 3. Recent Orders Section */}
      <section aria-label="Recent Orders" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Recent Orders
            </h2>
          </div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all"
          >
            View All <FaArrowRight size={11} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 animate-pulse">
                <div className="h-5 w-40 bg-slate-200 dark:bg-zinc-800 rounded-md mb-4" />
                <div className="flex gap-4 items-center">
                  <div className="size-16 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                    <div className="h-3 w-1/4 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* Polished Empty State */
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs flex flex-col items-center">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4">
              <FaBoxOpen size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No orders yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
              Explore our latest smartphones and accessories.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-slate-100 px-5 py-2.5 rounded-full font-bold text-sm transition-colors shadow-xs"
            >
              <FaBagShopping size={14} /> Start Shopping
            </Link>
          </div>
        ) : (
          /* Recent Orders List */
          <div className="space-y-3.5">
            {orders.map(order => {
              const firstItem = order.orderItems?.[0]
              const extraItemsCount = (order.orderItems?.length || 1) - 1
              const placedDateStr = order.placedAt 
                ? new Date(order.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Recent'

              return (
                <div
                  key={order.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs"
                >
                  {/* Top metadata strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-slate-400 dark:text-zinc-500">•</span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        Placed on <strong className="text-slate-700 dark:text-zinc-300 font-semibold">{placedDateStr}</strong>
                      </span>
                    </div>

                    <StatusBadge status={order.orderStatus} />
                  </div>

                  {/* Order Body */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="size-16 sm:size-20 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-800 p-1.5 flex items-center justify-center shrink-0">
                        {firstItem?.primaryImageUrl ? (
                          <img
                            src={firstItem.primaryImageUrl}
                            alt={firstItem.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <FaBoxOpen size={24} className="text-slate-400 dark:text-zinc-600" />
                        )}
                      </div>

                      {/* Product details */}
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {firstItem?.productName || 'Order Items'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          {firstItem?.variantName ? `${firstItem.variantName} · ` : ''}
                          Qty: {firstItem?.qty || 1}
                          {extraItemsCount > 0 && (
                            <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                              +{extraItemsCount} more {extraItemsCount === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800/60">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Total
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {formatINR(order.totalAmount)}
                        </span>
                      </div>

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white transition-colors"
                      >
                        <span>View Order</span>
                        <FaChevronRight size={10} className="text-slate-500 dark:text-zinc-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 4. Account Settings (Compact, lightweight secondary section) */}
      <section aria-label="Account Settings" className="space-y-3 pt-2">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Settings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <Link
            href="/account/profile"
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex items-center gap-3.5 group"
          >
            <div className="size-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
              <FaGear size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Profile Settings</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">Name, email, phone</p>
            </div>
            <FaChevronRight size={11} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>

          <Link
            href="/account/addresses"
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex items-center gap-3.5 group"
          >
            <div className="size-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
              <FaMapLocationDot size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Addresses</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">Delivery locations</p>
            </div>
            <FaChevronRight size={11} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>

          <Link
            href="/account/wishlist"
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex items-center gap-3.5 group"
          >
            <div className="size-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors shrink-0">
              <FaHeart size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Wishlist</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">Saved products</p>
            </div>
            <FaChevronRight size={11} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>

          <button
            onClick={handleLogout}
            type="button"
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-all flex items-center gap-3.5 text-left group w-full"
          >
            <div className="size-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 transition-colors shrink-0">
              <FaArrowRightFromBracket size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">Logout</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">Sign out of account</p>
            </div>
            <FaChevronRight size={11} className="text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

        </div>
      </section>

    </div>
  )
}
