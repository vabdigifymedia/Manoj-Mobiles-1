'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/apiClient'
import { CategoryResponseDTO } from '@/lib/types'
import { VariantTemplate, VariantTemplateField, VariantFieldType, PREDEFINED_VARIANT_TEMPLATES } from '@/lib/variantTemplates'
import { toast } from 'sonner'
import { 
  FaTrashCan, 
  FaPlus, 
  FaFloppyDisk, 
  FaBoxesStacked, 
  FaLock, 
  FaArrowUp, 
  FaArrowDown, 
  FaTag, 
  FaCircleInfo,
  FaCopy
} from 'react-icons/fa6'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminVariantTemplatesPage() {
  const [templates, setTemplates] = useState<(VariantTemplate & { usageCount?: number; categoryIds?: string[] })[]>(PREDEFINED_VARIANT_TEMPLATES)
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('mobiles')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all')

  // Editor State
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [isSystem, setIsSystem] = useState(false)
  const [fields, setFields] = useState<VariantTemplateField[]>([])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tRes, cRes] = await Promise.all([
        apiClient.getVariantTemplates(),
        apiClient.getCategories()
      ])
      const tList = tRes.data || []
      setTemplates(tList)
      setCategories(cRes.data.data || [])

      if (tList.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(tList[0].id)
      }
    } catch {
      toast.error('Failed to load variant templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Sync editor when selected template changes
  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplateName('')
      setTemplateDesc('')
      setIsSystem(false)
      setFields([])
      return
    }

    const t = templates.find(item => item.id === selectedTemplateId)
    if (t) {
      setTemplateName(t.name)
      setTemplateDesc(t.description || '')
      setIsSystem(Boolean(t.isSystem))
      setFields(JSON.parse(JSON.stringify(t.fields || [])))
    }
  }, [selectedTemplateId, templates])

  const handleStartNewCustomTemplate = () => {
    const newId = `custom_${Date.now()}`
    setSelectedTemplateId(newId)
    setTemplateName('New Custom Template')
    setTemplateDesc('Custom category variant template')
    setIsSystem(false)
    setFields([
      {
        id: `f_${Date.now()}_1`,
        name: 'Size',
        label: 'Size',
        type: 'select',
        options: ['Small', 'Medium', 'Large'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select Size'
      }
    ])
  }

  const handleCloneAsCustom = () => {
    const current = templates.find(t => t.id === selectedTemplateId)
    if (!current) return

    const newId = `custom_${Date.now()}`
    setSelectedTemplateId(newId)
    setTemplateName(`${current.name} (Custom Copy)`)
    setTemplateDesc(`Custom variant template based on ${current.name}`)
    setIsSystem(false)
    setFields(JSON.parse(JSON.stringify(current.fields || [])))
    toast.info('Template cloned as a custom template. You can now edit and save it.')
  }

  const handleAddField = () => {
    const newField: VariantTemplateField = {
      id: `f_${Date.now()}_${fields.length + 1}`,
      name: `Field ${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
      type: 'text',
      options: [],
      required: false,
      sortOrder: fields.length + 1,
      placeholder: 'Enter value'
    }
    setFields([...fields, newField])
  }

  const handleUpdateField = (index: number, updates: Partial<VariantTemplateField>) => {
    const updated = [...fields]
    updated[index] = { ...updated[index], ...updates }
    setFields(updated)
  }

  const handleDeleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= fields.length) return

    const reordered = [...fields]
    const temp = reordered[index]
    reordered[index] = reordered[targetIdx]
    reordered[targetIdx] = temp

    // Update sortOrder
    reordered.forEach((f, idx) => {
      f.sortOrder = idx + 1
    })

    setFields(reordered)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      return toast.error('Template name is required')
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i]
      if (!f.name.trim()) {
        return toast.error(`Field #${i + 1} must have a name`)
      }
      if ((f.type === 'select' || f.type === 'multiselect') && (!f.options || f.options.length === 0)) {
        return toast.error(`Field "${f.name}" requires at least one option`)
      }
    }

    setSaving(true)
    try {
      const res = await apiClient.saveVariantTemplate({
        id: selectedTemplateId,
        name: templateName.trim(),
        description: templateDesc.trim(),
        isSystem,
        fields: fields.map((f, idx) => ({
          ...f,
          name: f.name.trim(),
          label: f.label?.trim() || f.name.trim(),
          sortOrder: idx + 1
        }))
      })

      if (res.success) {
        toast.success('Variant template saved successfully')
        await loadData()
        if (res.data?.id) setSelectedTemplateId(res.data.id)
      } else {
        toast.error(res.message || 'Failed to save template')
      }
    } catch {
      toast.error('An error occurred while saving the template')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (isSystem) {
      return toast.error('System predefined templates cannot be deleted.')
    }

    const current = templates.find(t => t.id === selectedTemplateId)
    if (current && (current.usageCount || 0) > 0) {
      if (!confirm(`This template is currently used by ${current.usageCount} category/categories. Deleting it will cause those categories to fall back to the default template. Are you sure you want to proceed?`)) {
        return
      }
    } else {
      if (!confirm('Are you sure you want to delete this custom template?')) return
    }

    try {
      const res = await apiClient.deleteVariantTemplate(selectedTemplateId)
      if (res.success) {
        toast.success('Template deleted')
        setSelectedTemplateId('mobiles')
        await loadData()
      } else {
        toast.error(res.message || 'Failed to delete template')
      }
    } catch {
      toast.error('Failed to delete template')
    }
  }

  const filteredTemplates = templates.filter(t => {
    if (filterType === 'system') return t.isSystem
    if (filterType === 'custom') return !t.isSystem
    return true
  })

  const currentTemplate = templates.find(t => t.id === selectedTemplateId)

  // Find category names using this template
  const categoriesUsingThisTemplate = categories.filter(c => 
    currentTemplate?.categoryIds?.includes(c.id)
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
          Loading Variant Templates...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Variant Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure dynamic variant blueprints (RAM, Storage, Connectivity, etc.) mapped to product categories.
          </p>
        </div>
        <button
          onClick={handleStartNewCustomTemplate}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
        >
          <FaPlus size={14} /> + Create Custom Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Template List */}
        <div className="lg:col-span-1 border border-border rounded-2xl bg-card p-4 space-y-4 shadow-xs h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Templates</h2>
            <div className="flex gap-1 text-[11px] font-semibold bg-muted/60 p-1 rounded-lg">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded ${filterType === 'all' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('system')}
                className={`px-2 py-0.5 rounded ${filterType === 'system' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'}`}
              >
                System
              </button>
              <button
                onClick={() => setFilterType('custom')}
                className={`px-2 py-0.5 rounded ${filterType === 'custom' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'}`}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredTemplates.map(t => {
              const isSelected = t.id === selectedTemplateId
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isSelected 
                      ? 'bg-primary/10 border-primary/30 text-primary shadow-xs' 
                      : 'border-transparent hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm truncate">{t.name}</span>
                    {t.isSystem ? (
                      <span className="text-[10px] flex items-center gap-1 font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        <FaLock size={8} /> System
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{t.fields?.length || 0} fields</span>
                    {t.usageCount !== undefined && t.usageCount > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <FaTag size={9} /> {t.usageCount} {t.usageCount === 1 ? 'category' : 'categories'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Template Editor */}
        <div className="lg:col-span-3">
          <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
            {/* Editor Top Bar */}
            <div className="bg-muted/30 p-5 border-b border-border space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Template Name
                    </label>
                    {isSystem && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <FaLock size={9} /> Predefined System Template (Read-Only)
                      </span>
                    )}
                  </div>
                  <input
                    value={templateName}
                    disabled={isSystem}
                    onChange={e => setTemplateName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 font-bold text-base outline-none focus:ring-1 focus:ring-primary disabled:opacity-80 disabled:bg-muted/20"
                    placeholder="e.g. Smart Rings Variant Template"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSystem ? (
                    <button
                      onClick={handleCloneAsCustom}
                      className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-bold px-4 py-2 rounded-xl text-sm border border-border transition-colors cursor-pointer"
                      title="Clone as Custom Template to customize fields"
                    >
                      <FaCopy size={13} /> Duplicate as Custom
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleDeleteTemplate}
                        className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <FaFloppyDisk />
                        {saving ? 'Saving...' : 'Save Template'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Template Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
                <input
                  value={templateDesc}
                  disabled={isSystem}
                  onChange={e => setTemplateDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-80 disabled:bg-muted/20"
                  placeholder="Optional brief description..."
                />
              </div>

              {/* Categories using this template */}
              {categoriesUsingThisTemplate.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs bg-muted/40 p-2.5 rounded-xl border border-border">
                  <span className="font-semibold text-muted-foreground">Used by categories:</span>
                  {categoriesUsingThisTemplate.map(c => (
                    <span key={c.id} className="font-bold bg-background px-2.5 py-1 rounded-md border border-border text-foreground">
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Fields Editor */}
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <FaBoxesStacked className="text-primary" /> Category-Specific Variant Fields
                  </h3>
                  {!isSystem && (
                    <button
                      onClick={handleAddField}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-3 py-1.5 rounded-lg"
                    >
                      <FaPlus size={11} /> + Add Variant Field
                    </button>
                  )}
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/10 text-muted-foreground">
                    <p className="font-semibold">No category-specific fields configured.</p>
                    <p className="text-xs mt-1">This category will only use common variant fields (Color, SKU, Stock, MRP, Selling Price).</p>
                    {!isSystem && (
                      <button
                        onClick={handleAddField}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg"
                      >
                        <FaPlus size={10} /> Add First Field
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, idx) => {
                      return (
                        <div
                          key={field.id || idx}
                          className="border border-border rounded-xl p-4 bg-muted/10 space-y-3 transition-colors hover:border-border/80"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-muted-foreground w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-sm text-foreground">{field.name || 'Untitled Field'}</span>
                              {field.required && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                                  Required *
                                </span>
                              )}
                            </div>

                            {!isSystem && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveField(idx, 'up')}
                                  className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted"
                                  title="Move Up"
                                >
                                  <FaArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === fields.length - 1}
                                  onClick={() => handleMoveField(idx, 'down')}
                                  className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted"
                                  title="Move Down"
                                >
                                  <FaArrowDown size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(idx)}
                                  className="p-1.5 text-muted-foreground hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 ml-1"
                                  title="Delete Field"
                                >
                                  <FaTrashCan size={12} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                Field Name *
                              </label>
                              <input
                                disabled={isSystem}
                                value={field.name}
                                onChange={e => handleUpdateField(idx, { name: e.target.value, label: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary disabled:opacity-80"
                                placeholder="e.g. RAM, Storage, Ring Size"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                Field Type *
                              </label>
                              <Select
                                disabled={isSystem}
                                value={field.type}
                                onValueChange={(val) => {
                                  if (val) handleUpdateField(idx, { type: val as VariantFieldType })
                                }}
                              >
                                <SelectTrigger className="w-full bg-background border-border rounded-lg h-9 text-sm">
                                  <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                                  <SelectItem value="multiselect">Multi Select</SelectItem>
                                  <SelectItem value="text">Text (Free Input)</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean (Yes / No)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-4 pt-5">
                              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold">
                                <input
                                  type="checkbox"
                                  disabled={isSystem}
                                  checked={Boolean(field.required)}
                                  onChange={e => handleUpdateField(idx, { required: e.target.checked })}
                                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                />
                                Required Field
                              </label>
                            </div>
                          </div>

                          {/* Options editor for Select / Multi Select */}
                          {(field.type === 'select' || field.type === 'multiselect') && (
                            <div className="pt-1">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-muted-foreground block">
                                  Selectable Options (comma-separated)
                                </label>
                                <span className="text-[11px] text-muted-foreground">
                                  {field.options?.length || 0} option(s) defined
                                </span>
                              </div>
                              <input
                                disabled={isSystem}
                                value={(field.options || []).join(', ')}
                                onChange={e => {
                                  const raw = e.target.value
                                  const opts = raw.split(',').map(s => s.trim()).filter(Boolean)
                                  handleUpdateField(idx, { options: opts })
                                }}
                                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary disabled:opacity-80"
                                placeholder="e.g. 64GB, 128GB, 256GB, 512GB, 1TB"
                              />
                              {field.options && field.options.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {field.options.map((opt, oIdx) => (
                                    <span
                                      key={oIdx}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-foreground border border-border font-medium"
                                    >
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Informational Footer: Common fields */}
              <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-4 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-700 dark:text-blue-300">
                  <FaCircleInfo /> Common Product Variant Fields (Included Automatically)
                </div>
                <p>
                  Every product variant form will always include: <strong>Variant Name</strong>, <strong>Color</strong>, <strong>SKU</strong> (with Auto-generate), <strong>Stock Quantity</strong>, <strong>MRP</strong>, and <strong>Selling Price</strong>.
                </p>
                <p className="text-muted-foreground dark:text-blue-300/70">
                  The category-specific fields above will render dynamically alongside these common fields whenever this category is selected in the product form.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
