'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { BrandResponseDTO } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ImageUpload } from '@/components/admin/image-upload'

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  
  const loadBrands = async () => {
    try {
      setPageLoading(true)
      const res = await apiClient.getBrands()
      setBrands(res.data.data.content)
    } catch {
      setError('Failed to load brands')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const openNewForm = () => {
    setEditId(null)
    setForm({ name: '', description: '', logoUrl: '' })
    setLogoFile(null)
    setShowForm(true)
  }

  const openEditForm = (brand: BrandResponseDTO) => {
    setEditId(brand.id)
    setForm({ name: brand.name, description: brand.description || '', logoUrl: brand.logoUrl || '' })
    setLogoFile(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let logoUrl = form.logoUrl
      if (logoFile) {
        const uploadRes = await apiClient.uploadImage(logoFile, 'brands')
        logoUrl = uploadRes.data.data
      }
      
      if (editId) {
        await apiClient.updateBrand(editId, { name: form.name, description: form.description, logoUrl })
      } else {
        await apiClient.createBrand({ name: form.name, description: form.description, logoUrl })
      }
      
      setShowForm(false)
      loadBrands()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to save brand')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return
    try {
      await apiClient.deleteBrand(id)
      loadBrands()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to delete brand')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Brands</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product brands</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search brands..." className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <button onClick={openNewForm} className="flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Brand
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editId ? 'Edit' : 'Create'} Brand</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Brand Name</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Samsung" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="Brand description..." />
            </div>
            <div>
              <ImageUpload 
                label="Brand Logo"
                value={form.logoUrl} 
                onChange={(file, previewUrl) => {
                  setLogoFile(file)
                  setForm({...form, logoUrl: previewUrl || ''})
                }} 
              />
            </div>
            <DialogFooter className="mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold border border-border rounded-xl hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {loading ? 'Saving...' : 'Save Brand'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Brand Logo</th>
                <th className="px-6 py-4 font-semibold">Brand Name</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No brands found.</td>
                </tr>
              ) : brands.map(brand => (
                <tr key={brand.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="h-8 object-contain bg-background p-1 rounded border border-border mix-blend-multiply dark:mix-blend-normal" />
                    ) : (
                      <span className="text-muted-foreground italic text-xs">No logo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold">{brand.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{brand.description || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditForm(brand)} className="text-blue-500 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
