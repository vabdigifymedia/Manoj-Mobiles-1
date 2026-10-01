'use client'

import { useEffect, useState } from 'react'
import { FaTrashCan, FaPen, FaPlus, FaMagnifyingGlass, FaXmark, FaCheck } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import { BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'
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
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [brandCategoriesMap, setBrandCategoriesMap] = useState<Record<string, string[]>>({})
  
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    categoryIds: [] as string[]
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const loadData = async () => {
    try {
      setPageLoading(true)
      const [brandsRes, catsRes, bCatRes] = await Promise.all([
        apiClient.getBrands(0, 100),
        apiClient.getCategories().catch(() => ({ data: { data: [] } })),
        apiClient.getBrandCategories().catch(() => ({ data: {} }))
      ])

      const brandList = Array.isArray(brandsRes.data.data) 
        ? brandsRes.data.data 
        : (brandsRes.data.data.content || [])
      setBrands(brandList)
      setCategories(catsRes.data?.data || [])
      setBrandCategoriesMap(bCatRes.data || {})
    } catch {
      setError('Failed to load brands')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openNewForm = () => {
    setEditId(null)
    setForm({ name: '', description: '', logoUrl: '', categoryIds: [] })
    setLogoFile(null)
    setShowForm(true)
  }

  const openEditForm = (brand: BrandResponseDTO) => {
    setEditId(brand.id)
    const existingCats = brandCategoriesMap[brand.id] || []
    setForm({
      name: brand.name,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      categoryIds: existingCats
    })
    setLogoFile(null)
    setShowForm(true)
  }

  const toggleCategorySelection = (catId: string) => {
    setForm(prev => {
      const exists = prev.categoryIds.includes(catId)
      const updated = exists 
        ? prev.categoryIds.filter(id => id !== catId)
        : [...prev.categoryIds, catId]
      return { ...prev, categoryIds: updated }
    })
  }

  const removeCategorySelection = (catId: string) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.filter(id => id !== catId)
    }))
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
      
      let savedBrandId = editId

      if (editId) {
        await apiClient.updateBrand(editId, { name: form.name, description: form.description, logoUrl })
      } else {
        const createRes = await apiClient.createBrand({ name: form.name, description: form.description, logoUrl })
        savedBrandId = createRes.data?.data?.id
      }

      // Persist Brand -> Categories mapping
      if (savedBrandId) {
        await apiClient.saveBrandCategories(savedBrandId, form.categoryIds)
      }
      
      setShowForm(false)
      loadData()
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
      loadData()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to delete brand')
    }
  }

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Brands</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product brands and their category associations</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <FaMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search brands..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" 
            />
          </div>
          <button onClick={openNewForm} className="flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
            <FaPlus size={16} /> Add Brand
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Add / Edit Brand Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editId ? 'Edit' : 'Create'} Brand</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-3">
            <div>
              <label className="text-sm font-semibold mb-1 block">Brand Name <span className="text-red-500">*</span></label>
              <input 
                required 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary" 
                placeholder="e.g. Samsung, Apple, OnePlus" 
              />
            </div>
            
            {/* Categories Multi-Select Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold block">Categories</label>
                <span className="text-[11px] text-muted-foreground">Select one or multiple categories</span>
              </div>

              {/* Selected Categories Tags */}
              <div className="min-h-10 p-2 rounded-xl border border-border bg-background flex flex-wrap gap-1.5 mb-2">
                {form.categoryIds.length === 0 ? (
                  <span className="text-xs text-muted-foreground self-center px-1">
                    No categories selected yet. Click options below to add.
                  </span>
                ) : (
                  form.categoryIds.map(catId => {
                    const catObj = categories.find(c => c.id === catId)
                    const catName = catObj?.name || 'Category'
                    return (
                      <span 
                        key={catId} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                      >
                        {catName}
                        <button
                          type="button"
                          onClick={() => removeCategorySelection(catId)}
                          className="hover:text-red-500 cursor-pointer p-0.5 rounded-full"
                          title="Remove category"
                        >
                          <FaXmark size={11} />
                        </button>
                      </span>
                    )
                  })
                )}
              </div>

              {/* Category Quick Select Chips / Checkboxes */}
              <div className="max-h-40 overflow-y-auto rounded-xl border border-border/80 bg-muted/30 p-2 space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground px-1 pb-1">Available Categories</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map(cat => {
                    const isSelected = form.categoryIds.includes(cat.id)
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategorySelection(cat.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs' 
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        <span className="truncate pr-1">{cat.name}</span>
                        {isSelected && <FaCheck size={11} className="shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Description</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-y" 
                placeholder="Brand description..." 
              />
            </div>
            <div>
              <ImageUpload 
                label="Brand Logo / Card Banner"
                value={form.logoUrl} 
                aspectRatio={16 / 9}
                enableCrop={true}
                onChange={(file, previewUrl) => {
                  setLogoFile(file)
                  setForm({...form, logoUrl: previewUrl || ''})
                }} 
              />
            </div>
            <DialogFooter className="mt-4 pt-2 border-t border-border">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2 text-sm font-bold border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {loading ? 'Saving...' : (editId ? 'Save Changes' : 'Save Brand')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Brands Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Brand Logo</th>
                <th className="px-6 py-4 font-semibold">Brand Name</th>
                <th className="px-6 py-4 font-semibold">Categories</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading brands...
                    </div>
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {searchQuery ? 'No brands matching search query.' : 'No brands found.'}
                  </td>
                </tr>
              ) : filteredBrands.map(brand => {
                const assignedCatIds = brandCategoriesMap[brand.id] || []
                const assignedCategories = categories.filter(c => assignedCatIds.includes(c.id))

                return (
                  <tr key={brand.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="h-8 w-auto object-contain dark:invert dark:hue-rotate-180" />
                      ) : (
                        <span className="text-muted-foreground italic text-xs">No logo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">{brand.name}</td>
                    
                    {/* Categories Badges Column */}
                    <td className="px-6 py-4">
                      {assignedCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {assignedCategories.map(cat => (
                            <span 
                              key={cat.id} 
                              className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground border border-border"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None assigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{brand.description || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditForm(brand)} className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer" title="Edit">
                          <FaPen size={15} />
                        </button>
                        <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer" title="Delete">
                          <FaTrashCan size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
