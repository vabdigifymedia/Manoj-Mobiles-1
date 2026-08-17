'use client'

import { useState, useEffect } from 'react'
import { FaTrashCan, FaPlus, FaCheck, FaXmark } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { InstagramReelResponseDTO, InstagramReelRequestDTO } from '@/lib/types'

const emptyForm: InstagramReelRequestDTO = {
  reelId: '',
  isActive: true,
  displayOrder: 0
}

export default function AdminReelsPage() {
  const [reels, setReels] = useState<InstagramReelResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<InstagramReelRequestDTO>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadReels = async () => {
    try {
      const res = await apiClient.apiClient.get('/api/reels', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      setReels(res.data.data)
    } catch {
      setError('Failed to load Instagram reels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReels() }, [])

  const openNew = () => {
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiClient.apiClient.post('/api/reels', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      setShowForm(false)
      loadReels()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to save reel')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel?')) return
    try {
      await apiClient.apiClient.delete(`/api/reels/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      loadReels()
    } catch {
      setError('Failed to delete reel')
    }
  }

  const toggleStatus = async (reel: InstagramReelResponseDTO) => {
    try {
      await apiClient.apiClient.put(`/api/reels/${reel.id}`, 
        { ...reel, isActive: !reel.isActive }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      )
      loadReels()
    } catch {
      setError('Failed to update status')
    }
  }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Instagram Reels</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage reels shown on the home page</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
          <FaPlus size={16} /> Add Reel
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}

      {showForm && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Add New Reel</h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-1">Reel URL or ID *</label>
              <p className="text-xs text-muted-foreground mb-2">You can paste the full Instagram URL (e.g., https://www.instagram.com/reel/CODE/) or just the CODE.</p>
              <input value={form.reelId} onChange={e => setForm({ ...form, reelId: e.target.value })} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://www.instagram.com/reel/..." />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer p-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm font-semibold">Active (Show on website)</span>
              </label>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-muted">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Reel'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">Reel ID</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Order</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reels.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No reels found.</td></tr>
              ) : (
                reels.map(reel => (
                  <tr key={reel.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <a href={`https://www.instagram.com/reel/${reel.reelId}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                        {reel.reelId}
                      </a>
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggleStatus(reel)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${reel.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {reel.isActive ? <FaCheck size={10} /> : <FaXmark size={10} />}
                        {reel.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-4 font-medium">{reel.displayOrder}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleDelete(reel.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                          <FaTrashCan size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
