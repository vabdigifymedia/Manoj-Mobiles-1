'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  FaAward,
  FaXmark,
  FaImage,
  FaBox,
  FaUsers,
  FaUserPlus,
  FaCircleQuestion,
  FaGear,
  FaTableColumns,
  FaTag,
  FaBagShopping,
  FaBars,
  FaRightFromBracket,
  FaChartSimple,
  FaInstagram,
  FaListCheck,
  FaBoxesPacking,
  FaMapLocationDot,
  FaMotorcycle,
  FaCreditCard,
  FaStar,
  FaArrowUpRightFromSquare,
} from 'react-icons/fa6'
import { PanelLeftClose, PanelLeftOpen, Sun, Moon } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { bulkInquiryService } from '@/lib/bulkInquiryService'

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  exact?: boolean
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const mainScrollRef = useRef<HTMLDivElement>(null)

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pendingInquiryCount, setPendingInquiryCount] = useState(0)
  const [pendingEmiCount, setPendingEmiCount] = useState(0)

  const { isAuthenticated, user, logout, loading } = useAuth()

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed')
      if (saved === 'true') setIsCollapsed(true)
    } catch {}
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  useEffect(() => {
    const fetchBadgeCount = () => {
      if (isAuthenticated) {
        bulkInquiryService
          .getBulkInquiries(0, 1, 'PENDING')
          .then((res) => setPendingInquiryCount(res.totalElements))
          .catch(console.error)

        fetch('/api/admin/emi-enquiries?status=NEW')
          .then((res) => res.json())
          .then((data) => {
            if (data.success && typeof data.total === 'number') {
              setPendingEmiCount(data.total)
            }
          })
          .catch(() => {})
      }
    }

    fetchBadgeCount()

    const handleStatusChange = (e: any) => {
      if (e.detail?.oldStatus === 'PENDING' && e.detail?.newStatus !== 'PENDING') {
        setPendingInquiryCount((prev) => Math.max(0, prev - 1))
      }
      fetchBadgeCount()
    }

    window.addEventListener('bulkInquiryStatusChanged', handleStatusChange)
    return () => window.removeEventListener('bulkInquiryStatusChanged', handleStatusChange)
  }, [isAuthenticated])

  // Close mobile drawer & reset content pane scroll on route change
  useEffect(() => {
    setIsMobileOpen(false)
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0 })
    }
  }, [pathname])

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!isMobileOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobileOpen])

  // Redirect to login if not authenticated (skip for login page itself)
  useEffect(() => {
    if (!loading && !isAuthenticated && pathname !== '/admin/login') {
      const timer = setTimeout(() => {
        router.push('/admin/login')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loading, isAuthenticated, pathname, router])

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: 'Overview',
        items: [{ label: 'Overview', icon: FaChartSimple, href: '/admin', exact: true }],
      },
      {
        title: 'Sales & Orders',
        items: [
          { label: 'Orders', icon: FaBagShopping, href: '/admin/orders' },
          {
            label: 'Bulk Inquiry',
            icon: FaBoxesPacking,
            href: '/admin/bulk-inquiries',
            badge: pendingInquiryCount,
          },
          {
            label: 'EMI Enquiries',
            icon: FaCreditCard,
            href: '/admin/emi-enquiries',
            badge: pendingEmiCount,
          },
          { label: 'Customers', icon: FaUsers, href: '/admin/customers' },
          { label: 'Reviews', icon: FaStar, href: '/admin/reviews' },
        ],
      },
      {
        title: 'Catalog',
        items: [
          { label: 'Products', icon: FaBox, href: '/admin/products' },
          { label: 'Categories', icon: FaTag, href: '/admin/categories' },
          { label: 'Brands', icon: FaAward, href: '/admin/brands' },
          { label: 'Variant Templates', icon: FaTableColumns, href: '/admin/variant-templates' },
          { label: 'Spec Templates', icon: FaListCheck, href: '/admin/spec-templates' },
        ],
      },
      {
        title: 'Delivery',
        items: [
          { label: 'Delivery Zones', icon: FaMapLocationDot, href: '/admin/locations' },
          { label: 'Delivery Partners', icon: FaMotorcycle, href: '/admin/delivery-partners' },
        ],
      },
      {
        title: 'Storefront',
        items: [
          { label: 'Banners', icon: FaImage, href: '/admin/banners' },
          { label: 'Feature Images', icon: FaImage, href: '/admin/common-images' },
          { label: 'Instagram Reels', icon: FaInstagram, href: '/admin/reels' },
          { label: 'FAQs', icon: FaCircleQuestion, href: '/admin/faqs' },
        ],
      },
      {
        title: 'System',
        items: [
          { label: 'Staff', icon: FaUserPlus, href: '/admin/staff' },
          { label: 'Store Settings', icon: FaGear, href: '/admin/settings' },
        ],
      },
    ],
    [pendingInquiryCount, pendingEmiCount]
  )

  const currentSectionTitle = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        const match = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
        if (match) return item.label
      }
    }
    return 'Admin Panel'
  }, [navGroups, pathname])

  // Show login page without admin shell
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const userInitial = (user?.name || 'A').trim().charAt(0).toUpperCase()
  const isDark = mounted && resolvedTheme === 'dark'

  const renderSidebarContent = (compact: boolean) => (
    <>
      {/* Pinned Sidebar Brand Header */}
      <div
        className={`h-16 shrink-0 border-b border-border flex items-center ${
          compact ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <Link
          href="/admin"
          className={`flex items-center gap-3 min-w-0 ${compact ? 'justify-center' : ''}`}
          title="Manoj Mobiles Admin"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <FaTableColumns size={16} />
          </span>
          {!compact && (
            <div className="min-w-0 leading-tight">
              <p className="font-black text-sm tracking-tight text-foreground truncate">
                Manoj Mobiles
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground truncate">
                Admin Console
              </p>
            </div>
          )}
        </Link>

        {/* Close button (mobile drawer only) */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <FaXmark size={18} />
        </button>
      </div>

      {/* Independently Scrollable Sidebar Nav */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2.5 py-4 space-y-5"
      >
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!compact ? (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/75">
                {group.title}
              </p>
            ) : (
              <div className="mx-3 my-2 border-t border-border/60 first:hidden" />
            )}

            {group.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={compact ? item.label : undefined}
                  className={`relative group flex items-center rounded-xl text-sm font-semibold transition-all ${
                    compact ? 'justify-center px-0 py-2.5 mx-1' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {!compact && <span className="truncate flex-1">{item.label}</span>}

                  {item.badge !== undefined && item.badge > 0 && (
                    compact ? (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-blue-500 ring-2 ring-card" />
                    ) : (
                      <span
                        className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Pinned Sidebar Footer */}
      <div className="shrink-0 border-t border-border p-3 bg-card space-y-2">
        {user && !compact && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-muted/50">
            <div className="size-8 shrink-0 rounded-lg bg-primary/10 text-primary font-black text-xs grid place-items-center">
              {userInitial}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {user.role || 'ADMIN'}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          title={compact ? 'Sign out' : undefined}
          className={`flex w-full items-center rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors ${
            compact ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <FaRightFromBracket size={15} className="shrink-0" />
          {!compact && <span>Sign out</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 flex h-dvh w-full overflow-hidden bg-background">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* PART 1 (Mobile): Slide-Over Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-card flex flex-col shadow-2xl transition-transform duration-200 ease-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* PART 1 (Desktop): Fixed Independent Left Sidebar */}
      <aside
        className={`hidden lg:flex h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-out ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* PART 2: Independent Right Content Pane (Top Header + Scrollable Canvas) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Pinned Top Bar */}
        <header className="h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden inline-flex items-center justify-center size-9 rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              <FaBars size={15} />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex items-center justify-center size-9 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>

            {/* Breadcrumb / Current Section */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">
                Admin
              </span>
              <span className="hidden sm:inline text-xs text-muted-foreground/50">/</span>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                {currentSectionTitle}
              </h2>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle theme"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="inline-flex items-center justify-center size-9 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            )}

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              <span className="hidden sm:inline">View Store</span>
              <FaArrowUpRightFromSquare size={11} />
            </Link>
          </div>
        </header>

        {/* Independently Scrollable Main Content Area */}
        <div
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-muted/30"
        >
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  )
}
