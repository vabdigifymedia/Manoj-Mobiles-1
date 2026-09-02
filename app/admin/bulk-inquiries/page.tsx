'use client'

import React, { useState, useEffect } from 'react'
import { FaBoxesPacking, FaInbox, FaRotateRight, FaBuilding, FaMobile, FaEnvelope, FaPhone, FaEye, FaXmark } from 'react-icons/fa6'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { bulkInquiryService, type BulkInquiryItem } from '@/lib/bulkInquiryService'

export default function AdminBulkInquiriesPage() {
  const [inquiries, setInquiries] = useState<BulkInquiryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<BulkInquiryItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const data = await bulkInquiryService.getBulkInquiries(0, 50, statusFilter === 'ALL' ? undefined : statusFilter)
      setInquiries(data.content || [])
    } catch (err) {
      console.error('Failed to load bulk inquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Bulk Inquiries</h1>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-0.5 text-xs font-extrabold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {inquiries.length} {inquiries.length === 1 ? 'Inquiry' : 'Inquiries'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage bulk orders and commercial quotes requested by customers & businesses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as string)}>
            <SelectTrigger className="w-[140px] h-9 bg-card border-border shadow-xs text-xs font-bold">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Inquiries</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs h-9 font-bold text-foreground shadow-xs hover:bg-muted transition-colors disabled:opacity-50 active:scale-95"
          >
            <FaRotateRight size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Loading bulk inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 sm:p-12 text-center shadow-xs">
          <div className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary mb-5 shadow-inner">
            <FaInbox size={36} />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-foreground">No Bulk Inquiries Yet</h2>
          
          <p className="max-w-md text-sm text-muted-foreground/80 mb-6 leading-relaxed">
            When customers submit the bulk inquiry form, their requests will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Customer & Company</th>
                  <th className="px-5 py-3.5">Contact Info</th>
                  <th className="px-5 py-3.5">Requested Product</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    
                    {/* Customer & Company */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground">{item.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mt-0.5">
                        <FaBuilding size={11} className="text-slate-400 shrink-0" />
                        <span>{item.companyName}</span>
                        {item.gstin && (
                          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                            GST: {item.gstin}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 text-xs font-medium space-y-1">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <FaPhone size={11} className="text-primary shrink-0" />
                        <span>{item.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FaEnvelope size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{item.email}</span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FaMobile size={14} className="text-primary shrink-0" />
                        <span className="font-extrabold text-foreground line-clamp-1">
                          {item.productName}
                        </span>
                      </div>
                      {item.variantName && (
                        <div className="mt-1 text-xs text-muted-foreground font-semibold flex items-center gap-1">
                          <span>Variant:</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground font-bold">
                            {item.variantName}
                          </span>
                        </div>
                      )}
                      {item.requirements && (
                        <p className="mt-1 text-[11px] text-muted-foreground italic line-clamp-1 max-w-xs">
                          &quot;{item.requirements}&quot;
                        </p>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary border border-primary/20">
                        {item.estimatedQuantity} Units
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap font-medium">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Select
                        value={item.status}
                        disabled={item.status === 'RESOLVED' || item.status === 'REJECTED'}
                        onValueChange={async (newStatus) => {
                          const oldStatus = item.status
                          try {
                            // Optimistically update
                            setInquiries(inqs => inqs.map(i => i.id === item.id ? { ...i, status: newStatus as any } : i))
                            await bulkInquiryService.updateBulkInquiryStatus(item.id, newStatus as string)
                            toast.success('Status updated successfully')
                            window.dispatchEvent(new CustomEvent('bulkInquiryStatusChanged', { detail: { oldStatus, newStatus } }))
                          } catch (err) {
                            // Revert on error
                            setInquiries(inqs => inqs.map(i => i.id === item.id ? { ...i, status: oldStatus } : i))
                            toast.error('Failed to update status')
                          }
                        }}
                      >
                        <SelectTrigger className={`h-7 px-2.5 py-1 text-[11px] font-bold rounded-full ${
                          item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 focus:ring-amber-500' :
                          item.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 focus:ring-blue-500' :
                          item.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 focus:ring-emerald-500' :
                          'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 focus:ring-rose-500'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING" disabled={item.status !== 'PENDING'}>Pending</SelectItem>
                          <SelectItem value="IN_PROGRESS" disabled={item.status === 'RESOLVED' || item.status === 'REJECTED'}>In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedInquiry(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <FaEye size={12} />
                        View
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="text-lg font-black text-foreground">Inquiry Details</h3>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              >
                <FaXmark size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Customer Name</span>
                  <p className="font-semibold text-foreground">{selectedInquiry.name}</p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Company</span>
                  <p className="font-semibold text-foreground">{selectedInquiry.companyName}</p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Mobile Number</span>
                  <p className="font-semibold text-foreground">{selectedInquiry.mobileNumber}</p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Address</span>
                  <p className="font-semibold text-foreground">{selectedInquiry.email}</p>
                </div>
                {selectedInquiry.gstin && (
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">GSTIN</span>
                    <p className="font-mono text-xs font-bold text-foreground bg-muted p-1.5 rounded inline-block">{selectedInquiry.gstin}</p>
                  </div>
                )}
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Estimated Quantity</span>
                  <p className="font-black text-primary">{selectedInquiry.estimatedQuantity} Units</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-2">
                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Requested Product</span>
                <div className="p-3 bg-muted/50 rounded-xl border border-border flex flex-col gap-1">
                  <p className="font-bold text-foreground text-base">{selectedInquiry.productName}</p>
                  {selectedInquiry.variantName && (
                    <p className="text-sm font-semibold text-muted-foreground">Variant: <span className="text-foreground">{selectedInquiry.variantName}</span></p>
                  )}
                </div>
              </div>

              {selectedInquiry.requirements && (
                <div className="pt-2">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Requirements / Notes</span>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-sm rounded-xl whitespace-pre-wrap font-medium">
                    {selectedInquiry.requirements}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
