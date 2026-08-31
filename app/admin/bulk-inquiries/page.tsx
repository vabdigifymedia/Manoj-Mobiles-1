'use client'

import React, { useState, useEffect } from 'react'
import { FaBoxesPacking, FaInbox, FaRotateRight, FaBuilding, FaMobile, FaEnvelope, FaPhone } from 'react-icons/fa6'
import { bulkInquiryService, BulkInquiryItem } from '@/lib/bulkInquiryService'

/**
 * Admin Panel — Bulk Inquiries Page
 * Route: /admin/bulk-inquiries
 * 
 * FUTURE BACKEND INTEGRATION INSTRUCTIONS:
 * ----------------------------------------
 * Currently this page calls `bulkInquiryService.getBulkInquiries()` which fetches
 * local mock submissions. When the API endpoint is available:
 * Replace `bulkInquiryService.getBulkInquiries()` with actual GET endpoint call.
 */
export default function AdminBulkInquiriesPage() {
  const [inquiries, setInquiries] = useState<BulkInquiryItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      // Future API Call: GET /api/admin/bulk-inquiries
      const data = await bulkInquiryService.getBulkInquiries()
      setInquiries(data)
    } catch (err) {
      console.error('Failed to load bulk inquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

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

        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-colors disabled:opacity-50 active:scale-95"
        >
          <FaRotateRight size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Loading bulk inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        /* ===================================================
         * EMPTY STATE DESIGN
         * Rendered when no inquiries have been received yet.
         * =================================================== */
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 sm:p-12 text-center shadow-xs">
          <div className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary mb-5 shadow-inner">
            <FaInbox size={36} />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-foreground">No Bulk Inquiries Yet</h2>
          
          <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed font-medium">
            Bulk inquiries submitted by customers will appear here. When customers request custom pricing from product cards or the home page, their requirements will be listed in this panel.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground border border-border">
            <FaBoxesPacking size={14} className="text-primary" />
            <span>Architecture ready for future API integration</span>
          </div>
        </div>
      ) : (
        /* Inquiries Table (Populated if customer submits form in frontend testing) */
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Inquiry ID</th>
                  <th className="px-5 py-3.5">Customer & Company</th>
                  <th className="px-5 py-3.5">Contact Info</th>
                  <th className="px-5 py-3.5">Requested Product</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    
                    {/* ID */}
                    <td className="px-5 py-4 font-mono font-bold text-xs text-primary whitespace-nowrap">
                      {item.id}
                    </td>

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
                        <span>{item.mobile}</span>
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
                          {item.mobileCompany ? `${item.mobileCompany} ` : ''}{item.productName}
                        </span>
                      </div>
                      {item.selectedColor && (
                        <div className="mt-1 text-xs text-muted-foreground font-semibold flex items-center gap-1">
                          <span>Colour:</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground font-bold">
                            {item.selectedColor}
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
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
