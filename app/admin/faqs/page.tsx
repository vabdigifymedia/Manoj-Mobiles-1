'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import type { FaqResponseDTO, FaqRequestDTO, FaqCategory } from '@/lib/types'

const FAQ_CATEGORIES: { value: FaqCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ORDERS_DELIVERY', label: 'Orders & Delivery' },
  { value: 'WARRANTY', label: 'Warranty' },
  { value: 'PAYMENT_EMI', label: 'Payment & EMI' },
]

const emptyForm: FaqRequestDTO = {
  question: '', answer: '', category: 'GENERAL', displayOrder: 0, isActive: true,
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FaqResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FaqRequestDTO>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadFaqs = async () => {
    try {
      const res = await apiClient.getAdminFaqs()
      setFaqs(res.data.data)
    } catch { setError('Failed to load FAQs') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadFaqs() }, [])

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); setError('') }

  const openEdit = (f: FaqResponseDTO) => {
    setEditId(f.id)
    setForm({ question: f.question, answer: f.answer, category: f.category, displayOrder: f.displayOrder, isActive: f.isActive })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (editId) await apiClient.updateFaq(editId, form)
      else await apiClient.createFaq(form)
      setShowForm(false); loadFaqs()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to save FAQ')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try { await apiClient.deleteFaq(id); loadFaqs() }
    catch { setError('Failed to delete FAQ') }
  }

  const toggleStatus = async (id: string, current: boolean) => {
    try { await apiClient.updateFaqStatus(id, !current); loadFaqs() }
    catch { setError('Failed to update status') }
  }

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const items = [...faqs]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    ;[items[index], items[swapIdx]] = [items[swapIdx], items[index]]
    try {
      await apiClient.reorderFaqs({ orderedIds: items.map(f => f.id) })
      loadFaqs()
    } catch { setError('Failed to reorder') }
  }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">FAQ Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage frequently asked questions shown on the homepage</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}

      {showForm && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">{editId ? 'Edit FAQ' : 'Add New FAQ'}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Question *</label>
              <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Are all phones genuine with warranty?" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Answer *</label>
              <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} required rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary resize-none" placeholder="Yes, all our smartphones are 100% genuine..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as FaqCategory })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                  {FAQ_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="faqActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="size-4 rounded" />
                <label htmlFor="faqActive" className="text-sm font-semibold">Active</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editId ? 'Update FAQ' : 'Add FAQ'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-6 py-2.5 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {faqs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <HelpCircle className="mx-auto text-muted-foreground mb-3" size={40} />
          <p className="font-bold">No FAQs yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first FAQ to help customers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f, idx) => (
            <div key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm">{f.question}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${f.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {f.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{f.category.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{f.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => moveOrder(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button onClick={() => moveOrder(idx, 'down')} disabled={idx === faqs.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button onClick={() => toggleStatus(f.id, f.isActive)} className="p-1.5 rounded-lg hover:bg-muted">
                    {f.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-muted text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-muted text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
