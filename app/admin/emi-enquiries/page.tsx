'use client'

import React, { useState, useEffect } from 'react'
import {
  FaCreditCard,
  FaRotateRight,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMobileScreen,
  FaEye,
  FaXmark,
  FaShieldHalved,
  FaFilePdf,
  FaImage,
  FaLock,
  FaMagnifyingGlass,
  FaClock,
  FaCircleCheck,
  FaFileLines,
} from 'react-icons/fa6'
import { toast } from 'sonner'
import type { EmiEnquiryRecord, EmiEnquiryStatus } from '@/lib/emiEnquiryStore'

const STATUS_LABELS: Record<EmiEnquiryStatus, { label: string; color: string; badgeBg: string }> = {
  NEW: { label: 'New', color: 'text-blue-700 dark:text-blue-300', badgeBg: 'bg-blue-500/10 border-blue-500/20' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-700 dark:text-amber-300', badgeBg: 'bg-amber-500/10 border-amber-500/20' },
  MORE_INFO_REQUIRED: { label: 'More Info Required', color: 'text-purple-700 dark:text-purple-300', badgeBg: 'bg-purple-500/10 border-purple-500/20' },
  ELIGIBLE: { label: 'Eligible', color: 'text-emerald-700 dark:text-emerald-300', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  NOT_ELIGIBLE: { label: 'Not Eligible', color: 'text-rose-700 dark:text-rose-300', badgeBg: 'bg-rose-500/10 border-rose-500/20' },
  CLOSED: { label: 'Closed', color: 'text-slate-700 dark:text-slate-300', badgeBg: 'bg-slate-500/10 border-slate-500/20' },
}

export default function AdminEmiEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EmiEnquiryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEnquiry, setSelectedEnquiry] = useState<EmiEnquiryRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [updating, setUpdating] = useState(false)
  const [newNote, setNewNote] = useState('')

  const fetchEnquiries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/admin/emi-enquiries?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setEnquiries(data.data || [])
        if (data.counts) setCounts(data.counts)
      } else {
        toast.error(data.message || 'Failed to fetch enquiries')
      }
    } catch (err) {
      console.error('Failed to load EMI enquiries:', err)
      toast.error('Connection error while fetching enquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnquiries()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchEnquiries()
  }

  const handleStatusUpdate = async (newStatus: EmiEnquiryStatus) => {
    if (!selectedEnquiry) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/emi-enquiries/${selectedEnquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Status updated to ${STATUS_LABELS[newStatus].label}`)
        setSelectedEnquiry(data.data)
        setEnquiries(prev => prev.map(item => (item.id === data.data.id ? data.data : item)))
        fetchEnquiries()
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch {
      toast.error('Network error updating status')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEnquiry || !newNote.trim()) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/emi-enquiries/${selectedEnquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim(), author: 'Admin Staff' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Internal note added')
        setSelectedEnquiry(data.data)
        setEnquiries(prev => prev.map(item => (item.id === data.data.id ? data.data : item)))
        setNewNote('')
      } else {
        toast.error(data.message || 'Failed to add note')
      }
    } catch {
      toast.error('Network error adding note')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-foreground tracking-tight">EMI Eligibility Enquiries</h1>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-0.5 text-xs font-extrabold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {enquiries.length} {enquiries.length === 1 ? 'Enquiry' : 'Enquiries'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer financing enquiries, review identity documents securely, and update partner verification status.
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <FaRotateRight size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(['ALL', 'NEW', 'UNDER_REVIEW', 'MORE_INFO_REQUIRED', 'ELIGIBLE', 'NOT_ELIGIBLE', 'CLOSED'] as const).map(
            st => {
              const count = counts[st] ?? 0
              const isSelected = statusFilter === st
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {st === 'ALL' ? 'All' : STATUS_LABELS[st].label}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            }
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-64">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
          <input
            type="search"
            placeholder="Search name, phone, ref..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-primary"
          />
        </form>
      </div>

      {/* Enquiries List / Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <FaCreditCard className="mx-auto text-muted-foreground mb-3" size={32} />
          <h3 className="text-base font-bold text-foreground">No EMI enquiries found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter !== 'ALL'
              ? `No enquiries currently in "${STATUS_LABELS[statusFilter as EmiEnquiryStatus]?.label}" status.`
              : 'Customer submissions will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3">Reference / Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Selected Smartphone</th>
                  <th className="px-4 py-3">Mode & Docs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {enquiries.map(item => {
                  const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.NEW
                  const docsCount = Object.keys(item.documents || {}).length
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-foreground">{item.referenceNumber}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-bold text-foreground">{item.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">+91 {item.mobile}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{item.email}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {item.productImageUrl ? (
                            <img
                              src={item.productImageUrl}
                              alt={item.productName}
                              className="size-10 object-contain rounded-lg bg-background p-1 border border-border shrink-0"
                            />
                          ) : (
                            <div className="size-10 rounded-lg bg-muted grid place-items-center shrink-0">
                              <FaMobileScreen size={16} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-foreground truncate max-w-[180px]">{item.productName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {item.brandName} · ₹{(item.price || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {item.mode === 'enquiry_only' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            Enquiry Only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold border border-blue-500/20">
                            <FaShieldHalved size={10} />
                            {docsCount} Document{docsCount === 1 ? '' : 's'} Attached
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold border ${statusInfo.badgeBg} ${statusInfo.color}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <FaEye size={12} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  Enquiry Details
                </span>
                <h3 className="text-xl font-black text-foreground mt-0.5">
                  Ref: {selectedEnquiry.referenceNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <FaXmark size={18} />
              </button>
            </div>

            {/* Customer & Device Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Customer Information
                </span>
                <p className="text-sm font-black text-foreground">{selectedEnquiry.fullName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FaPhone size={11} className="text-primary" /> +91 {selectedEnquiry.mobile}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FaEnvelope size={11} className="text-primary" /> {selectedEnquiry.email}
                </p>
              </div>

              {/* Device Box */}
              <div className="rounded-2xl border border-border bg-background p-4 flex items-center gap-3">
                <img
                  src={selectedEnquiry.productImageUrl || '/placeholder.png'}
                  alt={selectedEnquiry.productName}
                  className="size-16 object-contain rounded-xl bg-card p-1 border border-border shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-primary uppercase">{selectedEnquiry.brandName}</span>
                  <p className="text-sm font-black text-foreground truncate">{selectedEnquiry.productName}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    ₹{(selectedEnquiry.price || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Financing Desk:{' '}
                    {selectedEnquiry.consent.financingPartners?.slice(0, 2).join(', ') || 'Partner Network'}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Section (Secured via authenticated endpoints) */}
            <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FaLock size={11} className="text-emerald-500" />
                  KYC Verification Documents
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Retention active until: {new Date(selectedEnquiry.retentionDate).toLocaleDateString('en-IN')}
                </span>
              </div>

              {Object.keys(selectedEnquiry.documents || {}).length === 0 ? (
                <div className="py-4 text-center rounded-xl bg-muted/40 border border-dashed border-border">
                  <p className="text-xs text-muted-foreground font-medium">
                    No documents uploaded online (Submitted in Enquiry-Only mode). Customer will verify offline.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {Object.entries(selectedEnquiry.documents).map(([docKey, meta]) => {
                    const isPdf = meta.mimeType.includes('pdf')
                    const safeKeyLabel =
                      docKey === 'aadhaarFront'
                        ? 'Aadhaar (Front)'
                        : docKey === 'aadhaarBack'
                        ? 'Aadhaar (Back)'
                        : 'PAN Card'

                    return (
                      <div
                        key={docKey}
                        className="rounded-xl border border-border bg-card p-3 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          {isPdf ? (
                            <FaFilePdf size={18} className="text-rose-500 shrink-0" />
                          ) : (
                            <FaImage size={18} className="text-blue-500 shrink-0" />
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-foreground truncate">{safeKeyLabel}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {Math.round(meta.fileSize / 1024)} KB
                            </p>
                          </div>
                        </div>

                        {/* Secure authenticated download link */}
                        <a
                          href={`/api/admin/emi-enquiries/${selectedEnquiry.id}/document/${docKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 py-1.5 text-[11px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <FaEye size={11} />
                          <span>View Securely</span>
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Status Change & Workflow */}
            <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Update Enquiry Status
              </span>
              <div className="flex flex-wrap gap-2">
                {(['NEW', 'UNDER_REVIEW', 'MORE_INFO_REQUIRED', 'ELIGIBLE', 'NOT_ELIGIBLE', 'CLOSED'] as const).map(
                  st => {
                    const isCurrent = selectedEnquiry.status === st
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={updating || isCurrent}
                        onClick={() => handleStatusUpdate(st)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-foreground text-background ring-2 ring-primary/40'
                            : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {STATUS_LABELS[st].label}
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {/* Internal Audit Notes */}
            <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Internal Verification Notes & Audit Trail
              </span>

              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {(selectedEnquiry.internalNotes || []).map((note, idx) => (
                  <div key={idx} className="rounded-xl bg-card p-2.5 border border-border text-xs">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span className="font-bold text-foreground">{note.author}</span>
                      <span>
                        {new Date(note.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add an internal note or partner update..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={updating || !newNote.trim()}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

