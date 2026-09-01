'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaCircleInfo, FaHardDrive, FaImage, FaShieldHalved, FaMobileScreen, FaStar, FaBatteryFull, FaBolt, FaCamera, FaBox, FaCheck, FaWifi, FaCircleQuestion, FaGear, FaChevronLeft, FaMemory, FaMicrochip, FaBluetooth, FaTrashCan, FaChevronRight, FaTruckFast, FaPlus, FaPen, FaCircleCheck, FaListCheck, FaGlobe, FaDownload, FaSpinner, FaPaste } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import { parsePastedSpecsText, ALLOWED_GROUPS, ExtractedSpecItem } from '@/lib/specParser'

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

const availableIcons = { Settings: FaGear, Camera: FaCamera, Cpu: FaMicrochip, Zap: FaBolt, Battery: FaBatteryFull, Bluetooth: FaBluetooth, MemoryStick: FaMemory, Microchip: FaMicrochip, Star: FaStar, Wifi: FaWifi, CheckCircle: FaCircleCheck, Truck: FaTruckFast, Smartphone: FaMobileScreen, HardDrive: FaHardDrive, ShieldCheck: FaShieldHalved }

import { parseRamRomFromText } from '@/lib/utils'

export function ProductWizard({ productId }: { productId?: string }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [highestStepReached, setHighestStepReached] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [draftAvailable, setDraftAvailable] = useState(false)

  // Validation & Database SKU tracking
  const [existingDbSkus, setExistingDbSkus] = useState<Map<string, { productId: string; variantId: string }>>(new Map())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Step 1: Base FaCircleInfo
  const [baseInfo, setBaseInfo] = useState({
    name: '', brandId: '', categoryId: '', description: '',
    warrantyMonths: 12, returnPolicyDays: 7, isReturnable: true,
    slug: '', metaTitle: '', metaDescription: '', metaKeywords: ''
  })

  // Step 2: Highlights
  const [highlights, setHighlights] = useState<LocalHighlight[]>([])
  const [deletedHighlightIds, setDeletedHighlightIds] = useState<string[]>([])
  const [showHighlightForm, setShowHighlightForm] = useState(false)
  const [highlightForm, setHighlightForm] = useState({ iconName: 'Star', text: '' })
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null)

  // Step 3: Variants
  const [variants, setVariants] = useState<LocalVariant[]>([])
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantForm, setVariantForm] = useState({
    variantName: '', sku: '', color: '', mrp: '', sellingPrice: '',
    gstPercent: 0, stockQty: 0, codAvailable: true
  })
  const [draggedImage, setDraggedImage] = useState<{color: string, index: number} | null>(null)
  const [dragActiveColor, setDragActiveColor] = useState<string | null>(null)
  const [dragEnabledImage, setDragEnabledImage] = useState<{color: string, index: number} | null>(null)

  // Step 4: Global Specs
  const [globalSpecs, setGlobalSpecs] = useState<{specGroup: string, specKey: string, specValue: string}[]>([])
  const [importMode, setImportMode] = useState<'paste' | 'url' | 'screenshots'>('paste')
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [screenshotFiles, setScreenshotFiles] = useState<{ file: File; previewUrl: string }[]>([])
  const [screenshotImportLoading, setScreenshotImportLoading] = useState(false)

  // Paste Specification Importer State
  const [pastedText, setPastedText] = useState('')
  const [parsedPreviewSpecs, setParsedPreviewSpecs] = useState<ExtractedSpecItem[] | null>(null)
  const [unclassifiedPreview, setUnclassifiedPreview] = useState<{ line: string; group: string }[]>([])
  const [validationStatus, setValidationStatus] = useState<{ totalCount: number; validCount: number; flaggedCount: number; message: string } | null>(null)
  const [showPastePreview, setShowPastePreview] = useState(false)

  const handleParsePastedSpecs = () => {
    if (!pastedText.trim()) {
      toast.error('Please paste specification text first.')
      return
    }

    const { specs, unclassified, validationStatus } = parsePastedSpecsText(pastedText)

    if (specs.length === 0 && unclassified.length === 0) {
      toast.error('Could not find valid specifications in the pasted text. Please check the text and try again.')
      return
    }

    setParsedPreviewSpecs(specs)
    setUnclassifiedPreview(unclassified)
    setValidationStatus(validationStatus)
    setShowPastePreview(true)
    toast.success(validationStatus.message)
  }

  const handleUpdatePreviewSpec = (index: number, field: 'specKey' | 'specValue' | 'specGroup', val: string) => {
    if (!parsedPreviewSpecs) return
    const copy = [...parsedPreviewSpecs]
    copy[index] = { ...copy[index], [field]: val }
    setParsedPreviewSpecs(copy)
  }

  const handleDeletePreviewSpec = (index: number) => {
    if (!parsedPreviewSpecs) return
    setParsedPreviewSpecs(parsedPreviewSpecs.filter((_, i) => i !== index))
  }

  const handleAddPreviewSpecToGroup = (groupName: string) => {
    setParsedPreviewSpecs(prev => [
      ...(prev || []),
      { specGroup: groupName, specKey: '', specValue: '' }
    ])
  }

  const handleAssignUnclassifiedToGroup = (unclassifiedIndex: number, targetGroup: string, asType: 'key' | 'value') => {
    const item = unclassifiedPreview[unclassifiedIndex]
    if (!item) return

    setUnclassifiedPreview(prev => prev.filter((_, i) => i !== unclassifiedIndex))
    setParsedPreviewSpecs(prev => [
      ...(prev || []),
      {
        specGroup: targetGroup,
        specKey: asType === 'key' ? item.line : 'Specification',
        specValue: asType === 'value' ? item.line : ''
      }
    ])
  }

  const handleApplyPastedSpecs = () => {
    if (!parsedPreviewSpecs || parsedPreviewSpecs.length === 0) {
      toast.error('No valid specifications to apply.')
      return
    }

    const validSpecs = parsedPreviewSpecs.filter(s => s.specKey.trim() && s.specValue.trim())

    if (validSpecs.length === 0) {
      toast.error('All specification rows are empty. Please enter spec names and values.')
      return
    }

    setGlobalSpecs(prev => {
      const updated = [...prev]
      const existingKeyMap = new Map<string, number>()

      prev.forEach((s, idx) => {
        const uKey = `${(s.specGroup || 'General').toLowerCase()}___${s.specKey.toLowerCase().trim()}`
        existingKeyMap.set(uKey, idx)
      })

      validSpecs.forEach(pSpec => {
        const uKey = `${(pSpec.specGroup || 'General').toLowerCase()}___${pSpec.specKey.toLowerCase().trim()}`

        if (existingKeyMap.has(uKey)) {
          const idx = existingKeyMap.get(uKey)!
          updated[idx] = {
            ...updated[idx],
            specValue: pSpec.specValue.trim()
          }
        } else {
          updated.push({
            specGroup: pSpec.specGroup || 'General',
            specKey: pSpec.specKey.trim(),
            specValue: pSpec.specValue.trim()
          })
          existingKeyMap.set(uKey, updated.length - 1)
        }
      })

      return updated
    })

    setShowPastePreview(false)
    setPastedText('')
    setParsedPreviewSpecs(null)
    setUnclassifiedPreview([])
    toast.success(`Successfully applied ${validSpecs.length} specification(s) to product!`)
    setTimeout(() => handleAutoGenerateRamRomHighlight(), 300)
  }

  const handleAddScreenshots = (files: FileList | File[]) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const fileArray = Array.from(files).filter(f => validTypes.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|webp)$/i))
    if (fileArray.length === 0) {
      toast.error('Please select valid JPG, JPEG, PNG, or WEBP image files.')
      return
    }

    const newItems = fileArray.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }))

    setScreenshotFiles(prev => [...prev, ...newItems])
    toast.success(`Added ${fileArray.length} screenshot(s)`)
  }

  const handleRemoveScreenshot = (index: number) => {
    setScreenshotFiles(prev => {
      const target = prev[index]
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleImportSpecsFromScreenshots = async () => {
    if (screenshotFiles.length === 0) {
      toast.error('Please upload at least one screenshot image first.')
      return
    }

    setScreenshotImportLoading(true)
    try {
      const base64Promises = screenshotFiles.map(({ file }) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      })

      const base64Images = await Promise.all(base64Promises)
      const res = await apiClient.importSpecsFromImage({ images: base64Images })

      if (res.success && res.data && res.data.length > 0) {
        setGlobalSpecs(prev => {
          const existingKeys = new Set(prev.map(s => `${(s.specGroup || 'General').toLowerCase()}_${s.specKey.toLowerCase()}`))
          const updated = [...prev]

          res.data!.forEach(imp => {
            const keyId = `${(imp.specGroup || 'General').toLowerCase()}_${imp.specKey.toLowerCase()}`
            if (!existingKeys.has(keyId)) {
              existingKeys.add(keyId)
              updated.push({
                specGroup: imp.specGroup || 'General',
                specKey: imp.specKey,
                specValue: imp.specValue
              })
            }
          })

          return updated
        })

        toast.success(`Successfully extracted & filled ${res.count || res.data.length} specifications from screenshot(s)!`)
        setTimeout(() => handleAutoGenerateRamRomHighlight(), 300)
      } else {
        toast.error(res.message || 'Could not extract specifications from uploaded screenshots.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process screenshot images.')
    } finally {
      setScreenshotImportLoading(false)
    }
  }

  // Dropdown data
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, brandsRes, prodsRes] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getBrands(0, 100),
          apiClient.getProducts(0, 100, true).catch(() => null)
        ])
        setCategories(catsRes.data.data)
        setBrands(brandsRes.data.data.content)

        // Build existing DB SKU map
        const skuMap = new Map<string, { productId: string; variantId: string }>()
        if (prodsRes?.data?.data?.content) {
          const prodList = prodsRes.data.data.content
          await Promise.all(prodList.map(async (pItem) => {
            try {
              const fullProd = await apiClient.getProductById(pItem.id)
              const pData = fullProd.data?.data
              if (pData?.variants) {
                pData.variants.forEach(v => {
                  if (v.sku) {
                    skuMap.set(v.sku.trim().toUpperCase(), { productId: pData.id, variantId: v.id })
                  }
                })
              }
            } catch (e) {
              // Ignore individual product fetch failure
            }
          }))
        }
        setExistingDbSkus(skuMap)

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
        const draftStr = localStorage.getItem(`product-draft-${productId || 'new'}`)
        if (draftStr) setDraftAvailable(true)
        setInitialLoading(false)
      }
    }
    fetchData()
  }, [productId])

  // Auto-generate RAM/ROM Highlight from globalSpecs or variants
  const handleAutoGenerateRamRomHighlight = () => {
    let ramVal = ''
    let romVal = ''

    // 1. Search in globalSpecs
    globalSpecs.forEach(s => {
      const k = (s.specKey || '').toLowerCase()
      const v = (s.specValue || '').trim()
      if (!v) return
      if ((k.includes('ram') || k === 'memory') && !ramVal) {
        ramVal = v.toUpperCase().includes('RAM') ? v : `${v} RAM`
      }
      if ((k.includes('rom') || k.includes('storage') || k.includes('internal')) && !romVal) {
        romVal = v.toUpperCase().includes('ROM') || v.toUpperCase().includes('STORAGE') ? v : `${v} ROM`
      }
    })

    // 2. Search in variant names (e.g. "4GB + 128GB" or "128GB")
    if (!ramVal || !romVal) {
      for (const v of variants) {
        const parsed = parseRamRomFromText(v.variantName || '')
        if (parsed.ram && !ramVal) ramVal = parsed.ram
        if (parsed.rom && !romVal) romVal = parsed.rom
        if (ramVal && romVal) break
      }
    }

    if (ramVal || romVal) {
      let highlightText = ''
      if (ramVal && romVal) {
        highlightText = `${ramVal} | ${romVal}`
      } else if (romVal) {
        highlightText = romVal
      } else if (ramVal) {
        highlightText = ramVal
      }

      setHighlights(prev => {
        const existingIdx = prev.findIndex(h => 
          h.iconName === 'MemoryStick' || 
          h.text.toUpperCase().includes('RAM') || 
          h.text.toUpperCase().includes('ROM')
        )
        if (existingIdx >= 0) {
          if (prev[existingIdx].text !== highlightText) {
            const updated = [...prev]
            updated[existingIdx] = { ...updated[existingIdx], text: highlightText, iconName: 'MemoryStick' }
            return updated
          }
          return prev
        }
        return [
          { id: `h_auto_${Date.now()}`, iconName: 'MemoryStick', text: highlightText, displayOrder: 1 },
          ...prev
        ]
      })
      return true
    }
    return false
  }

  useEffect(() => {
    if (!initialLoading) {
      handleAutoGenerateRamRomHighlight()
    }
  }, [globalSpecs, variants, initialLoading])

  const generateAutoSku = (variantName?: string, color?: string) => {
    const brandObj = brands.find(b => b.id === baseInfo.brandId)
    const brandStr = brandObj?.name || 'MNJ'
    
    const bCode = brandStr.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'MNJ'

    const words = (baseInfo.name || 'MODEL').trim().split(/\s+/)
    let pCode = ''
    if (words.length === 1) {
      pCode = words[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase()
    } else {
      pCode = words.map(w => w.replace(/[^a-zA-Z0-9]/g, '')).filter(Boolean).map(w => w[0]).join('').substring(0, 5).toUpperCase()
    }
    if (!pCode) pCode = 'MOB'

    const vName = variantName ?? variantForm.variantName ?? ''
    const parsed = parseRamRomFromText(vName)
    let vCode = ''
    if (parsed.ram && parsed.rom) {
      const ramNum = parsed.ram.replace(/[^0-9]/g, '')
      const romNum = parsed.rom.replace(/[^0-9]/g, '')
      vCode = `${ramNum}-${romNum}`
    } else if (parsed.rom) {
      const romNum = parsed.rom.replace(/[^0-9]/g, '')
      vCode = romNum
    } else if (parsed.ram) {
      const ramNum = parsed.ram.replace(/[^0-9]/g, '')
      vCode = ramNum
    } else {
      vCode = vName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() || 'STD'
    }

    const colorStr = (color ?? variantForm.color ?? '').trim()
    let cCode = 'DEF'
    if (colorStr) {
      const cWords = colorStr.split(/\s+/)
      if (cWords.length > 1) {
        cCode = cWords.map(w => w[0]).join('').substring(0, 3).toUpperCase()
      } else {
        cCode = colorStr.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
      }
    }

    return `${bCode}-${pCode}-${vCode}-${cCode}`.toUpperCase()
  }

  // --- SKU Duplication Check & Auto Unique SKU Generator ---
  const isSkuTaken = (skuToTest: string, currentEditingVariantId?: string | null) => {
    if (!skuToTest || !skuToTest.trim()) return false
    const uppercaseSku = skuToTest.trim().toUpperCase()

    // 1. Check in local form state (excluding current variant being edited)
    const takenInLocalForm = variants.some(v => 
      v.sku?.trim().toUpperCase() === uppercaseSku && 
      v.id !== currentEditingVariantId
    )
    if (takenInLocalForm) return true

    // 2. Check in DB SKU map
    const dbInfo = existingDbSkus.get(uppercaseSku)
    if (dbInfo) {
      if (dbInfo.productId !== productId || dbInfo.variantId !== currentEditingVariantId) {
        return true
      }
    }

    return false
  }

  const generateUniqueSku = (variantName?: string, color?: string, currentEditingVariantId?: string | null) => {
    const baseSku = generateAutoSku(variantName, color)
    let candidate = baseSku
    let counter = 1

    while (isSkuTaken(candidate, currentEditingVariantId)) {
      candidate = `${baseSku}-${counter}`
      counter++
    }

    return candidate
  }

  // --- Real-time Validation Engine ---
  const clearFieldError = (fieldKey: string) => {
    setFormErrors(prev => {
      if (!prev[fieldKey]) return prev
      const copy = { ...prev }
      delete copy[fieldKey]
      return copy
    })
  }

  const validateField = (fieldKey: string, value: any, extra?: any) => {
    setFormErrors(prev => {
      const copy = { ...prev }
      
      if (fieldKey === 'baseInfo_name') {
        if (!value || !String(value).trim()) copy['baseInfo_name'] = 'Product Name is required.'
        else delete copy['baseInfo_name']
      }
      if (fieldKey === 'baseInfo_brandId') {
        if (!value) copy['baseInfo_brandId'] = 'Brand selection is required.'
        else delete copy['baseInfo_brandId']
      }
      if (fieldKey === 'baseInfo_categoryId') {
        if (!value) copy['baseInfo_categoryId'] = 'Category selection is required.'
        else delete copy['baseInfo_categoryId']
      }

      if (fieldKey === 'variant_variantName') {
        if (!value || !String(value).trim()) copy['variant_variantName'] = 'Variant Name is required.'
        else delete copy['variant_variantName']
      }
      if (fieldKey === 'variant_color') {
        if (!value || !String(value).trim()) copy['variant_color'] = 'Color is required.'
        else delete copy['variant_color']
      }
      if (fieldKey === 'variant_sku') {
        const skuVal = String(value || '').trim().toUpperCase()
        if (!skuVal) {
          copy['variant_sku'] = 'SKU is required.'
        } else if (isSkuTaken(skuVal, editingVariantId)) {
          copy['variant_sku'] = `SKU '${skuVal}' already exists in database or another variant.`
        } else {
          delete copy['variant_sku']
        }
      }
      if (fieldKey === 'variant_mrp') {
        const num = Number(value)
        if (!value || isNaN(num) || num <= 0) copy['variant_mrp'] = 'MRP must be greater than 0.'
        else delete copy['variant_mrp']
      }
      if (fieldKey === 'variant_sellingPrice') {
        const priceNum = Number(value)
        const mrpNum = Number(extra?.mrp ?? variantForm.mrp)
        if (!value || isNaN(priceNum) || priceNum <= 0) {
          copy['variant_sellingPrice'] = 'Selling price must be greater than 0.'
        } else if (mrpNum > 0 && priceNum > mrpNum) {
          copy['variant_sellingPrice'] = 'Selling price cannot exceed MRP.'
        } else {
          delete copy['variant_sellingPrice']
        }
      }
      if (fieldKey === 'variant_stockQty') {
        const stockNum = Number(value)
        if (value === '' || value === undefined || isNaN(stockNum) || stockNum < 0) {
          copy['variant_stockQty'] = 'Stock quantity cannot be negative.'
        } else {
          delete copy['variant_stockQty']
        }
      }

      return copy
    })
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!baseInfo.name || !baseInfo.name.trim()) errs['baseInfo_name'] = 'Product Name is required.'
    if (!baseInfo.brandId) errs['baseInfo_brandId'] = 'Brand selection is required.'
    if (!baseInfo.categoryId) errs['baseInfo_categoryId'] = 'Category selection is required.'
    
    setFormErrors(prev => ({ ...prev, ...errs }))
    return Object.keys(errs).length === 0
  }

  const validateVariantForm = () => {
    const errs: Record<string, string> = {}
    if (!variantForm.variantName || !variantForm.variantName.trim()) errs['variant_variantName'] = 'Variant Name is required.'
    if (!variantForm.color || !variantForm.color.trim()) errs['variant_color'] = 'Color is required.'
    
    const skuVal = (variantForm.sku || '').trim().toUpperCase()
    if (!skuVal) {
      errs['variant_sku'] = 'SKU is required.'
    } else if (isSkuTaken(skuVal, editingVariantId)) {
      errs['variant_sku'] = `SKU '${skuVal}' already exists in database or another variant.`
    }

    const mrpNum = Number(variantForm.mrp)
    if (!variantForm.mrp || isNaN(mrpNum) || mrpNum <= 0) errs['variant_mrp'] = 'MRP must be greater than 0.'

    const priceNum = Number(variantForm.sellingPrice)
    if (!variantForm.sellingPrice || isNaN(priceNum) || priceNum <= 0) {
      errs['variant_sellingPrice'] = 'Selling price must be greater than 0.'
    } else if (mrpNum > 0 && priceNum > mrpNum) {
      errs['variant_sellingPrice'] = 'Selling price cannot exceed MRP.'
    }

    const stockNum = Number(variantForm.stockQty)
    if (variantForm.stockQty === '' || variantForm.stockQty === undefined || isNaN(stockNum) || stockNum < 0) {
      errs['variant_stockQty'] = 'Stock quantity cannot be negative.'
    }

    setFormErrors(prev => ({ ...prev, ...errs }))
    return Object.keys(errs).length === 0
  }

  const validateAllForPublish = () => {
    const errs: Record<string, string> = {}
    if (!baseInfo.name || !baseInfo.name.trim()) errs['baseInfo_name'] = 'Product Name is required.'
    if (!baseInfo.brandId) errs['baseInfo_brandId'] = 'Brand selection is required.'
    if (!baseInfo.categoryId) errs['baseInfo_categoryId'] = 'Category selection is required.'

    if (variants.length === 0) {
      errs['variants'] = 'At least 1 product variant is required before publishing.'
    }

    setFormErrors(errs)

    if (errs['baseInfo_name'] || errs['baseInfo_brandId'] || errs['baseInfo_categoryId']) {
      setCurrentStep(1)
      toast.error('Please fix validation errors in Step 1 (Basic Information).')
      return false
    }

    if (errs['variants']) {
      setCurrentStep(3)
      toast.error(errs['variants'])
      return false
    }

    return Object.keys(errs).length === 0
  }

  const handleRestoreDraft = () => {
    const draftStr = localStorage.getItem(`product-draft-${productId || 'new'}`)
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr)
        if (draft.baseInfo) setBaseInfo(draft.baseInfo)
        if (draft.highlights) setHighlights(draft.highlights)
        if (draft.variants) setVariants(draft.variants)
        if (draft.globalSpecs) setGlobalSpecs(draft.globalSpecs)
        if (draft.currentStep) setCurrentStep(draft.currentStep)
        if (draft.highestStepReached) setHighestStepReached(draft.highestStepReached)
        setDraftAvailable(false)
        toast.success('Draft restored!')
      } catch (e) {
        console.error('Failed to parse draft', e)
      }
    }
  }

  const handleStepClick = (step: number) => {
    if (step <= highestStepReached) setCurrentStep(step)
  }

  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingHighlightId) {
      setHighlights(highlights.map(h => h.id === editingHighlightId ? { ...h, iconName: highlightForm.iconName, text: highlightForm.text } : h))
      setEditingHighlightId(null)
    } else {
      setHighlights([...highlights, { 
        id: `h${Date.now()}`, 
        iconName: highlightForm.iconName, 
        text: highlightForm.text,
        displayOrder: highlights.length + 1
      }])
    }
    setHighlightForm({ iconName: 'Star', text: '' })
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
    if (!validateVariantForm()) {
      toast.error('Please fix highlighted errors in the variant form.')
      return
    }

    const finalSku = (variantForm.sku.trim() || generateUniqueSku(variantForm.variantName, variantForm.color, editingVariantId)).toUpperCase()
    if (editingVariantId) {
      setVariants(variants.map(v => v.id === editingVariantId ? {
        ...v,
        variantName: variantForm.variantName,
        sku: finalSku,
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
        sku: finalSku,
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
    clearFieldError('variants')
  }

  const handleEditVariantClick = (v: LocalVariant) => {
    setVariantForm({
      variantName: v.variantName,
      sku: v.sku || generateUniqueSku(v.variantName, v.color, v.id),
      color: v.color,
      mrp: v.mrp.toString(),
      sellingPrice: v.sellingPrice.toString(),
      gstPercent: v.gstPercent,
      stockQty: v.stockQty,
      codAvailable: v.codAvailable
    })
    setEditingVariantId(v.id)
    setShowVariantForm(true)
    setFormErrors(prev => {
      const copy = { ...prev }
      delete copy['variant_variantName']
      delete copy['variant_color']
      delete copy['variant_sku']
      delete copy['variant_mrp']
      delete copy['variant_sellingPrice']
      delete copy['variant_stockQty']
      return copy
    })
  }

  const handleDeleteVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id))
  }

  const handleOpenAddVariant = () => {
    let initialVName = ''
    let initialMrp = ''
    let initialPrice = ''
    let initialGst = 0
    let initialStock = 0
    let initialCod = true

    if (variants.length > 0) {
      const lastVariant = variants[variants.length - 1]
      initialVName = lastVariant.variantName
      initialMrp = lastVariant.mrp.toString()
      initialPrice = lastVariant.sellingPrice.toString()
      initialGst = lastVariant.gstPercent
      initialStock = lastVariant.stockQty
      initialCod = lastVariant.codAvailable
    }

    const autoSku = generateUniqueSku(initialVName, '', null)

    setVariantForm({
      variantName: initialVName,
      sku: autoSku,
      color: '',
      mrp: initialMrp,
      sellingPrice: initialPrice,
      gstPercent: initialGst,
      stockQty: initialStock,
      codAvailable: initialCod
    })
    setEditingVariantId(null)
    setShowVariantForm(true)
    setFormErrors(prev => {
      const copy = { ...prev }
      delete copy['variant_variantName']
      delete copy['variant_color']
      delete copy['variant_sku']
      delete copy['variant_mrp']
      delete copy['variant_sellingPrice']
      delete copy['variant_stockQty']
      return copy
    })
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

  const handleDeleteSpecGroup = (group: string) => {
    setGlobalSpecs(globalSpecs.filter(s => s.specGroup !== group))
  }

  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const handleLoadCategoryTemplate = async () => {
    if (!baseInfo.categoryId) return toast.error('Please select a category first (Step 1)')
    setLoadingTemplate(true)
    try {
      const res = await apiClient.getSpecTemplateByCategoryId(baseInfo.categoryId)
      if (res.data.data) {
        const template = res.data.data
        const newSpecs = [...globalSpecs]
        
        template.groups.forEach(g => {
          g.specKeys.forEach(k => {
            // Only add if this exact group+key combination doesn't exist
            if (!newSpecs.some(s => s.specGroup === g.groupName && s.specKey === k)) {
              newSpecs.push({ specGroup: g.groupName, specKey: k, specValue: '' })
            }
          })
        })
        
        setGlobalSpecs(newSpecs)
        toast.success(`Loaded spec template for category`)
      } else {
        toast.error('No template found for this category')
      }
    } catch (e) {
      toast.error('Failed to load category spec template')
    } finally {
      setLoadingTemplate(false)
    }
  }

  const handleImportSpecsFromUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUrl = importUrl.trim()
    if (!cleanUrl) {
      toast.error('Please paste a product URL first.')
      return
    }

    setImportLoading(true)
    try {
      const res = await apiClient.importSpecsFromUrl(cleanUrl)
      if (res.success && res.data && res.data.length > 0) {
        setGlobalSpecs(prev => {
          const existingKeys = new Set(prev.map(s => `${(s.specGroup || 'General').toLowerCase()}_${s.specKey.toLowerCase()}`))
          const updated = [...prev]

          res.data!.forEach(imp => {
            const keyId = `${(imp.specGroup || 'General').toLowerCase()}_${imp.specKey.toLowerCase()}`
            if (!existingKeys.has(keyId)) {
              existingKeys.add(keyId)
              updated.push({
                specGroup: imp.specGroup || 'General',
                specKey: imp.specKey,
                specValue: imp.specValue
              })
            }
          })

          return updated
        })

        toast.success(`Successfully extracted & filled ${res.count || res.data.length} specifications!`)
        setTimeout(() => handleAutoGenerateRamRomHighlight(), 300)
      } else {
        toast.error(res.message || 'No specifications found at this URL.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to fetch specifications from the URL.')
    } finally {
      setImportLoading(false)
    }
  }

  const handleMoveImage = (color: string, fromIndex: number, toIndex: number) => {
    setVariants(variants.map(varItem => {
      if ((varItem.color || 'Default Color') === color) {
        const newImages = [...(varItem.images || [])];
        const [movedItem] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedItem);
        return { ...varItem, images: newImages };
      }
      return varItem;
    }));
  }

  // Publish Product
  const handlePublish = async () => {
    if (!validateAllForPublish()) return
    
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
        const activeSku = v.sku?.trim() || generateAutoSku(v.variantName, v.color)
        let finalVariantId = v.id
        const isNewVariant = v.id.startsWith('v') // local id
        
        if (isNewVariant) {
          const varRes = await apiClient.createVariant({
            productId: finalProductId,
            variantName: v.variantName,
            sku: activeSku,
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
            sku: activeSku,
            color: v.color,
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            gstPercent: v.gstPercent,
            stockQty: v.stockQty,
            codAvailable: v.codAvailable
          })
        }

        // 4. Specs (Applied globally to all variants)
        const validSpecs = globalSpecs.filter(s => s.specKey?.trim() && s.specValue?.trim());
        // Always send specs if there were some originally or currently to sync DB state
        await apiClient.addVariantSpecifications(finalVariantId, validSpecs.map(s => ({
          specGroup: s.specGroup || 'General',
          specKey: s.specKey.trim(),
          specValue: s.specValue.trim()
        })));

        // 5. Images
        if (v.images && v.images.length > 0) {
          await apiClient.addVariantImages(finalVariantId, v.images)
        }
      }
      setLoading(false)
      localStorage.removeItem(`product-draft-${productId || 'new'}`)
      toast.success(productId ? 'Product updated successfully!' : 'Product created successfully!')
      router.push('/admin/products')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      let errorMessage = axiosErr?.response?.data?.message || 'Failed to save product'
      
      // Mask raw database errors
      if (errorMessage.includes('Unexpected row count') || errorMessage.includes('OptimisticLock') || errorMessage.includes('StaleStateException')) {
        errorMessage = 'We encountered a sync issue. Your changes were mostly saved, but please refresh to confirm.'
      } else if (errorMessage.includes('Data truncation') || errorMessage.includes('value too long') || errorMessage.includes('SQL')) {
        errorMessage = 'One of the fields contains too much text. Please shorten it and try again.'
      } else if (errorMessage.includes('ConstraintViolation')) {
        errorMessage = 'There is a validation error. Please check your inputs.'
      }
      
      toast.error(errorMessage)
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
          <FaChevronLeft />
        </Link>
        <FaCircleQuestion className="text-primary" /> {productId ? 'Edit Product' : 'Create New Product'}
      </div>

      {draftAvailable && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            You have an unsaved draft. Would you like to restore your previous progress?
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => { localStorage.removeItem(`product-draft-${productId || 'new'}`); setDraftAvailable(false); }} 
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-yellow-800 dark:text-yellow-200 border border-yellow-800/30 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleRestoreDraft} 
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors shadow-sm"
            >
              Restore Draft
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between border-b border-border mb-8 overflow-x-auto pb-4">
        {[
          { step: 1, label: 'Base FaCircleInfo', icon: FaCircleInfo },
          { step: 2, label: 'Highlights', icon: FaStar },
          { step: 3, label: 'Variants', icon: FaBox },
          { step: 4, label: 'Specs', icon: FaGear },
          { step: 5, label: 'Images', icon: FaImage }
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
              {step < highestStepReached && currentStep !== step ? <FaCheck size={18} /> : <Icon size={18} />}
            </div>
            <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        {/* Step 1: Base FaCircleInfo */}
        {currentStep === 1 && (
          <form className="space-y-6" onSubmit={(e) => { 
            e.preventDefault(); 
            if (validateStep1()) {
              setCurrentStep(2); 
              setHighestStepReached(Math.max(highestStepReached, 2)) 
            } else {
              toast.error('Please fix the highlighted required fields.')
            }
          }}>
            <h3 className="text-lg font-bold border-b border-border pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold mb-1 block">Product Name <span className="text-red-500">*</span></label>
                <input 
                  required 
                  value={baseInfo.name} 
                  onChange={e => {
                    const val = e.target.value
                    setBaseInfo({...baseInfo, name: val})
                    validateField('baseInfo_name', val)
                  }} 
                  placeholder="e.g. Tecno Spark 50"
                  className={`w-full rounded-xl border ${
                    formErrors['baseInfo_name'] 
                      ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-foreground focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                      : 'border-border bg-background focus:border-primary'
                  } px-4 py-2 text-sm outline-none transition-colors`} 
                />
                {formErrors['baseInfo_name'] && (
                  <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {formErrors['baseInfo_name']}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Brand <span className="text-red-500">*</span></label>
                <Select 
                  value={baseInfo.brandId || null} 
                  onValueChange={val => {
                    const selected = val || ''
                    setBaseInfo({...baseInfo, brandId: selected})
                    validateField('baseInfo_brandId', selected)
                  }}
                >
                  <SelectTrigger className={`w-full h-10 rounded-xl border ${
                    formErrors['baseInfo_brandId'] 
                      ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-foreground focus:ring-1 focus:ring-red-500' 
                      : 'border-border bg-background focus:ring-1 focus:ring-primary'
                  } px-4 py-2 text-sm outline-none transition-colors`}>
                    <SelectValue placeholder="Select Brand...">
                      {brands.find(b => b.id === baseInfo.brandId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors['baseInfo_brandId'] && (
                  <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {formErrors['baseInfo_brandId']}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Category <span className="text-red-500">*</span></label>
                <Select 
                  value={baseInfo.categoryId || null} 
                  onValueChange={val => {
                    const selected = val || ''
                    setBaseInfo({...baseInfo, categoryId: selected})
                    validateField('baseInfo_categoryId', selected)
                  }}
                >
                  <SelectTrigger className={`w-full h-10 rounded-xl border ${
                    formErrors['baseInfo_categoryId'] 
                      ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-foreground focus:ring-1 focus:ring-red-500' 
                      : 'border-border bg-background focus:ring-1 focus:ring-primary'
                  } px-4 py-2 text-sm outline-none transition-colors`}>
                    <SelectValue placeholder="Select Category...">
                      {categories.find(c => c.id === baseInfo.categoryId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors['baseInfo_categoryId'] && (
                  <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {formErrors['baseInfo_categoryId']}
                  </p>
                )}
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
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const success = handleAutoGenerateRamRomHighlight()
                    if (!success) toast.error('Add RAM & ROM in Specs or Variants first to auto-generate!')
                    else toast.success('RAM | ROM Highlight updated!')
                  }} 
                  className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  <FaMemory size={14} /> Auto RAM|ROM
                </button>
                <button onClick={() => { setEditingHighlightId(null); setHighlightForm({ iconName: 'Star', text: '' }); setShowHighlightForm(true); }} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold hover:bg-primary/20 transition-colors cursor-pointer"><FaPlus size={14}/> Add</button>
              </div>
            </h3>

            {showHighlightForm && (
              <form onSubmit={handleAddHighlight} className="bg-muted/50 p-4 rounded-xl border border-border flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold mb-1 block">Icon</label>
                  <Select value={highlightForm.iconName || null} onValueChange={val => setHighlightForm({...highlightForm, iconName: val || ''})}>
                    <SelectTrigger className="w-full h-[38px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Select Icon...">
                        {highlightForm.iconName}
                      </SelectValue>
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
                  <input required value={highlightForm.text} onChange={e => setHighlightForm({...highlightForm, text: e.target.value})} placeholder="e.g. 8GB RAM | 128GB ROM" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm">{editingHighlightId ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => { setShowHighlightForm(false); setEditingHighlightId(null); setHighlightForm({ iconName: 'Star', text: '' }); }} className="bg-muted text-foreground font-bold px-4 py-2 rounded-lg text-sm border border-border">Cancel</button>
              </form>
            )}

            <div className="space-y-2">
              {highlights.map(h => {
                const Icon = availableIcons[h.iconName as keyof typeof availableIcons] || FaCircleQuestion
                return (
                  <div key={h.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                    <div className="flex items-center gap-3 font-semibold"><Icon className="text-primary" size={20} /> {h.text}</div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingHighlightId(h.id); setHighlightForm({ iconName: h.iconName, text: h.text }); setShowHighlightForm(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg" title="Edit"><FaPen size={16} /></button>
                      <button onClick={() => handleDeleteHighlight(h.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg" title="Delete"><FaTrashCan size={16} /></button>
                    </div>
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
              <button onClick={handleOpenAddVariant} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-1 font-semibold cursor-pointer"><FaPlus size={16}/> Add Variant</button>
            </h3>

            {formErrors['variants'] && (
              <div className="p-3.5 bg-red-500/10 border-2 border-red-500/40 rounded-xl text-red-500 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                <span>⚠️</span> {formErrors['variants']}
              </div>
            )}

            {showVariantForm && (
              <form onSubmit={handleAddVariant} className="bg-muted/50 p-4 rounded-xl border border-border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Variant Name <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      value={variantForm.variantName} 
                      onChange={e => {
                        const val = e.target.value
                        const autoSku = generateUniqueSku(val, variantForm.color, editingVariantId)
                        setVariantForm(prev => ({
                          ...prev,
                          variantName: val,
                          sku: (!prev.sku || prev.sku === generateAutoSku(prev.variantName, prev.color)) ? autoSku : prev.sku
                        }))
                        validateField('variant_variantName', val)
                        if (!variantForm.sku || variantForm.sku === generateAutoSku(variantForm.variantName, variantForm.color)) {
                          validateField('variant_sku', autoSku)
                        }
                      }} 
                      placeholder="e.g. 8GB + 128GB"
                      className={`w-full rounded-lg border ${
                        formErrors['variant_variantName'] 
                          ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                          : 'border-border bg-background focus:border-primary'
                      } px-3 py-2 text-sm transition-colors`} 
                    />
                    {formErrors['variant_variantName'] && (
                      <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {formErrors['variant_variantName']}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Color <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      value={variantForm.color} 
                      onChange={e => {
                        const val = e.target.value
                        const autoSku = generateUniqueSku(variantForm.variantName, val, editingVariantId)
                        setVariantForm(prev => ({
                          ...prev,
                          color: val,
                          sku: (!prev.sku || prev.sku === generateAutoSku(prev.variantName, prev.color)) ? autoSku : prev.sku
                        }))
                        validateField('variant_color', val)
                        if (!variantForm.sku || variantForm.sku === generateAutoSku(variantForm.variantName, variantForm.color)) {
                          validateField('variant_sku', autoSku)
                        }
                      }} 
                      placeholder="e.g. Phantom Black"
                      className={`w-full rounded-lg border ${
                        formErrors['variant_color'] 
                          ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                          : 'border-border bg-background focus:border-primary'
                      } px-3 py-2 text-sm transition-colors`} 
                    />
                    {formErrors['variant_color'] && (
                      <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {formErrors['variant_color']}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold block">SKU <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => {
                          const uniqueSku = generateUniqueSku(variantForm.variantName, variantForm.color, editingVariantId)
                          setVariantForm(prev => ({ ...prev, sku: uniqueSku }))
                          validateField('variant_sku', uniqueSku)
                        }}
                        className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        ⚡ Auto Generate Unique SKU
                      </button>
                    </div>
                    <input 
                      required 
                      value={variantForm.sku} 
                      onChange={e => {
                        const val = e.target.value.toUpperCase()
                        setVariantForm({...variantForm, sku: val})
                        validateField('variant_sku', val)
                      }} 
                      placeholder="e.g. TEC-SPARK50-4-128-BLK"
                      className={`w-full rounded-lg border ${
                        formErrors['variant_sku'] 
                          ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                          : 'border-border bg-background focus:border-primary'
                      } px-3 py-2 text-sm font-mono uppercase transition-colors`} 
                    />
                    {formErrors['variant_sku'] && (
                      <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {formErrors['variant_sku']}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Stock Quantity <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="number" 
                      value={variantForm.stockQty} 
                      onChange={e => {
                        const val = e.target.value
                        const numVal = parseInt(val) || 0
                        setVariantForm({...variantForm, stockQty: numVal})
                        validateField('variant_stockQty', numVal)
                      }} 
                      className={`w-full rounded-lg border ${
                        formErrors['variant_stockQty'] 
                          ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                          : 'border-border bg-background focus:border-primary'
                      } px-3 py-2 text-sm transition-colors`} 
                    />
                    {formErrors['variant_stockQty'] && (
                      <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {formErrors['variant_stockQty']}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">MRP <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="number" 
                      value={variantForm.mrp} 
                      onChange={e => {
                        const val = e.target.value
                        setVariantForm({...variantForm, mrp: val})
                        validateField('variant_mrp', val)
                        if (variantForm.sellingPrice) {
                          validateField('variant_sellingPrice', variantForm.sellingPrice, { mrp: val })
                        }
                      }} 
                      className={`w-full rounded-lg border ${
                        formErrors['variant_mrp'] 
                          ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                          : 'border-border bg-background focus:border-primary'
                      } px-3 py-2 text-sm transition-colors`} 
                    />
                    {formErrors['variant_mrp'] && (
                      <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {formErrors['variant_mrp']}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Selling Price <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="number" 
                      value={variantForm.sellingPrice} 
                      onChange={e => {
                        const val = e.target.value
                        setVariantForm({...variantForm, sellingPrice: val})
                        validateField('variant_sellingPrice', val, { mrp: variantForm.mrp })
                      }} 
                      className={`w-full rounded-lg border ${
                        formErrors['variant_sellingPrice'] 
                          ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                          : 'border-border bg-background focus:border-primary'
                      } px-3 py-2 text-sm transition-colors`} 
                    />
                    {formErrors['variant_sellingPrice'] && (
                      <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {formErrors['variant_sellingPrice']}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowVariantForm(false); setEditingVariantId(null); setVariantForm({ variantName: '', sku: '', color: '', mrp: '', sellingPrice: '', gstPercent: 0, stockQty: 0, codAvailable: true }); setFormErrors(prev => { const copy = {...prev}; delete copy['variant_variantName']; delete copy['variant_color']; delete copy['variant_sku']; delete copy['variant_mrp']; delete copy['variant_sellingPrice']; delete copy['variant_stockQty']; return copy; }) }} className="bg-muted text-foreground font-bold px-4 py-2 rounded-lg text-sm border border-border">Cancel</button>
                  <button type="submit" className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm">{editingVariantId ? 'Update Variant' : 'Save Variant'}</button>
                </div>
              </form>
            )}

            {(() => {
              const grouped = variants.reduce((acc, v) => {
                const cleanName = v.variantName.replace(/\s*\([^)]*\)\s*$/, '').trim() || v.variantName.trim()
                if (!acc[cleanName]) acc[cleanName] = []
                acc[cleanName].push(v)
                return acc
              }, {} as Record<string, typeof variants>)

              const groupKeys = Object.keys(grouped)

              if (groupKeys.length === 0) {
                return <p className="text-sm text-muted-foreground text-center py-6">No variants added yet. Click "+ Add Variant" above to create one.</p>
              }

              return (
                <div className="space-y-6">
                  {groupKeys.map(vName => {
                    const colorRows = grouped[vName]
                    return (
                      <div key={vName} className="border border-border rounded-xl p-4 bg-card shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                            <span>{vName}</span>
                            <span className="text-xs font-normal text-muted-foreground">({colorRows.length} colour option{colorRows.length > 1 ? 's' : ''})</span>
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="border-b border-border text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                              <tr>
                                <th className="py-2 pr-4">Colour</th>
                                <th className="py-2 pr-4">SKU</th>
                                <th className="py-2 pr-4">Selling Price</th>
                                <th className="py-2 pr-4">MRP</th>
                                <th className="py-2 pr-4">Stock</th>
                                <th className="py-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {colorRows.map(v => (
                                <tr key={v.id}>
                                  <td className="py-2.5 pr-4 font-semibold text-foreground">{v.color || 'Default'}</td>
                                  <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground">{v.sku || '-'}</td>
                                  <td className="py-2.5 pr-4 font-bold text-foreground">₹{v.sellingPrice}</td>
                                  <td className="py-2.5 pr-4 text-xs text-muted-foreground line-through">₹{v.mrp}</td>
                                  <td className="py-2.5 pr-4">{v.stockQty}</td>
                                  <td className="py-2.5 text-right">
                                    <button onClick={() => handleEditVariantClick(v)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 p-2 rounded-lg mr-1" title="Edit Variant"><FaPen size={14} /></button>
                                    <button onClick={() => handleDeleteVariant(v.id)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 p-2 rounded-lg" title="Delete Variant"><FaTrashCan size={14} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

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
            
            {/* Import Specifications Card */}
            <div className="bg-gradient-to-r from-blue-500/10 via-primary/5 to-blue-500/10 border border-blue-500/30 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-3">
                <div>
                  <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                    <FaGear className="text-blue-600 dark:text-blue-400" size={18} />
                    Import Specifications
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paste raw text copied from Flipkart/Amazon, paste a URL, or upload screenshots to auto-fill technical specs.
                  </p>
                </div>

                {/* Options Switcher */}
                <div className="flex flex-wrap items-center gap-1 bg-background/80 dark:bg-muted p-1 rounded-xl border border-border shadow-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setImportMode('paste')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      importMode === 'paste'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <FaPaste size={13} />
                    <span>Paste / Import Specifications</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      importMode === 'url'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <FaGlobe size={13} />
                    <span>Import from Product URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('screenshots')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      importMode === 'screenshots'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <FaImage size={13} />
                    <span>Import from Screenshots</span>
                  </button>
                </div>
              </div>

              {/* Paste Specifications Mode */}
              {importMode === 'paste' && (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-sm text-foreground">Paste Complete Specifications</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Copy the complete Specifications section from Flipkart or Amazon and paste it directly below.
                    </p>
                  </div>

                  <div className="relative">
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste complete specifications here...&#10;&#10;Example:&#10;Battery & Power Features&#10;Battery Capacity&#10;3149 mAh&#10;Battery Type&#10;Lithium Ion&#10;Dual Battery&#10;No&#10;&#10;Dimensions&#10;Width&#10;74.7 mm (7.47 cm)&#10;Depth&#10;5.64 mm (0.56 cm)"
                      rows={8}
                      className="w-full rounded-xl border border-border bg-background p-4 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner resize-y leading-relaxed"
                    />
                    {pastedText && (
                      <button
                        type="button"
                        onClick={() => { setPastedText(''); setShowPastePreview(false); setParsedPreviewSpecs(null); }}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground text-xs font-bold bg-background/80 px-2 py-1 rounded-md border border-border shadow-xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground">
                      * Disallowed groups (e.g. Connectivity, Warranty, In The Box) will be automatically skipped.
                    </p>
                    <button
                      type="button"
                      disabled={!pastedText.trim()}
                      onClick={handleParsePastedSpecs}
                      className="w-full sm:w-auto bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                    >
                      <FaBolt size={14} />
                      <span>Parse Specifications</span>
                    </button>
                  </div>
                </div>
              )}

              {/* URL Import Mode */}
              {importMode === 'url' && (
                <form onSubmit={handleImportSpecsFromUrl} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="Paste Amazon / Flipkart / Product Page URL"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-8"
                    />
                    {importUrl && (
                      <button
                        type="button"
                        onClick={() => setImportUrl('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={importLoading || !importUrl.trim()}
                    className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-xs"
                  >
                    {importLoading ? (
                      <>
                        <FaSpinner className="animate-spin" size={15} />
                        <span>Fetching Specifications...</span>
                      </>
                    ) : (
                      <>
                        <FaDownload size={14} />
                        <span>Fetch Specifications</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Screenshot Import Mode */}
              {importMode === 'screenshots' && (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-sm text-foreground">Import Specifications from Screenshots</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload screenshots of the product's Specifications section. You can upload multiple screenshots.
                    </p>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files) handleAddScreenshots(e.dataTransfer.files);
                    }}
                    className="border-2 border-dashed border-primary/40 hover:border-primary bg-background/60 hover:bg-background/90 transition-all rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                      <FaImage size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Upload screenshots of the product's Specifications section.</p>
                      <p className="text-[11px] text-muted-foreground mt-1">You can upload multiple screenshots.</p>
                    </div>

                    <label className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all">
                      <FaPlus size={13} />
                      <span>+ Upload Screenshots</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleAddScreenshots(e.target.files)
                            e.target.value = ''
                          }
                        }}
                      />
                    </label>

                    <div className="pt-2 border-t border-border/40 w-full text-center">
                      <p className="text-[11px] font-bold text-muted-foreground tracking-wide">
                        Supported: <span className="text-foreground">JPG</span> • <span className="text-foreground">JPEG</span> • <span className="text-foreground">PNG</span> • <span className="text-foreground">WEBP</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">You can upload multiple images.</p>
                    </div>
                  </div>

                  {screenshotFiles.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Uploaded Screenshots ({screenshotFiles.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setScreenshotFiles([])}
                          className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {screenshotFiles.map((sf, idx) => (
                          <div key={idx} className="relative group border border-border rounded-xl overflow-hidden bg-background shadow-xs">
                            <img src={sf.previewUrl} alt={`Screenshot ${idx + 1}`} className="w-full h-24 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveScreenshot(idx)}
                              className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 shadow-md opacity-90 group-hover:opacity-100 hover:bg-rose-600 transition-all cursor-pointer"
                              title="Remove screenshot"
                            >
                              <FaTrashCan size={11} />
                            </button>
                            <div className="p-1 text-[10px] font-bold text-center text-muted-foreground truncate bg-muted/40">
                              {sf.file.name}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          disabled={screenshotImportLoading}
                          onClick={handleImportSpecsFromScreenshots}
                          className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                        >
                          {screenshotImportLoading ? (
                            <>
                              <FaSpinner className="animate-spin" size={15} />
                              <span>Extracting & Organizing Specifications...</span>
                            </>
                          ) : (
                            <>
                              <FaBolt size={14} />
                              <span>Extract & Fill Specifications ({screenshotFiles.length})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Specifications Found Editable Preview Card */}
            {showPastePreview && parsedPreviewSpecs && (
              <div className="bg-background border-2 border-primary/40 rounded-2xl p-5 shadow-lg space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <FaCheck className="text-emerald-500" size={18} />
                      Specifications Found
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review, edit, add, or remove specifications before applying them to your product.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPastePreview(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted text-muted-foreground transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyPastedSpecs}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <FaCheck size={13} />
                      <span>Apply Specifications</span>
                    </button>
                  </div>
                </div>

                {/* Parser Validation Status Banner */}
                {validationStatus && (
                  <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold ${
                    validationStatus.flaggedCount === 0
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {validationStatus.flaggedCount === 0 ? '✓' : '⚠️'}
                      </span>
                      <span>{validationStatus.message}</span>
                    </div>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {validationStatus.validCount} verified cleanly • {validationStatus.flaggedCount} flagged
                    </span>
                  </div>
                )}

                {/* Grouped Preview Items */}
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                  {ALLOWED_GROUPS.map(groupName => {
                    const groupSpecs = parsedPreviewSpecs
                      .map((s, originalIdx) => ({ s, originalIdx }))
                      .filter(item => item.s.specGroup === groupName)

                    if (groupSpecs.length === 0) return null

                    return (
                      <div key={groupName} className="border border-border/80 rounded-xl p-4 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <h5 className="font-bold text-sm text-primary flex items-center gap-2">
                            <span>{groupName}</span>
                            <span className="text-[11px] font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                              {groupSpecs.length} specs
                            </span>
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleAddPreviewSpecToGroup(groupName)}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <FaPlus size={10} />
                            <span>Add Row</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {groupSpecs.map(({ s, originalIdx }) => (
                            <div key={originalIdx} className={`flex flex-col sm:flex-row items-center gap-2 bg-background p-2.5 rounded-lg border ${
                              s.isFlagged ? 'border-amber-500/60 bg-amber-500/5' : 'border-border/60'
                            }`}>
                              <div className="w-full sm:w-1/3 relative">
                                <input
                                  type="text"
                                  value={s.specKey}
                                  onChange={(e) => handleUpdatePreviewSpec(originalIdx, 'specKey', e.target.value)}
                                  placeholder="Specification Name"
                                  className={`w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary ${
                                    s.isFlagged ? 'border-amber-500/50 text-amber-900 dark:text-amber-300' : 'border-border'
                                  }`}
                                />
                                {s.isFlagged && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500 text-[10px] font-bold" title={s.flagReason || 'Needs Review'}>
                                    ⚠️
                                  </span>
                                )}
                              </div>
                              <span className="hidden sm:inline text-muted-foreground font-bold text-xs">→</span>
                              <div className="w-full sm:flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={s.specValue}
                                  onChange={(e) => handleUpdatePreviewSpec(originalIdx, 'specValue', e.target.value)}
                                  placeholder="Specification Value"
                                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                                />
                                {s.sourceGroup && s.sourceGroup !== s.specGroup && (
                                  <span className="hidden md:inline text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shrink-0" title={`Source section: ${s.sourceGroup}`}>
                                    src: {s.sourceGroup}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeletePreviewSpec(originalIdx)}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                                title="Delete specification"
                              >
                                <FaTrashCan size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Unclassified / Needs Review Section */}
                  {unclassifiedPreview.length > 0 && (
                    <div className="border-2 border-amber-500/40 bg-amber-500/5 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <span>⚠️ Unclassified / Needs Review ({unclassifiedPreview.length})</span>
                      </h5>
                      <p className="text-[11px] text-muted-foreground">
                        The following lines could not be automatically paired. Assign them to a specification group or delete them.
                      </p>

                      <div className="space-y-2">
                        {unclassifiedPreview.map((item, uIdx) => (
                          <div key={uIdx} className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-background p-2.5 rounded-lg border border-amber-500/30">
                            <span className="text-xs font-mono text-foreground truncate max-w-md flex-1">
                              "{item.line}"
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <Select onValueChange={(val) => handleAssignUnclassifiedToGroup(uIdx, val, 'value')}>
                                <SelectTrigger className="h-7 text-[11px] w-40">
                                  <SelectValue placeholder="Assign as Value..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {ALLOWED_GROUPS.map(g => (
                                    <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <button
                                type="button"
                                onClick={() => setUnclassifiedPreview(prev => prev.filter((_, i) => i !== uIdx))}
                                className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <FaTrashCan size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    Total Specifications: <strong className="text-foreground">{parsedPreviewSpecs.length}</strong>
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowPastePreview(false)}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold border border-border hover:bg-muted text-muted-foreground transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyPastedSpecs}
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <FaCheck size={13} />
                      <span>Apply Specifications</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {(() => {
              const groups = Array.from(new Set(globalSpecs.map(s => s.specGroup || 'General')))
              return (
                <div className="border border-border rounded-xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-2">
                    <h4 className="font-bold text-primary">Common Specifications <span className="text-muted-foreground font-normal text-sm ml-2">(Applied to all variants)</span></h4>
                    <button 
                      onClick={handleLoadCategoryTemplate} 
                      disabled={loadingTemplate}
                      className="text-sm bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      <FaListCheck size={14} />
                      {loadingTemplate ? 'Loading...' : 'Load Category Template'}
                    </button>
                  </div>
                  
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
                              className="font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 text-sm flex-1"
                            />
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleAddSpecToGroup(group)} className="text-xs text-primary font-bold hover:underline whitespace-nowrap">+ Add Spec</button>
                              <button onClick={() => handleDeleteSpecGroup(group)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors" title="Delete Entire Group"><FaTrashCan size={16} /></button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {globalSpecs.map((s, i) => s.specGroup === group && (
                              <div key={i} className="flex gap-2 items-center">
                                <input placeholder="Key (e.g. Processor)" value={s.specKey} onChange={e => handleUpdateSpec(i, 'specKey', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
                                <input placeholder="Value (e.g. Snapdragon 8 Gen 3)" value={s.specValue} onChange={e => handleUpdateSpec(i, 'specValue', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
                                <button onClick={() => handleDeleteSpec(i)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg" title="Delete Spec"><FaTrashCan size={16} /></button>
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
            
            {/* Global/Common Images Upload */}
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl shadow-sm mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-primary flex items-center gap-2"><FaImage size={16} /> Global Images</h4>
                <p className="text-xs text-muted-foreground mt-1">Upload common images (like charger, box) here to automatically add them to ALL colors.</p>
              </div>
              
              <label 
                className={`shrink-0 h-10 px-4 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  dragActiveColor === 'global' 
                    ? 'border-primary bg-primary/20' 
                    : 'border-primary/40 hover:bg-primary/10'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragActiveColor !== 'global') setDragActiveColor('global');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragActiveColor === 'global') setDragActiveColor(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveColor(null);
                  const files = Array.from(e.dataTransfer.files || []);
                  if (files.length === 0) return;
                  try {
                    setLoading(true);
                    const urls: string[] = [];
                    for (const file of files) {
                      const res = await apiClient.uploadImage(file, 'products');
                      urls.push(res.data.data);
                    }
                    if (urls.length > 0) {
                      setVariants(prev => prev.map(varItem => ({
                        ...varItem,
                        images: [...(varItem.images || []), ...urls]
                      })));
                      toast.success(`Added ${urls.length} image(s) to all colors!`);
                    }
                  } catch (err) {
                    toast.error('Failed to upload some images');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <FaPlus size={16} className="text-primary" />
                <span className="text-xs font-bold text-primary">{dragActiveColor === 'global' ? 'Drop Images Here' : 'Upload to All Colors'}</span>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={loading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    try {
                      setLoading(true);
                      const urls: string[] = [];
                      for (const file of files) {
                        const res = await apiClient.uploadImage(file, 'products');
                        urls.push(res.data.data);
                      }
                      if (urls.length > 0) {
                        setVariants(prev => prev.map(varItem => ({
                          ...varItem,
                          images: [...(varItem.images || []), ...urls]
                        })));
                        toast.success(`Added ${urls.length} image(s) to all colors!`);
                      }
                    } catch (err) {
                      toast.error('Failed to upload some images');
                    } finally {
                      setLoading(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

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
                        <div 
                          key={imgIdx} 
                          draggable={dragEnabledImage?.color === color && dragEnabledImage?.index === imgIdx}
                          onDragStart={(e) => {
                            setDraggedImage({ color, index: imgIdx })
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedImage && draggedImage.color === color && draggedImage.index !== imgIdx) {
                              handleMoveImage(color, draggedImage.index, imgIdx)
                              setDraggedImage(null)
                              setDragEnabledImage(null)
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedImage(null)
                            setDragEnabledImage(null)
                          }}
                          className={`relative shrink-0 group transition-all ${draggedImage?.color === color && draggedImage?.index === imgIdx ? 'opacity-50 scale-95' : ''}`}
                        >
                          <img src={img} alt="Variant" className="w-24 h-24 object-cover rounded-lg border border-border" />
                          
                          {/* Drag Handle */}
                          <div 
                            className="absolute top-1 right-1/2 translate-x-1/2 bg-black/40 text-white rounded cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onMouseDown={() => setDragEnabledImage({ color, index: imgIdx })}
                            onMouseUp={() => setDragEnabledImage(null)}
                            onMouseLeave={() => setDragEnabledImage(null)}
                            title="Drag to reorder"
                          >
                            <FaCircleQuestion size={14} />
                          </div>

                          <button 
                            onClick={async () => {
                              try {
                                setLoading(true);
                                await apiClient.deleteImage(img);
                                const newImages = [...currentImages];
                                newImages.splice(imgIdx, 1);
                                setVariants(variants.map(varItem => 
                                  (varItem.color || 'Default Color') === color 
                                    ? { ...varItem, images: newImages } 
                                    : varItem
                                ));
                              } catch (err) {
                                toast.error('Failed to delete image');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTrashCan size={12} />
                          </button>
                          {imgIdx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm pointer-events-none">Primary</span>
                          )}
                          {imgIdx > 0 && (
                            <button 
                              onClick={(e) => { e.preventDefault(); handleMoveImage(color, imgIdx, imgIdx - 1); }}
                              className="absolute top-1/2 left-1 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaChevronLeft size={12} />
                            </button>
                          )}
                          {imgIdx < currentImages.length - 1 && (
                            <button 
                              onClick={(e) => { e.preventDefault(); handleMoveImage(color, imgIdx, imgIdx + 1); }}
                              className="absolute top-1/2 right-1 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaChevronRight size={12} />
                            </button>
                          )}
                          {imgIdx > 0 && (
                            <button 
                              onClick={(e) => { e.preventDefault(); handleMoveImage(color, imgIdx, 0); }}
                              className="absolute top-1 left-1 bg-blue-500 text-white rounded-sm px-1.5 py-0.5 text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              Set Primary
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <label 
                        className={`shrink-0 w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          dragActiveColor === color 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragActiveColor !== color) setDragActiveColor(color);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragActiveColor(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragActiveColor(null);
                          const file = e.dataTransfer.files?.[0];
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
                      >
                        <FaPlus size={24} className="text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground mt-1 text-center leading-tight">Add<br/>Image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          className="hidden" 
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            try {
                              setLoading(true);
                              const urls: string[] = [];
                              for (const file of files) {
                                const res = await apiClient.uploadImage(file, 'products');
                                urls.push(res.data.data);
                              }
                              if (urls.length > 0) {
                                setVariants(prev => prev.map(varItem => 
                                  (varItem.color || 'Default Color') === color 
                                    ? { ...varItem, images: [...(varItem.images || []), ...urls] } 
                                    : varItem
                                ));
                              }
                            } catch (err) {
                              toast.error('Failed to upload image(s)');
                            } finally {
                              setLoading(false);
                              e.target.value = '';
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
              <button 
                disabled={loading} 
                onClick={handlePublish} 
                className="bg-primary text-primary-foreground font-bold px-8 py-2 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCircleQuestion size={18} /> {loading ? 'Publishing...' : 'Publish Product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
