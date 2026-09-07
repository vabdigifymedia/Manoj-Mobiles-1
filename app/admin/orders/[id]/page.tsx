'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient, formatINR } from '@/lib/apiClient'
import type { OrderResponseDTO, DeliveryPartnerDTO } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TrackingTimeline from '@/components/ui/order-history'
import { ClipboardCheck, Package, Ship, Bike, Home } from 'lucide-react'
import {
  FaChevronLeft, FaClock, FaTruck,
  FaMotorcycle, FaWallet, FaMapPin, FaFileInvoice,
  FaCircleCheck, FaTriangleExclamation, FaBox
} from 'react-icons/fa6'

const statusOrder = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function AdminOrderDetailsPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [order, setOrder] = useState<OrderResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePartners, setActivePartners] = useState<DeliveryPartnerDTO[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [assigning, setAssigning] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchOrder()
    fetchPartners()
  }, [id])

  const fetchOrder = async () => {
    try {
      const res = await apiClient.getAdminOrderById(id)
      setOrder(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchPartners = async () => {
    try {
      const res = await apiClient.getActiveDeliveryPartners()
      setActivePartners(res.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (!order) return;
    setUpdatingStatus(true)
    try {
      await apiClient.updateAdminOrderStatus(order.id, { status })
      setOrder(prev => prev ? { ...prev, orderStatus: status as any } : null)
    } catch (e) {
      console.error('Failed to update status', e)
      alert('Failed to update order status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAssignPartner = async () => {
    if (!order || !selectedPartnerId) return
    if (order.deliveryType !== 'HYPERLOCAL') {
      alert("Only HYPERLOCAL orders can be assigned to delivery boys.")
      return
    }
    setAssigning(true)
    try {
      await apiClient.assignAdminOrderPartner(order.id, selectedPartnerId)
      await fetchOrder()
    } catch (e) {
      console.error(e)
      alert('Failed to assign partner.')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-black mb-4">Order Not Found</h2>
        <Link href="/admin/orders" className="text-primary hover:underline">Return to Orders</Link>
      </div>
    )
  }

  // Calculate Next Action
  let nextStep: string | null = null;
  const currentStatusIdx = statusOrder.indexOf(order.orderStatus);
  if (currentStatusIdx >= 0 && currentStatusIdx < statusOrder.length - 1) {
    nextStep = statusOrder[currentStatusIdx + 1]
    if (order.deliveryType === 'HYPERLOCAL' && nextStep === 'SHIPPED') nextStep = 'OUT_FOR_DELIVERY'
    if (order.deliveryType !== 'HYPERLOCAL' && nextStep === 'OUT_FOR_DELIVERY') nextStep = 'SHIPPED'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white dark:bg-zinc-900 border border-border p-6 sm:p-8 rounded-3xl shadow-sm">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <FaChevronLeft size={12} /> Back to Orders
          </Link>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-black tracking-tight">Order #{order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.deliveryType === 'HYPERLOCAL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'}`}>
              {order.deliveryType}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Placed on {new Date(order.placedAt).toLocaleString()}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                  handleUpdateStatus('CANCELLED')
                }
              }}
              disabled={updatingStatus}
              className="text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}

          {order.orderStatus !== 'CANCELLED' && nextStep && (
            nextStep === 'OUT_FOR_DELIVERY' && order.deliveryType === 'HYPERLOCAL' && !order.deliveryPartnerInfo ? (
              <div className="text-sm font-bold text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 px-5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 shadow-sm">
                Assign Delivery Partner to Dispatch
              </div>
            ) : (
              <button
                onClick={() => handleUpdateStatus(nextStep!)}
                disabled={updatingStatus}
                className="text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : `Mark as ${nextStep.replace(/_/g, ' ')}`}
              </button>
            )
          )}
        </div>
      </div>

      {/* HORIZONTAL PROGRESS TRACKER */}
      <div className="bg-white dark:bg-zinc-900 border border-border p-6 sm:p-10 rounded-3xl shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Order Status</h4>
        <div className="overflow-x-auto hide-scrollbar w-full pt-4">
          <div className="min-w-[500px]">
            <TrackingTimeline
              direction="horizontal"
              items={(order.deliveryType === 'HYPERLOCAL'
                ? ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']
                : ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']
              ).map((step, idx) => {
                const currentIdx = statusOrder.indexOf(order.orderStatus);
                const stepIdx = statusOrder.indexOf(step);
                const isCompleted = currentIdx >= stepIdx || (order.orderStatus === 'DELIVERED');
                const isCurrent = currentIdx === stepIdx && order.orderStatus !== 'DELIVERED';
                const isNext = currentIdx === stepIdx - 1;

                let status: 'completed' | 'in-progress' | 'pending' = 'pending';
                if (isCompleted) {
                  status = 'completed';
                } else if (isNext && order.orderStatus !== 'CANCELLED') {
                  status = 'in-progress';
                }

                let stepIcon;
                const iconClass = "h-4 w-4";
                switch (step) {
                  case 'PLACED': stepIcon = <ClipboardCheck className={iconClass} />; break;
                  case 'CONFIRMED': stepIcon = <FaCircleCheck className={iconClass} />; break;
                  case 'PACKED': stepIcon = <Package className={iconClass} />; break;
                  case 'SHIPPED': stepIcon = <Ship className={iconClass} />; break;
                  case 'OUT_FOR_DELIVERY': stepIcon = <Bike className={iconClass} />; break;
                  case 'DELIVERED': stepIcon = <Home className={iconClass} />; break;
                }

                let actionNode = undefined;
                if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED') {
                  if (isNext && order.deliveryType !== 'HYPERLOCAL' && step !== 'OUT_FOR_DELIVERY') {
                    actionNode = (
                      <button
                        onClick={() => handleUpdateStatus(step)}
                        disabled={updatingStatus}
                        className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-sm whitespace-nowrap"
                      >
                        {updatingStatus ? '...' : `Mark ${step.split('_')[0]}`}
                      </button>
                    );
                  }

                  if (isNext && order.deliveryType === 'HYPERLOCAL' && step === 'OUT_FOR_DELIVERY' && !order.deliveryPartnerInfo) {
                    actionNode = (
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900/50 whitespace-nowrap">
                        Assign boy
                      </div>
                    );
                  } else if (isNext && order.deliveryType === 'HYPERLOCAL' && step === 'OUT_FOR_DELIVERY' && order.deliveryPartnerInfo) {
                    actionNode = (
                      <button
                        onClick={() => handleUpdateStatus(step)}
                        disabled={updatingStatus}
                        className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-sm whitespace-nowrap"
                      >
                        {updatingStatus ? '...' : 'Dispatch'}
                      </button>
                    );
                  } else if (isNext && step === 'DELIVERED') {
                    actionNode = (
                      <button
                        onClick={() => handleUpdateStatus(step)}
                        disabled={updatingStatus}
                        className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-sm whitespace-nowrap"
                      >
                        {updatingStatus ? '...' : 'Mark Delivered'}
                      </button>
                    );
                  }
                }

                return {
                  id: step,
                  title: step.replace(/_/g, ' '),
                  date: isCompleted ? (idx === 0 ? new Date(order.placedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric' }) : 'Done') : 'Pending',
                  status,
                  icon: stepIcon,
                  actionNode
                }
              })}
            />
          </div>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* MAIN COLUMN (65-70%) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Order Items */}
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2"><FaBox className="text-muted-foreground" /> Items in Order</h3>
            </div>
            <div className="divide-y divide-border">
              {order.orderItems?.map(item => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="size-20 sm:size-24 bg-muted rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.primaryImageUrl ? (
                      <img src={item.primaryImageUrl} alt={item.productName} className="object-cover w-full h-full" />
                    ) : (
                      <FaBox className="text-muted-foreground text-2xl" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-base line-clamp-2">{item.productName}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Variant: {item.variantName || 'Default'}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-lg">Qty: {item.qty}</div>
                      <div className="font-black text-lg">{formatINR(item.subtotal || (item.price * item.qty))}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-slate-50 dark:bg-zinc-950/50">
              <h3 className="text-lg font-black tracking-tight">Payment Summary</h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-semibold text-base">{formatINR(order.orderItems?.reduce((acc, item) => acc + (item.subtotal || (item.price * item.qty)), 0) || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Delivery Charge</span>
                <span className="font-semibold text-base">{formatINR(order.deliveryCharge || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Taxes (GST)</span>
                <span className="font-semibold text-base">{formatINR(order.gstAmount || 0)}</span>
              </div>
              {(order.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 -mx-4 px-4 py-2 rounded-lg">
                  <span className="font-bold">Discount Applied</span>
                  <span className="font-bold">-{formatINR(order.discountAmount || 0)}</span>
                </div>
              )}
              <hr className="border-border border-dashed my-4" />
              <div className="flex justify-between items-center">
                <span className="font-black text-xl tracking-tight">Grand Total</span>
                <span className="font-black text-3xl text-primary">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Invoice */}
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2"><FaFileInvoice className="text-indigo-500" /> Invoice</h3>
            {order.invoiceNumber ? (
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Invoice Number</p>
                  <p className="font-mono font-bold">{order.invoiceNumber}</p>
                </div>
                <button className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors">
                  Download PDF
                </button>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border border-dashed text-center">
                <p className="text-sm font-medium text-muted-foreground">Invoice will be generated upon confirmation.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR (30-35%) */}
        <div className="lg:col-span-1 space-y-6">

          {/* Delivery Assignment Panel */}
          {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && order.deliveryType === 'HYPERLOCAL' && !order.deliveryPartnerInfo && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
              <h4 className="text-base font-black text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <FaMotorcycle /> Assign Partner
              </h4>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-medium">Select a delivery boy to assign this order and start live tracking.</p>

                <Select value={selectedPartnerId} onValueChange={(val) => setSelectedPartnerId(val || '')}>
                  <SelectTrigger className="w-full !bg-white dark:!bg-zinc-900 border-emerald-200 dark:border-emerald-800 rounded-xl px-4 h-12 text-sm font-bold shadow-sm focus:ring-emerald-500">
                    {selectedPartnerId ? (
                      <span>{activePartners.find(p => p.id === selectedPartnerId)?.name} ({activePartners.find(p => p.id === selectedPartnerId)?.vehicleNo})</span>
                    ) : (
                      <span className="text-muted-foreground">Select Partner...</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {activePartners.map(p => (
                      <SelectItem key={p.id} value={p.id} className="font-medium">{p.name} ({p.vehicleNo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  onClick={handleAssignPartner}
                  disabled={!selectedPartnerId || assigning}
                  className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {assigning ? 'Assigning...' : 'Assign & Dispatch'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white dark:bg-zinc-900 border border-border p-6 rounded-3xl shadow-sm">
            <h4 className="font-black text-base tracking-tight flex items-center gap-2 mb-6"><FaWallet className="text-primary" /> Payment Info</h4>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Method</p>
                <p className="font-bold text-sm bg-slate-50 dark:bg-zinc-800 px-3 py-2 rounded-lg">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${order.paymentStatus === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    order.paymentStatus === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }`}>
                  {order.paymentStatus === 'SUCCESS' ? <FaCircleCheck /> : order.paymentStatus === 'FAILED' ? <FaTriangleExclamation /> : <FaClock />}
                  {order.paymentStatus}
                </span>
              </div>
              {order.txnId && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Transaction ID</p>
                  <p className="font-mono text-sm break-all bg-slate-50 dark:bg-zinc-800 p-2.5 rounded-lg font-medium">{order.txnId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white dark:bg-zinc-900 border border-border p-6 rounded-3xl shadow-sm">
            <h4 className="font-black text-base tracking-tight flex items-center gap-2 mb-6">
              {order.deliveryType === 'STANDARD' ? <FaTruck className="text-blue-500" /> : <FaMotorcycle className="text-emerald-500" />}
              Delivery Details
            </h4>

            {order.deliveryType === 'STANDARD' ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Courier Partner</p>
                  <p className="font-bold text-sm bg-slate-50 dark:bg-zinc-800 px-3 py-2 rounded-lg">{order.courierPartner || 'Not assigned yet'}</p>
                </div>
                {order.trackingId && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tracking ID</p>
                    <a
                      href={`https://www.google.com/search?q=track+${order.trackingId}+${order.courierPartner || ''}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block font-mono text-sm text-blue-600 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg font-bold"
                    >
                      {order.trackingId}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Assigned Partner</p>
                {order.deliveryPartnerInfo ? (
                  <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-xl border border-border">
                    <p className="font-bold text-base">{order.deliveryPartnerInfo.name}</p>
                    <p className="text-sm text-muted-foreground mt-1 font-mono font-medium">{order.deliveryPartnerInfo.phone}</p>
                    <div className="mt-3 inline-block px-2.5 py-1 bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold shadow-sm border border-border">
                      🚗 {order.deliveryPartnerInfo.vehicleNo}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-900/40">Pending Assignment</p>
                )}
              </div>
            )}
          </div>

          {/* Customer Address */}
          <div className="bg-white dark:bg-zinc-900 border border-border p-6 rounded-3xl shadow-sm">
            <h4 className="font-black text-base tracking-tight flex items-center gap-2 mb-6"><FaMapPin className="text-rose-500" /> Delivery Address</h4>
            <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-2xl space-y-1">
              <p className="font-black text-sm text-foreground mb-2">{order.address?.label || 'Delivery Address'}</p>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{order.address?.addressLine}</p>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{order.address?.city}, {order.address?.state}</p>
              <p className="text-sm font-mono font-bold text-foreground mt-2 pt-2 border-t border-border/50">{order.address?.pincode}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
