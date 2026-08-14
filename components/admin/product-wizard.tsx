'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PackagePlus, Info, CheckCircle, Package, Settings, Image as ImageIcon, 
  Trash2, Plus, PenTool, Check, Star, ShieldCheck, Battery, Cpu, 
  Camera, Smartphone, Wifi, Truck, Zap, Bluetooth, ChevronLeft,
  MemoryStick, HardDrive, Microchip
} from 'lucide-react'
import { apiClient } from '@/lib/apiClient'

interface LocalHighlight {
  id: string;
  iconName: string;
  text: string;
  displayOrder: number;
}

interface LocalVariant {
  id: string;
  variantName: string;
  sku: string;
  color: string;
  mrp: number;
  sellingPrice: number;
  gstPercent: number;
  stockQty: number;
  codAvailable: boolean;
  images: string[];
}
import { CategoryResponseDTO, BrandResponseDTO, IconName } from '@/lib/types'
import { RichTextEditor } from './rich-text-editor'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from './image-upload'

const availableIcons = { CheckCircle, Star, ShieldCheck, Battery, Cpu, Camera, Smartphone, Wifi, Truck, Zap, Bluetooth, Settings, MemoryStick, HardDrive, Microchip }

export function ProductWizard({ productId }: { productId?: string }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [highestStepReached, setHighestStepReached] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Step 1: Base Info
  const [baseInfo, setBaseInfo] = useState({
    name: '', brandId: '', categoryId: '', description: '',
    warrantyMonths: 12, returnPolicyDays: 7, isReturnable: true,
    slug: '', metaTitle: '', metaDescription: '', metaKeywords: ''
  })

  // Step 2: Highlights
  const [highlights, setHighlights] = useState<LocalHighlight[]>([])
  const [deletedHighlightIds, setDeletedHighlightIds] = useState<string[]>([])
  const [showHighlightForm, setShowHighlightForm] = useState(false)
  const [highlightForm, setHighlightForm] = useState({ iconName: 'CheckCircle', text: '' })

  // Step 3: Variants
  const [variants, setVariants] = useState<LocalVariant[]>([])
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantForm, setVariantForm] = useState({
    variantName: '', sku: '', color: '', mrp: '', sellingPrice: '',
    gstPercent: 0, stockQty: 0, codAvailable: true
  })

  // Step 4: Global Specs
  const [globalSpecs, setGlobalSpecs] = useState<{specGroup: string, specKey: string, specValue: string}[]>([])

  // Mock data for dropdowns
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getBrands(0, 100)
        ])
        setCategories(catsRes.data.data)
        setBrands(brandsRes.data.data.content)

        if (productId) {
          const prodRes = await apiClient.getProductById(productId)
          const p = prodRes.data.data
          setBaseInfo({
            name: p.name,
            brandId: p.brandId,
            categoryId: p.categoryId,
            description: p.description || '',
            warrantyMonths: p.warrantyMonths || 12,
            returnPolicyDays: p.returnPolicyDays || 7,
            isReturnable: p.isReturnable ?? true,
            slug: p.slug || '',
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
            metaKeywords: p.metaKeywords || ''
          })
          setHighlights(p.highlights.map(h => ({
            id: h.id,
            iconName: h.iconName as IconName,
            text: h.text,
            displayOrder: h.displayOrder
          })))
          setVariants(p.variants.map(v => ({
            id: v.id,
            variantName: v.variantName,
            sku: v.sku,
            color: v.color || '',
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            gstPercent: v.gstPercent || 0,
            stockQty: v.stockQty,
            codAvailable: v.codAvailable,
            images: v.imageUrls || []
          })))

          const firstVariantSpecs = p.variants[0]?.specifications || []
          setGlobalSpecs(firstVariantSpecs.map(s => ({
            specGroup: s.specGroup,
            specKey: s.specKey,
            specValue: s.specValue
          })))
        }
      } catch (err) {
        console.error('Failed to load initial data', err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchData()
  }, [productId])

  const handleStepClick = (step: number) => {
    if (step <= highestStepReached) setCurrentStep(step)
  }

  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault()
    setHighlights([...highlights, { 
      id: `h${Date.now()}`, 
      iconName: highlightForm.iconName, 
      text: highlightForm.text,
      displayOrder: highlights.length + 1
    }])
    setHighlightForm({ iconName: 'CheckCircle', text: '' })
    setShowHighlightForm(false)
  }

  const handleDeleteHighlight = (id: string) => {
    if (!id.startsWith('h')) {
      setDeletedHighlightIds([...deletedHighlightIds, id])
    }
    setHighlights(highlights.filter(h => h.id !== id))
  }

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingVariantId) {
      setVariants(variants.map(v => v.id === editingVariantId ? {
        ...v,
        variantName: variantForm.variantName,
        sku: variantForm.sku,
        color: variantForm.color,
        mrp: Number(variantForm.mrp),
        sellingPrice: Number(variantForm.sellingPrice),
        gstPercent: Number(variantForm.gstPercent),
        stockQty: Number(variantForm.stockQty),
        codAvailable: variantForm.codAvailable
      } : v))
      setEditingVariantId(null)
    } else {
      setVariants([...variants, {
        id: `v${Date.now()}`,
        variantName: variantForm.variantName,
        sku: variantForm.sku,
        color: variantForm.color,
        mrp: Number(variantForm.mrp),
        sellingPrice: Number(variantForm.sellingPrice),
        gstPercent: Number(variantForm.gstPercent),
        stockQty: Number(variantForm.stockQty),
        codAvailable: variantForm.codAvailable,
        images: []
      }])
    }
    setShowVariantForm(false)
    setVariantForm({ variantName: '', sku: '', color: '', mrp: '', sellingPrice: '', gstPercent: 0, stockQty: 0, codAvailable: true })
  }

  const handleEditVariantClick = (v: LocalVariant) => {
    setVariantForm({
      variantName: v.variantName,
      sku: v.sku,
      color: v.color,
      mrp: v.mrp.toString(),
      sellingPrice: v.sellingPrice.toString(),
      gstPercent: v.gstPercent,
      stockQty: v.stockQty,
      codAvailable: v.codAvailable
    })
    setEditingVariantId(v.id)
    setShowVariantForm(true)
  }

  const handleDeleteVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id))
  }

  const handleOpenAddVariant = () => {
    if (variants.length > 0) {
      const lastVariant = variants[variants.length - 1]
      setVariantForm({
        variantName: lastVariant.variantName,
        sku: '',
        color: '',
        mrp: lastVariant.mrp.toString(),
        sellingPrice: lastVariant.sellingPrice.toString(),
        gstPercent: lastVariant.gstPercent,
        stockQty: lastVariant.stockQty,
        codAvailable: lastVariant.codAvailable
      })
    } else {
      setVariantForm({ variantName: '', sku: '', color: '', mrp: '', sellingPrice: '', gstPercent: 0, stockQty: 0, codAvailable: true })
    }
    setEditingVariantId(null)
    setShowVariantForm(true)
  }

  // Simplified: Global Spec updates
  const handleUpdateSpec = (specIndex: number, field: 'specGroup'|'specKey'|'specValue', value: string) => {
    const specs = [...globalSpecs]
    specs[specIndex] = { ...specs[specIndex], [field]: value }
    setGlobalSpecs(specs)
  }

  const handleAddSpecToGroup = (groupName: string) => {
    setGlobalSpecs([...globalSpecs, { specGroup: groupName, specKey: '', specValue: '' }])
  }

  const handleUpdateGroupName = (oldGroup: string, newGroup: string) => {
    setGlobalSpecs(globalSpecs.map(s => s.specGroup === oldGroup ? { ...s, specGroup: newGroup } : s))
  }

  const handleDeleteSpec = (specIndex: number) => {
    setGlobalSpecs(globalSpecs.filter((_, i) => i !== specIndex))
  }

  // Publish Product
  const handlePublish = async () => {
    if (!baseInfo.brandId || !baseInfo.categoryId || !baseInfo.name) {
      toast.error('Brand, Category, and Name are required.')
      return
    }
    if (variants.length === 0) return toast.error('Add at least one variant')
    
    setLoading(true)
    try {
      // 1. Create or Update Product
      let finalProductId = productId
      if (finalProductId) {
        await apiClient.updateProduct(finalProductId, baseInfo)
      } else {
        const prodRes = await apiClient.createProduct(baseInfo)
        finalProductId = prodRes.data.data.id
      }

      // 2. Highlights
      for (const id of deletedHighlightIds) {
        await apiClient.deleteHighlight(id).catch(() => {})
      }

      for (const h of highlights) {
        if (h.id.startsWith('h')) {
          await apiClient.addHighlight(finalProductId, {
            iconName: h.iconName as IconName,
            text: h.text,
            displayOrder: h.displayOrder
          })
        } else {
          await apiClient.updateHighlight(h.id, {
            iconName: h.iconName as IconName,
            text: h.text,
            displayOrder: h.displayOrder
          })
        }
      }

      // 3. Variants
      for (const v of variants) {
        let finalVariantId = v.id
        const isNewVariant = v.id.startsWith('v') // local id
        
        if (isNewVariant) {
          const varRes = await apiClient.createVariant({
            productId: finalProductId,
            variantName: v.variantName,
            sku: v.sku,
            color: v.color,
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            gstPercent: v.gstPercent,
            stockQty: v.stockQty,
            codAvailable: v.codAvailable
          })
          finalVariantId = varRes.data.data.id
        } else {
          await apiClient.updateVariant(finalVariantId, {
            productId: finalProductId,
            variantName: v.variantName,
            sku: v.sku,
            color: v.color,
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            gstPercent: v.gstPercent,
            stockQty: v.stockQty,
            codAvailable: v.codAvailable
          })
        }

        // 4. Specs (Applied globally to all variants)
        if (globalSpecs.length > 0) {
          await apiClient.addVariantSpecifications(finalVariantId, globalSpecs.map(s => ({
            specGroup: s.specGroup || 'General',
            specKey: s.specKey,
            specValue: s.specValue
          })))
        }

        // 5. Images
        if (v.images && v.images.length > 0) {
          await apiClient.addVariantImages(finalVariantId, v.images)
        }
      }
      setLoading(false)
      toast.success(productId ? 'Product updated successfully!' : 'Product created successfully!')
      router.push('/admin/products')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast.error(axiosErr?.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <span className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          <p className="font-semibold">{productId ? 'Loading Product Details...' : 'Preparing Wizard...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <div className="mb-6 flex items-center gap-2 font-bold text-xl">
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft />
        </Link>
        <PackagePlus className="text-primary" /> {productId ? 'Edit Product' : 'Create New Product'}
      </div>

      <div className="flex justify-between border-b border-border mb-8 overflow-x-auto pb-4">
        {[
          { step: 1, label: 'Base Info', icon: Info },
          { step: 2, label: 'Highlights', icon: Star },
          { step: 3, label: 'Variants', icon: Package },
          { step: 4, label: 'Specs', icon: Settings },
          { step: 5, label: 'Images', icon: ImageIcon }
        ].map(({ step, label, icon: Icon }) => (
          <button
            key={step}
            onClick={() => handleStepClick(step)}
            disabled={step > highestStepReached}
            className={`flex flex-col items-center gap-2 min-w-[80px] ${
              currentStep === step ? 'text-primary' : step <= highestStepReached ? 'text-foreground' : 'text-muted-foreground opacity-50'
            }`}
          >
            <div className={`grid size-10 place-items-center rounded-full transition-colors ${
              currentStep === step ? 'bg-primary text-primary-foreground' : step < highestStepReached ? 'bg-primary/20 text-primary' : 'bg-muted'
            }`}>
              {step < highestStepReached && currentStep !== step ? <Check size={18} /> : <Icon size={18} />}
            </div>
            <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        {/* Step 1: Base Info */}
        {currentStep === 1 && (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); setHighestStepReached(Math.max(highestStepReached, 2)) }}>
            <h3 className="text-lg font-bold border-b border-border pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold mb-1 block">Product Name</label>
                <input required value={baseInfo.name} onChange={e => setBaseInfo({...baseInfo, name: e.target.value})} className="w-full rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Brand</label>
                <Select value={baseInfo.brandId || undefined} onValueChange={val => setBaseInfo({...baseInfo, brandId: val || ''})}>
                  <SelectTrigger className="w-full h-10 rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Select Brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Category</label>
                <Select value={baseInfo.categoryId || undefined} onValueChange={val => setBaseInfo({...baseInfo, categoryId: val || ''})}>
                  <SelectTrigger className="w-full h-10 rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Select Category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-semibold mb-1 block">Rich Description</label>
              <RichTextEditor value={baseInfo.description} onChange={(v) => setBaseInfo({...baseInfo, description: v})} />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl">Next: Highlights</button>
            </div>
          </form>
        )}

        {/* Step 2: Highlights */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-2 flex justify-between items-center">
              Product Highlights
              <button onClick={() => setShowHighlightForm(true)} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-1 font-semibold"><Plus size={16}/> Add</button>
            </h3>

            {showHighlightForm && (
              <form onSubmit={handleAddHighlight} className="bg-muted/50 p-4 rounded-xl border border-border flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold mb-1 block">Icon</label>
                  <Select value={highlightForm.iconName || undefined} onValueChange={val => setHighlightForm({...highlightForm, iconName: val || ''})}>
                    <SelectTrigger className="w-full h-[38px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Select Icon..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(availableIcons).map(k => (
                        <SelectItem key={k} value={k}>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const IconComponent = availableIcons[k as keyof typeof availableIcons];
                              return <IconComponent size={14} />;
                            })()}
                            {k}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[2]">
                  <label className="text-xs font-semibold mb-1 block">Text</label>
                  <input required value={highlightForm.text} onChange={e => setHighlightForm({...highlightForm, text: e.target.value})} placeholder="e.g. 50MP Camera" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm">Save</button>
                <button type="button" onClick={() => setShowHighlightForm(false)} className="bg-muted text-foreground font-bold px-4 py-2 rounded-lg text-sm border border-border">Cancel</button>
              </form>
            )}

            <div className="space-y-2">
              {highlights.map(h => {
                const Icon = availableIcons[h.iconName as keyof typeof availableIcons] || CheckCircle
                return (
                  <div key={h.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                    <div className="flex items-center gap-3 font-semibold"><Icon className="text-primary" size={20} /> {h.text}</div>
                    <button onClick={() => handleDeleteHighlight(h.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setCurrentStep(1)} className="border border-border font-bold px-6 py-2 rounded-xl">Back</button>
              <button onClick={() => { setCurrentStep(3); setHighestStepReached(Math.max(highestStepReached, 3)) }} className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl">Next: Variants</button>
            </div>
          </div>
        )}

        {/* Step 3: Variants */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-2 flex justify-between items-center">
              Product Variants
              <button onClick={handleOpenAddVariant} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-1 font-semibold"><Plus size={16}/> Add Variant</button>
            </h3>

            {showVariantForm && (
              <form onSubmit={handleAddVariant} className="bg-muted/50 p-4 rounded-xl border border-border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Variant Name</label>
                    <input required value={variantForm.variantName} onChange={e => setVariantForm({...variantForm, variantName: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Color</label>
                    <input required value={variantForm.color} onChange={e => setVariantForm({...variantForm, color: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">SKU</label>
                    <input required value={variantForm.sku} onChange={e => setVariantForm({...variantForm, sku: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Stock Quantity</label>
                    <input required type="number" value={variantForm.stockQty} onChange={e => setVariantForm({...variantForm, stockQty: parseInt(e.target.value) || 0})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">MRP</label>
                    <input required type="number" value={variantForm.mrp} onChange={e => setVariantForm({...variantForm, mrp: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Selling Price</label>
                    <input required type="number" value={variantForm.sellingPrice} onChange={e => setVariantForm({...variantForm, sellingPrice: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowVariantForm(false); setEditingVariantId(null); setVariantForm({ variantName: '', sku: '', color: '', mrp: '', sellingPrice: '', gstPercent: 0, stockQty: 0, codAvailable: true }) }} className="bg-muted text-foreground font-bold px-4 py-2 rounded-lg text-sm border border-border">Cancel</button>
                  <button type="submit" className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm">{editingVariantId ? 'Update Variant' : 'Save Variant'}</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Color</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Stock</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {variants.map(v => (
                    <tr key={v.id}>
                      <td className="py-3 pr-4 font-bold">{v.variantName}</td>
                      <td className="py-3 pr-4">{v.color}</td>
                      <td className="py-3 pr-4">₹{v.sellingPrice}</td>
                      <td className="py-3 pr-4">{v.stockQty}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleEditVariantClick(v)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg mr-1"><PenTool size={16} /></button>
                        <button onClick={() => handleDeleteVariant(v.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setCurrentStep(2)} className="border border-border font-bold px-6 py-2 rounded-xl">Back</button>
              <button onClick={() => { 
                if (variants.length === 0) return toast.error('Add at least 1 variant')
                setCurrentStep(4); setHighestStepReached(Math.max(highestStepReached, 4)) 
              }} className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl">Next: Specs</button>
            </div>
          </div>
        )}

        {/* Step 4: Specs */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-2">Specifications</h3>
            
            {(() => {
              const groups = Array.from(new Set(globalSpecs.map(s => s.specGroup || 'General')))
              return (
                <div className="border border-border rounded-xl p-4 space-y-4">
                  <h4 className="font-bold border-b border-border pb-2 text-primary">Common Specifications <span className="text-muted-foreground font-normal text-sm ml-2">(Applied to all variants)</span></h4>
                  
                  {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No specs added.</p>
                  ) : (
                    <div className="space-y-4">
                      {groups.map((group, groupIdx) => (
                        <div key={groupIdx} className="bg-muted/30 rounded-lg p-4 border border-border">
                          <div className="flex justify-between items-center mb-3">
                            <input 
                              value={group} 
                              onChange={(e) => handleUpdateGroupName(group, e.target.value)}
                              className="font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 text-sm"
                            />
                            <button onClick={() => handleAddSpecToGroup(group)} className="text-xs text-primary font-bold hover:underline">+ Add Spec</button>
                          </div>
                          <div className="space-y-2">
                            {globalSpecs.map((s, i) => s.specGroup === group && (
                              <div key={i} className="flex gap-2 items-center">
                                <input placeholder="Key (e.g. Processor)" value={s.specKey} onChange={e => handleUpdateSpec(i, 'specKey', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
                                <input placeholder="Value (e.g. Snapdragon 8 Gen 3)" value={s.specValue} onChange={e => handleUpdateSpec(i, 'specValue', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
                                <button onClick={() => handleDeleteSpec(i)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg" title="Delete Spec"><Trash2 size={16} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button onClick={() => handleAddSpecToGroup('New Group')} className="text-sm bg-muted text-foreground px-4 py-2 rounded-lg font-bold border border-border">
                    + Add New Group
                  </button>
                </div>
              )
            })()}

            <div className="flex justify-between pt-4">
              <button onClick={() => setCurrentStep(3)} className="border border-border font-bold px-6 py-2 rounded-xl">Back</button>
              <button onClick={() => { setCurrentStep(5); setHighestStepReached(Math.max(highestStepReached, 5)) }} className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl">Next: Images</button>
            </div>
          </div>
        )}

        {/* Step 5: Images & Publish */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-lg font-bold border-b border-border pb-2">Images & Publish</h3>
            <p className="text-sm text-muted-foreground">Upload images for each variant. The first image will be used as the primary image.</p>
            
            <div className="space-y-6 mt-4">
              {Array.from(new Set(variants.map(v => v.color || 'Default Color'))).map(color => {
                // Find the first variant with this color to get the images array
                const representativeVariant = variants.find(v => (v.color || 'Default Color') === color);
                const currentImages = representativeVariant?.images || [];

                return (
                  <div key={color} className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4">
                    <h4 className="text-sm font-bold border-b border-border pb-2">
                      Color: {color} <span className="text-muted-foreground font-normal ml-2">({variants.filter(v => (v.color || 'Default Color') === color).length} variants)</span>
                    </h4>
                    
                    <div className="flex flex-wrap gap-4 pb-2">
                      {currentImages.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative shrink-0 group">
                          <img src={img} alt="Variant" className="w-24 h-24 object-cover rounded-lg border border-border" />
                          <button 
                            onClick={() => {
                              const newImages = [...currentImages];
                              newImages.splice(imgIdx, 1);
                              setVariants(variants.map(varItem => 
                                (varItem.color || 'Default Color') === color 
                                  ? { ...varItem, images: newImages } 
                                  : varItem
                              ));
                            }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                          {imgIdx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">Primary</span>
                          )}
                        </div>
                      ))}
                      
                      <label className="shrink-0 w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Plus size={24} className="text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground mt-1 text-center leading-tight">Add<br/>Image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setLoading(true);
                              const res = await apiClient.uploadImage(file, 'products');
                              const url = res.data.data;
                              setVariants(variants.map(varItem => 
                                (varItem.color || 'Default Color') === color 
                                  ? { ...varItem, images: [...(varItem.images || []), url] } 
                                  : varItem
                              ));
                            } catch (err) {
                              toast.error('Failed to upload image');
                            } finally {
                              setLoading(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-8 flex justify-between">
              <button onClick={() => setCurrentStep(4)} className="text-sm font-bold px-4 py-2 border border-border rounded-xl">Back</button>
              <button onClick={handlePublish} className="bg-primary text-primary-foreground font-bold px-8 py-2 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors">
                <CheckCircle size={18} /> Publish Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
