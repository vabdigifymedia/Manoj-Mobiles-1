'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaFilter, FaCircleCheck, FaArrowLeft, FaArrowRotateLeft, FaBox, FaClock, FaMagnifyingGlass, FaTruckFast, FaCircleXmark, FaMotorcycle, FaChevronRight, FaWallet, FaTruck, FaFileInvoice, FaTriangleExclamation, FaMapPin } from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { OrderResponseDTO, DeliveryPartnerResponseDTO } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  PLACED: { color: 'bg-amber-100 text-amber-700', icon: FaClock },
  CONFIRMED: { color: 'bg-blue-100 text-blue-700', icon: FaCircleCheck },
  PACKED: { color: 'bg-indigo-100 text-indigo-700', icon: FaBox },
  SHIPPED: { color: 'bg-purple-100 text-purple-700', icon: FaTruckFast },
  OUT_FOR_DELIVERY: { color: 'bg-cyan-100 text-cyan-700', icon: FaTruckFast },
  DELIVERED: { color: 'bg-emerald-100 text-emerald-700', icon: FaCircleCheck },
  CANCELLED: { color: 'bg-red-100 text-red-700', icon: FaCircleXmark },
  RETURNED: { color: 'bg-gray-100 text-gray-700', icon: FaArrowRotateLeft },
}

const statusOrder = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // Tabs & Selection
  const [activeTab, setActiveTab] = useState('ALL')
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [isBulkActing, setIsBulkActing] = useState(false)
  const [isBulkAssignMode, setIsBulkAssignMode] = useState(false)
  
  // Delivery Partner
  const [activePartners, setActivePartners] = useState<DeliveryPartnerResponseDTO[]>([])

  const loadOrders = async (p: number) => {
    try {
      setLoading(true)
      const res = await apiClient.getAdminOrders(p, 20)
      setOrders(res.data.data.content || [])
      setTotalPages(res.data.data.totalPages || 0)
      setTotalElements(res.data.data.totalElements || 0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const loadPartners = async () => {
    try {
      const res = await apiClient.getActiveDeliveryPartners()
      setActivePartners(res.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { 
    loadOrders(page) 
    loadPartners()
  }, [page])

  // Computed Filtered Orders for Tabs
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return ['PLACED', 'CONFIRMED'].includes(o.orderStatus);
    if (activeTab === 'HYPERLOCAL_UNASSIGNED') return o.deliveryType === 'HYPERLOCAL' && !o.deliveryPartnerInfo && o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED';
    if (activeTab === 'COMPLETED') return o.orderStatus === 'DELIVERED';
    return true;
  })

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)))
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSet = new Set(selectedOrderIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedOrderIds(newSet)
  }

  // Action Handlers
  const handleRowClick = (order: OrderResponseDTO) => {
    if (isBulkAssignMode) {
      const newSet = new Set(selectedOrderIds)
      if (newSet.has(order.id)) newSet.delete(order.id)
      else newSet.add(order.id)
      setSelectedOrderIds(newSet)
    } else {
      router.push(`/admin/orders/${order.id}`)
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedOrderIds.size === 0) return
    setIsBulkActing(true)
    try {
      const promises = Array.from(selectedOrderIds).map(id => apiClient.updateAdminOrderStatus(id, { status }))
      await Promise.all(promises)
      setSelectedOrderIds(new Set())
      await loadOrders(page)
    } catch (error) {
      console.error('Bulk update failed', error)
    } finally {
      setIsBulkActing(false)
    }
  }


  const handleBulkAssign = async (partnerId: string) => {
    if (selectedOrderIds.size === 0) return
    setIsBulkActing(true)
    try {
      const validOrderIds = Array.from(selectedOrderIds).filter(id => {
        const order = orders.find(o => o.id === id)
        return order?.deliveryType === 'HYPERLOCAL'
      })

      if (validOrderIds.length !== selectedOrderIds.size) {
        alert("Warning: Delivery partners can only be assigned to HYPERLOCAL orders. Standard orders will be ignored.")
      }

      if (validOrderIds.length === 0) {
        setIsBulkActing(false)
        return
      }

      const promises = validOrderIds.map(id => apiClient.assignAdminOrderPartner(id, partnerId))
      await Promise.all(promises)
      setSelectedOrderIds(new Set())
      await loadOrders(page)
    } catch (error) {
      console.error('Bulk assign failed', error)
    } finally {
      setIsBulkActing(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link href="/admin" className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <FaArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and track customer orders ({totalElements} total)</p>
        </div>
        <button 
          onClick={() => {
            setIsBulkAssignMode(!isBulkAssignMode)
            setSelectedOrderIds(new Set())
          }}
          className={`px-4 py-2 font-bold rounded-xl text-sm transition-all border shadow-sm ${isBulkAssignMode ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' : 'bg-background border-border text-foreground hover:bg-muted'}`}
        >
          {isBulkAssignMode ? 'Cancel Bulk Assign' : 'Bulk Assign Mode'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PENDING', label: 'Pending Processing' },
          { id: 'HYPERLOCAL_UNASSIGNED', label: 'Requires Assignment' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedOrderIds(new Set()); }}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {isBulkAssignMode && (
                  <th className="px-6 py-4 w-12">
                    <Checkbox 
                      checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 font-semibold">Order #</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Delivery Type</th>
                <th className="px-6 py-4 font-semibold">Status</th>
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
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted text-muted-foreground mb-4">
                      <FaBox size={24} />
                    </div>
                    <h3 className="text-lg font-bold">No orders found</h3>
                    <p className="text-muted-foreground mt-1">Try changing the tab filter.</p>
                  </td>
                </tr>
              ) : filteredOrders.map(order => {
                const config = statusConfig[order.orderStatus] || statusConfig.PLACED
                const StatusIcon = config.icon
                const isSelected = selectedOrderIds.has(order.id)
                return (
                  <tr 
                    key={order.id} 
                    onClick={() => handleRowClick(order)} 
                    className={`transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                  >
                    {isBulkAssignMode && (
                      <td className="px-6 py-4" onClick={(e) => toggleSelect(order.id, e)}>
                        <Checkbox checked={isSelected} />
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div>{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground font-normal mt-1">{order.orderItems?.length || 0} items</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(order.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${order.deliveryType === 'HYPERLOCAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                        {order.deliveryType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${config.color}`}>
                        <StatusIcon size={12} />
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-right">{formatINR(order.totalAmount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages || 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50 hover:bg-muted transition-colors">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50 hover:bg-muted transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-border">
          <div className="font-bold text-sm flex items-center gap-2">
            <span className="bg-muted px-2 py-1 rounded-md">{selectedOrderIds.size}</span>
            <span>Orders Selected</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <Select 
              value="" 
              onValueChange={(val) => {
                if(val) handleBulkAssign(val);
              }}
              disabled={isBulkActing}
            >
              <SelectTrigger className="text-sm font-bold !bg-emerald-600 hover:!bg-emerald-700 !text-white data-[placeholder]:!text-white px-4 h-10 rounded-xl outline-none cursor-pointer transition-colors border-0 focus:ring-2 focus:ring-emerald-500 w-[180px] sm:w-[220px]">
                <SelectValue placeholder={isBulkActing ? 'Processing...' : 'Bulk Assign Partner...'} />
              </SelectTrigger>
              <SelectContent>
                {activePartners.map(p => (
                  <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-500/30">
                        <FaMotorcycle size={12} />
                      </div>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}


    </div>
  )
}
