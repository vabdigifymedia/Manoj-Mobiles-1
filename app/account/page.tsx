'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/components/store-provider'
import { FaArrowLeft, FaTrashCan, FaBox, FaHeart, FaLock, FaPhone, FaCalendar, FaEnvelope, FaRightFromBracket, FaBagShopping, FaUser, FaLocationDot, FaChevronRight } from 'react-icons/fa6'
import { ProductCard } from '@/components/product-card'

// ─── Mock Data ────────────────────────────────────────────────────────────
const MOCK_PROFILE = { name: 'Manoj Customer', phone: '+91 9876543210', email: 'customer@example.com', memberSince: 'August 2026' }

const MOCK_ORDERS = [
  {
    id: 'ord_1',
    orderNumber: 'MM-782910',
    status: 'DELIVERED',
    total: 124999,
    date: '10 Aug 2026',
    items: [
      { name: 'Galaxy S24 Ultra', variant: 'Titanium Black, 512GB', qty: 1, price: 124999, image: 'https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-s928-sm-s928bzkqins-539573323?$1300_1038_PNG$' }
    ]
  },
  {
    id: 'ord_2',
    orderNumber: 'MM-782805',
    status: 'OUT_FOR_DELIVERY',
    total: 119999,
    date: '11 Aug 2026',
    items: [
      { name: 'iPhone 15 Pro', variant: 'Natural Titanium, 256GB', qty: 1, price: 119999, image: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845702708' }
    ]
  }
]

const MOCK_ADDRESSES = [
  { id: 'addr_1', label: 'Home', address: '123 Tech Park, Sector 4', city: 'Bangalore', state: 'Karnataka', pincode: '560001', isDefault: true },
  { id: 'addr_2', label: 'Office', address: 'Floor 5, Innovator Building, Ring Road', city: 'Bangalore', state: 'Karnataka', pincode: '560032', isDefault: false }
]

// ─── Status Badge Component ───────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  }
  return (
    <span className={`px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-full ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Main Account Page ────────────────────────────────────────────────────
export default function AccountPage() {
  const { isLoggedIn, logout, showToast, wishlist, removeFromWishlist } = useStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // 1. Logged Out View
  if (!isLoggedIn) {
    return (
      <main className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 mb-6">
            <FaLock size={32} />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Access Restricted</h1>
          <p className="text-muted-foreground mb-8 text-sm font-medium">Please log in to your account to view your dashboard, track orders, and manage your profile.</p>
          <Link href="/auth" className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] shadow-md shadow-primary/20">
            Log In or Sign Up
          </Link>
          <Link href="/" className="mt-4 block text-sm font-bold text-muted-foreground hover:text-foreground">
            Return to Store
          </Link>
        </div>
      </main>
    )
  }

  const handleLogout = () => {
    logout()
    showToast({ message: 'Logged out successfully', type: 'info' })
  }

  // Render content based on active tab
  const renderContent = () => {
    if (selectedOrderId) {
      const order = MOCK_ORDERS.find(o => o.id === selectedOrderId)
      if (!order) return null
      
      return (
        <div className="animate-in fade-in duration-300">
          <button onClick={() => setSelectedOrderId(null)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <FaArrowLeft size={16} /> Back to Orders
          </button>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-black">Order {order.orderNumber}</h2>
              <p className="text-muted-foreground text-sm font-medium mt-1">Placed on {order.date}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Items in this order</h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-border bg-muted/20">
                  <div className="size-20 rounded-xl bg-white p-2 border border-border shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.variant}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">Qty: {item.qty}</span>
                      <span className="font-bold">₹{item.price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border p-5 bg-muted/20">
              <h3 className="font-bold mb-4 flex items-center gap-2"><FaLocationDot size={18} /> Delivery Address</h3>
              <p className="text-sm font-semibold mb-1">Manoj Customer</p>
              <p className="text-sm text-muted-foreground leading-relaxed">123 Tech Park, Sector 4<br/>Bangalore, Karnataka - 560001<br/>Phone: +91 9876543210</p>
            </div>
            <div className="rounded-2xl border border-border p-5 bg-muted/20">
              <h3 className="font-bold mb-4 flex items-center gap-2"><FaBagShopping size={18} /> Payment Summary</h3>
              <div className="space-y-2 text-sm font-medium">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{order.total.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span className="text-emerald-500">Free</span></div>
                <div className="flex justify-between pt-2 border-t border-border font-bold text-base mt-2"><span>Total</span><span>₹{order.total.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-black mb-6">Dashboard Overview</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-950 dark:border-blue-900">
                <div className="size-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 grid place-items-center mb-3"><FaBagShopping size={20} /></div>
                <p className="text-2xl font-black text-blue-950 dark:text-blue-50">{MOCK_ORDERS.length}</p>
                <p className="text-sm font-semibold text-blue-700/70 dark:text-blue-300/70">Total Orders</p>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950 dark:border-emerald-900">
                <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400 grid place-items-center mb-3"><FaBox size={20} /></div>
                <p className="text-2xl font-black text-emerald-950 dark:text-emerald-50">1</p>
                <p className="text-sm font-semibold text-emerald-700/70 dark:text-emerald-300/70">Delivered</p>
              </div>
              <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 dark:bg-orange-950 dark:border-orange-900 col-span-2 md:col-span-1">
                <div className="size-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400 grid place-items-center mb-3"><FaLocationDot size={20} /></div>
                <p className="text-2xl font-black text-orange-950 dark:text-orange-50">1</p>
                <p className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Active Tracking</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Recent Order</h3>
              <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-primary hover:underline">View all</button>
            </div>
            
            <div 
              onClick={() => setSelectedOrderId(MOCK_ORDERS[1].id)}
              className="group cursor-pointer rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-lg">{MOCK_ORDERS[1].orderNumber}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-1">Placed on {MOCK_ORDERS[1].date}</p>
                </div>
                <StatusBadge status={MOCK_ORDERS[1].status} />
              </div>
              <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                <div className="size-12 rounded-lg bg-white p-1 border border-border shrink-0">
                  <img src={MOCK_ORDERS[1].items[0].image} alt="Product" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm line-clamp-1">{MOCK_ORDERS[1].items[0].name}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Total: ₹{MOCK_ORDERS[1].total.toLocaleString('en-IN')}</p>
                </div>
                <FaChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        )
      
      case 'orders':
        return (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-black mb-6">Order History</h2>
            <div className="space-y-4">
              {MOCK_ORDERS.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrderId(order.id)}
                  className="group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-black text-lg">{order.orderNumber}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">{order.items.length} Item(s) • ₹{order.total.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <p className="text-sm font-bold text-muted-foreground">{order.date}</p>
                    <div className="size-8 rounded-full bg-muted grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FaChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'addresses':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Saved Addresses</h2>
              <button className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                Add New
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {MOCK_ADDRESSES.map(addr => (
                <div key={addr.id} className={`rounded-2xl border p-5 transition-colors ${addr.isDefault ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black tracking-wide bg-muted px-2 py-1 rounded-md text-xs">{addr.label}</span>
                    {addr.isDefault && <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Default</span>}
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300 mb-4">{addr.address}<br/>{addr.city}, {addr.state} - {addr.pincode}</p>
                  <div className="flex gap-2">
                    <button className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors">Edit</button>
                    <button className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors dark:border-rose-500/20 dark:bg-rose-500/10 dark:hover:bg-rose-500/20">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-black mb-6">Profile Settings</h2>
            
            <div className="flex items-center gap-4 mb-8 p-6 rounded-2xl bg-muted/30 border border-border">
              <div className="size-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white grid place-items-center text-2xl font-black shadow-lg">
                {MOCK_PROFILE.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black">{MOCK_PROFILE.name}</h3>
                <p className="text-sm font-semibold text-muted-foreground">Premium Member</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <FaPhone size={16} className="text-muted-foreground" />
                  <span className="font-semibold">{MOCK_PROFILE.phone}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <FaEnvelope size={16} className="text-muted-foreground" />
                  <span className="font-semibold">{MOCK_PROFILE.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Member Since</label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <FaCalendar size={16} className="text-muted-foreground" />
                  <span className="font-semibold">{MOCK_PROFILE.memberSince}</span>
                </div>
              </div>
            </div>
            
            <button className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
              Edit Profile
            </button>
          </div>
        )

      case 'wishlist':
        return (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-black mb-6">My Wishlist</h2>
            {wishlist.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-muted text-muted-foreground mb-4">
                  <FaHeart size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">It's empty here</h3>
                <p className="text-muted-foreground mb-6">You haven't saved any products to your wishlist yet.</p>
                <Link href="/shop" className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Explore our collection
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {wishlist.map(product => (
                  <div key={product.id} className="relative group/wishlist">
                    <ProductCard product={product} hideHeart={true} />
                    <button 
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full bg-white/90 text-rose-500 shadow-sm opacity-0 group-hover/wishlist:opacity-100 transition-all hover:bg-rose-50 hover:scale-110 dark:bg-zinc-800 dark:text-rose-400"
                      aria-label="Remove from wishlist"
                    >
                      <FaTrashCan size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      default: return null
    }
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'orders', label: 'My Orders', icon: FaBagShopping },
    { id: 'addresses', label: 'Saved Addresses', icon: FaLocationDot },
    { id: 'profile', label: 'Profile Settings', icon: FaLock },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 min-h-[calc(100vh-100px)]">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-28">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="size-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white grid place-items-center text-lg font-black shadow-md shrink-0">
                {MOCK_PROFILE.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-black leading-tight text-lg truncate">{MOCK_PROFILE.name}</p>
                <p className="text-xs font-semibold text-muted-foreground truncate">{MOCK_PROFILE.phone}</p>
              </div>
            </div>

            <nav className="flex overflow-x-auto md:flex-col gap-2 md:gap-1 mb-8 pb-2 md:pb-0 hide-scrollbar">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id && !selectedOrderId
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedOrderId(null); }}
                    className={`shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-full md:rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground bg-muted/50 md:bg-transparent'
                    }`}
                  >
                    <tab.icon size={16} className="md:w-[18px] md:h-[18px]"  />
                    {tab.label}
                  </button>
                )
              })}
              
              {/* Mobile-only Wishlist and Logout (append to horizontal scroll) */}
              <button 
                onClick={() => { setActiveTab('wishlist'); setSelectedOrderId(null); }}
                className={`md:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === 'wishlist' 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground bg-muted/50'
                }`}
              >
                <FaHeart size={16}  />
                Wishlist
              </button>
              <button 
                onClick={handleLogout}
                className="md:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 transition-all"
              >
                <FaRightFromBracket size={16}  />
                Logout
              </button>
            </nav>

            <div className="hidden md:block border-t border-border pt-6 space-y-1">
              <button 
                onClick={() => { setActiveTab('wishlist'); setSelectedOrderId(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'wishlist' 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <FaHeart size={18}  />
                Wishlist
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
              >
                <FaRightFromBracket size={18}  />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm min-h-[500px]">
          {renderContent()}
        </div>
        
      </div>
    </main>
  )
}
