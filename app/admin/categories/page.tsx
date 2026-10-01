'use client'

import { useEffect, useState } from 'react'
import { FaTrashCan, FaPen, FaPlus, FaMagnifyingGlass, FaBoxesStacked, FaTag } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import { CategoryResponseDTO } from '@/lib/types'
import {
  VariantTemplate,
  getDefaultTemplateForCategory,
  CategoryProductConfig,
  PREDEFINED_VARIANT_TEMPLATES
} from '@/lib/variantTemplates'
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
  // Always initialize with predefined templates so dropdown is NEVER empty
  const [variantTemplates, setVariantTemplates] = useState<VariantTemplate[]>(PREDEFINED_VARIANT_TEMPLATES)
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, CategoryProductConfig>>({})

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    variantTemplateId: 'mobiles'
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    try {
      setPageLoading(true)
      const [catsRes, vtRes, ccRes] = await Promise.all([
        apiClient.getCategories().catch(() => ({ data: { data: [] } })),
        apiClient.getVariantTemplates().catch(() => ({ data: PREDEFINED_VARIANT_TEMPLATES })),
        apiClient.getCategoryConfigs().catch(() => ({ data: {} }))
      ])

      const fetchedCats = catsRes.data?.data || []
      setCategories(fetchedCats)

      if (vtRes?.data && vtRes.data.length > 0) {
        setVariantTemplates(vtRes.data)
      }
      setCategoryConfigs(ccRes?.data || {})
    } catch {
      setError('Failed to load categories')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openNewForm = () => {
    setEditId(null)
    setForm({
      name: '',
      description: '',
      imageUrl: '',
      variantTemplateId: 'mobiles'
    })
    setImageFile(null)
    setShowForm(true)
  }

  const openEditForm = (cat: CategoryResponseDTO) => {
    setEditId(cat.id)
    const existingConfig = categoryConfigs[cat.id]
    const fallbackTemplate = getDefaultTemplateForCategory(cat.name, cat.slug)

    setForm({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      variantTemplateId: existingConfig?.variantTemplateId || fallbackTemplate.id
    })
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

      let savedCategoryId = editId

      if (editId) {
        await apiClient.updateCategory(editId, {
          name: form.name,
          description: form.description,
          imageUrl
        })
      } else {
        const createRes = await apiClient.createCategory({
          name: form.name,
          description: form.description,
          imageUrl
        })
        savedCategoryId = createRes.data.data.id
      }

      // Persist Product Configuration (Variant Template assignment)
      if (savedCategoryId) {
        await apiClient.saveCategoryConfig({
          categoryId: savedCategoryId,
          variantTemplateId: form.variantTemplateId || 'mobiles'
        })
      }

      setShowForm(false)
      loadData()
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
      loadData()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to delete category')
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getAssignedVariantTemplateName = (cat: CategoryResponseDTO) => {
    const conf = categoryConfigs[cat.id]
    const templateId = conf?.variantTemplateId || getDefaultTemplateForCategory(cat.name, cat.slug).id
    const tpl = variantTemplates.find(t => t.id === templateId)
    return tpl ? tpl.name : 'Mobiles'
  }

  // Active template for field preview in modal
  const selectedTemplate = variantTemplates.find(t => t.id === form.variantTemplateId) || variantTemplates[0]

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product categories and their variant templates</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <FaMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" 
            />
          </div>
          <button onClick={openNewForm} className="flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
            <FaPlus size={16} /> Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Add / Edit Category Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editId ? 'Edit' : 'Create'} Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                Basic Information
              </h3>
              <div>
                <label className="text-sm font-semibold mb-1 block">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="e.g. Mobiles, Tablets, Laptops" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Description</label>
                <textarea 
                  rows={2}
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" 
                  placeholder="Category description..." 
                />
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
            </div>

            {/* Section 2: Product Configuration */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                Product Configuration
              </h3>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="variantTemplateSelect" className="text-sm font-semibold block">
                    Variant Template <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Controls variant fields in Add/Edit product</span>
                </div>

                <div className="relative">
                  <select
                    id="variantTemplateSelect"
                    value={form.variantTemplateId}
                    onChange={(e) => setForm(prev => ({ ...prev, variantTemplateId: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer text-foreground appearance-none shadow-xs"
                  >
                    <option value="" disabled>Select Variant Template</option>
                    {variantTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isSystem ? '' : '(Custom)'}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                    ▼
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="mt-2 rounded-xl bg-muted/50 p-3 border border-border/60 text-xs space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <FaTag size={11} className="text-primary" />
                      <span>{selectedTemplate.name} Template Fields:</span>
                    </div>
                    <p className="text-muted-foreground">
                      {selectedTemplate.fields && selectedTemplate.fields.length > 0 
                        ? selectedTemplate.fields.map(f => f.name).join(', ') + ' + Colour, Variant Name, SKU, Stock, MRP, Selling Price'
                        : 'Colour, Variant Name, SKU, Stock, MRP, Selling Price (Standard common fields)'}
                    </p>
                  </div>
                )}
              </div>
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
                {loading ? 'Saving...' : (editId ? 'Save Changes' : 'Create Category')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Category List Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Image</th>
                <th className="px-6 py-4 font-semibold">Category Name</th>
                <th className="px-6 py-4 font-semibold">Variant Template</th>
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
                      Loading categories...
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {searchQuery ? 'No categories matching search query.' : 'No categories found.'}
                  </td>
                </tr>
              ) : filteredCategories.map(category => {
                const variantTemplateName = getAssignedVariantTemplateName(category)

                return (
                  <tr key={category.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} className="h-9 w-9 object-cover rounded-lg border border-border shadow-2xs" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg border border-border bg-muted/50 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground block text-center leading-none">No<br/>Img</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">{category.name}</td>
                    
                    {/* Variant Template Badge */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                        <FaBoxesStacked size={11} />
                        {variantTemplateName}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{category.description || '-'}</td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => openEditForm(category)} 
                          className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer" 
                          title="Edit Category & Template"
                        >
                          <FaPen size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)} 
                          className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer" 
                          title="Delete Category"
                        >
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
