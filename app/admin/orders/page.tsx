'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaFilter, FaCircleCheck, FaArrowLeft, FaArrowRotateLeft, FaBox, FaClock, FaMagnifyingGlass, FaTruckFast, FaCircleXmark, FaMotorcycle, FaChevronRight } from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { OrderResponseDTO, DeliveryPartnerResponseDTO } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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

  // Drawer States
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  // Delivery Partner
  const [activePartners, setActivePartners] = useState<DeliveryPartnerResponseDTO[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [assigning, setAssigning] = useState(false)

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
      return
    }
    setSelectedOrder(order)
    setSelectedPartnerId(order.deliveryPartnerInfo?.id || '')
    setIsSheetOpen(true)
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await apiClient.updateAdminOrderStatus(orderId, { status })
      await loadOrders(page)
      // Update selected order details if drawer is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, orderStatus: status as any } : null)
      }
    } catch (error) {
      console.error('Failed to update status', error)
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

  const handleAssignPartner = async () => {
    if (!selectedOrder || !selectedPartnerId) return
    
    if (selectedOrder.deliveryType !== 'HYPERLOCAL') {
      alert("Error: Delivery partners can only be assigned to HYPERLOCAL orders. Standard orders are handled by courier partners.")
      return
    }

    try {
      setAssigning(true)
      await apiClient.assignAdminOrderPartner(selectedOrder.id, selectedPartnerId)
      await loadOrders(page)
      setIsSheetOpen(false)
    } catch (error) {
      console.error('Failed to assign partner', error)
    } finally {
      setAssigning(false)
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

      {/* Center Order Details Modal (Dialog) */}
      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DialogContent className="w-screen h-[100dvh] max-w-none rounded-none border-0 !p-4 overflow-y-auto sm:w-[95vw] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl sm:rounded-xl sm:border sm:!p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black">Order {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder && new Date(selectedOrder.placedAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-8 pb-10">
              
              {/* Interactive Status Stepper */}
              <div className="bg-white dark:bg-zinc-900/50 p-4 sm:p-6 rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Order Progress</h4>
                  <span className={`inline-flex px-2 py-1 rounded text-[10px] sm:text-xs font-bold border ${selectedOrder.deliveryType === 'HYPERLOCAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                    {selectedOrder.deliveryType}
                  </span>
                </div>
                
                <div className="relative flex justify-between items-start mt-6 mx-auto w-full max-w-lg overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 hide-scrollbar px-1 sm:px-0">
                  {/* Connecting Line */}
                  <div className="absolute left-[12%] right-[12%] sm:left-[10%] sm:right-[10%] top-3 sm:top-4 h-[2px] bg-muted dark:bg-border -z-10" />
                  
                  {['PLACED', 'PACKED', selectedOrder.deliveryType === 'HYPERLOCAL' ? 'OUT_FOR_DELIVERY' : 'SHIPPED', 'DELIVERED'].map((step, idx) => {
                    const mappedStep = step === 'OUT_FOR_DELIVERY' ? 'SHIPPED' : step;
                    const currentStatusIdx = statusOrder.indexOf(selectedOrder.orderStatus);
                    const thisStepIdx = statusOrder.indexOf(step);
                    
                    const isCompleted = currentStatusIdx >= thisStepIdx;
                    const isCurrent = currentStatusIdx === thisStepIdx;
                    const isNext = currentStatusIdx === thisStepIdx - 1;
                    
                    return (
                      <div key={step} className="flex flex-col items-center relative group w-16 sm:w-24 shrink-0">
                        <div className={`size-6 sm:size-8 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[11px] transition-all duration-300 ring-4 ring-background z-10 ${
                          isCompleted ? 'bg-primary text-primary-foreground scale-110 shadow-md' : 'bg-muted text-muted-foreground border-2 border-transparent'
                        }`}>
                          {isCompleted ? <FaCircleCheck className="size-3 sm:size-3.5" /> : idx + 1}
                        </div>
                        <span className={`text-[9px] sm:text-xs font-bold text-center mt-2 sm:mt-3 transition-colors px-0.5 sm:px-1 w-full break-words ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                          {step.replace(/_/g, ' ')}
                        </span>
                        
                        {/* Quick Action Button for next step */}
                        {isNext && selectedOrder.deliveryType !== 'HYPERLOCAL' && step !== 'OUT_FOR_DELIVERY' && (
                          <div className="mt-2 sm:mt-3">
                            <button 
                              onClick={() => handleUpdateStatus(selectedOrder.id, step)}
                              className="text-[9px] sm:text-[10px] font-bold bg-primary text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-sm whitespace-nowrap"
                            >
                              Mark {step.split('_')[0]}
                            </button>
                          </div>
                        )}
                        
                        {/* Prompt for assignment if next step is OUT_FOR_DELIVERY for hyperlocal */}
                        {isNext && selectedOrder.deliveryType === 'HYPERLOCAL' && step === 'OUT_FOR_DELIVERY' && (
                          <div className="mt-2 sm:mt-3 text-[8px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 text-center bg-amber-100 dark:bg-amber-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                            Assign boy
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Delivery Assignment Panel */}
              {selectedOrder.orderStatus !== 'DELIVERED' && selectedOrder.orderStatus !== 'CANCELLED' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <FaMotorcycle /> Delivery Partner Assignment
                  </h4>
                  
                  {selectedOrder.deliveryPartnerInfo ? (
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Assigned Partner</p>
                        <p className="font-bold text-lg">{selectedOrder.deliveryPartnerInfo.name}</p>
                        <p className="text-sm text-muted-foreground mt-1 bg-muted/50 inline-block px-2 py-0.5 rounded-md font-mono">{selectedOrder.deliveryPartnerInfo.phone} • {selectedOrder.deliveryPartnerInfo.vehicleNo}</p>
                      </div>
                      <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <FaCircleCheck size={20} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Select a delivery boy to assign this order. This will instantly start live tracking.</p>
                      
                      <Select value={selectedPartnerId} onValueChange={(val) => setSelectedPartnerId(val || '')}>
                        <SelectTrigger className="w-full !bg-white dark:!bg-zinc-900 border-border rounded-xl px-4 h-12 text-sm font-semibold shadow-sm focus:ring-emerald-500">
                          {selectedPartnerId ? (
                            <span>{activePartners.find(p => p.id === selectedPartnerId)?.name} ({activePartners.find(p => p.id === selectedPartnerId)?.vehicleNo})</span>
                          ) : (
                            <span className="text-muted-foreground">Select a Delivery Partner...</span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {activePartners.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.vehicleNo})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <button 
                        onClick={handleAssignPartner}
                        disabled={!selectedPartnerId || assigning}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {assigning ? 'Assigning...' : 'Assign Partner & Dispatch'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="font-bold mb-4 flex items-center gap-2"><FaBox className="text-muted-foreground" /> Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map(item => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-border bg-card">
                      <div className="size-16 bg-muted rounded-lg overflow-hidden shrink-0">
                        {item.primaryImageUrl ? (
                          <img src={item.primaryImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><FaBox /></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm line-clamp-2">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.qty}</p>
                      </div>
                      <div className="text-right font-bold text-sm">
                        {formatINR(item.price * item.qty)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Customer & Address</h4>
                <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                  <p className="font-black text-lg mb-2">{selectedOrder.address?.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedOrder.address?.addressLine}<br />
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} - <span className="font-mono">{selectedOrder.address?.pincode}</span>
                  </p>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
