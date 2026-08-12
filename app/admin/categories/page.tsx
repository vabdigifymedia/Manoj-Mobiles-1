'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { CategoryResponseDTO } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ImageUpload } from '@/components/admin/image-upload'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  
  const loadCategories = async () => {
    try {
      setPageLoading(true)
      const res = await apiClient.getCategories()
      setCategories(res.data.data)
    } catch {
      setError('Failed to load categories')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const openNewForm = () => {
    setEditId(null)
    setForm({ name: '', description: '', imageUrl: '' })
    setImageFile(null)
    setShowForm(true)
  }

  const openEditForm = (cat: CategoryResponseDTO) => {
    setEditId(cat.id)
    setForm({ name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || '' })
    setImageFile(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let imageUrl = form.imageUrl
      if (imageFile) {
        const uploadRes = await apiClient.uploadImage(imageFile, 'categories')
        imageUrl = uploadRes.data.data
      }
      
      if (editId) {
        await apiClient.updateCategory(editId, { name: form.name, description: form.description, imageUrl })
      } else {
        await apiClient.createCategory({ name: form.name, description: form.description, imageUrl })
      }
      
      setShowForm(false)
      loadCategories()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await apiClient.deleteCategory(id)
      loadCategories()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to delete category')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product categories</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search categories..." className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <button onClick={openNewForm} className="flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Category
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
            <DialogTitle className="text-xl font-bold">{editId ? 'Edit' : 'Create'} Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Category Name</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Smartphones" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="Category description..." />
            </div>
            <div>
              <ImageUpload 
                label="Category Image"
                value={form.imageUrl} 
                onChange={(file, previewUrl) => {
                  setImageFile(file)
                  setForm({...form, imageUrl: previewUrl || ''})
                }} 
              />
            </div>
            <DialogFooter className="mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold border border-border rounded-xl hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {loading ? 'Saving...' : 'Save Category'}
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
                <th className="px-6 py-4 font-semibold">Image</th>
                <th className="px-6 py-4 font-semibold">Category Name</th>
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
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No categories found.</td>
                </tr>
              ) : categories.map(category => (
                <tr key={category.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="h-8 w-8 object-cover rounded-md border border-border" />
                    ) : (
                      <div className="h-8 w-8 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground block text-center leading-none">No<br/>Img</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold">{category.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{category.description}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditForm(category)} className="text-blue-500 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete">
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
