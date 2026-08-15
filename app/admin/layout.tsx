'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Package, ShoppingBag, Users, LayoutDashboard, Menu, X, Tag, Award, UserPlus, LogOut, Image, Settings, HelpCircle } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth-context'

function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isAuthenticated, user, logout, loading } = useAuth()

  // Close menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Redirect to login if not authenticated (skip for login page itself)
  useEffect(() => {
    if (!loading && !isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [loading, isAuthenticated, pathname, router])

  // Show login page without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Don't render until we know auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  
  return (
    <div className="min-h-screen bg-muted/50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <Menu />
        </button>
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard size={16} />
          </span> 
          Admin panel
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        {/* Sidebar Overlay for Mobile */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-300" onClick={() => setIsMobileOpen(false)} />
        )}
        
        <aside className={`${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm border-r flex flex-col animate-in slide-in-from-left-8 duration-300 ease-out' : 'hidden'} h-full lg:h-fit lg:sticky lg:top-8 rounded-none lg:rounded-2xl lg:border border-border bg-card p-6 lg:p-4 lg:block shadow-xl lg:shadow-sm overflow-y-auto`}>
          <div className="mb-6 flex items-center justify-between font-bold lg:hidden">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard size={16} />
              </span> 
              Admin panel
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col gap-1 text-sm font-semibold flex-1">
            {[
              { label: 'Overview', icon: BarChart3, href: '/admin', exact: true }, 
              { label: 'Products', icon: Package, href: '/admin/products', exact: false }, 
              { label: 'Categories', icon: Tag, href: '/admin/categories', exact: false },
              { label: 'Brands', icon: Award, href: '/admin/brands', exact: false },
              { label: 'Orders', icon: ShoppingBag, href: '/admin/orders', exact: false }, 
              { label: 'Banners', icon: Image, href: '/admin/banners', exact: false },
              { label: 'Store Settings', icon: Settings, href: '/admin/settings', exact: false },
              { label: 'FAQs', icon: HelpCircle, href: '/admin/faqs', exact: false },
              { label: 'Staff', icon: UserPlus, href: '/admin/staff', exact: false },
              { label: 'Customers', icon: Users, href: '/admin/customers', exact: false },
            ].map(item => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </Link>
              )
            })}
          </div>
          
          <div className="mt-8 border-t border-border pt-4">
            {user && (
              <div className="px-3 py-2 mb-2 text-xs text-muted-foreground">
                Signed in as <span className="font-bold text-foreground">{user.name}</span>
              </div>
            )}
            <button 
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>
        
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminSidebar>{children}</AdminSidebar>
    </AuthProvider>
  )
}

