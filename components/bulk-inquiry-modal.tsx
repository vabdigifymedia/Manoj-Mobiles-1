'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  FaXmark, 
  FaCheck, 
  FaBuilding, 
  FaPhone, 
  FaEnvelope, 
  FaBoxesPacking, 
  FaMobile, 
  FaSpinner, 
  FaLayerGroup, 
  FaShieldHalved, 
  FaArrowRight,
  FaCircleCheck,
  FaUser
} from 'react-icons/fa6'
import { bulkInquiryService, BulkInquiryFormData, extractActualProductColors } from '@/lib/bulkInquiryService'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO } from '@/lib/types'

export interface BulkInquiryTarget {
  id?: string
  name?: string
  brandName?: string
  selectedColor?: string
  availableColors?: string[]
  imageUrl?: string
  isProductLocked?: boolean
}

interface BulkInquiryModalProps {
  isOpen: boolean
  onClose: () => void
  target?: BulkInquiryTarget | null
}

// Helper to map standard smartphone color names to visual swatch colors
const getSwatchBg = (colorName: string): string => {
  const n = colorName.toLowerCase().trim()
  if (n === 'all colours') return 'linear-gradient(135deg, #2563eb, #8b5cf6, #ec4899)'
  if (n.includes('black') || n.includes('midnight') || n.includes('obsidian') || n.includes('dark')) return '#0f172a'
  if (n.includes('white') || n.includes('starlight') || n.includes('polar') || n.includes('pearl')) return '#f8fafc'
  if (n.includes('silver') || n.includes('grey') || n.includes('gray') || n.includes('platinum')) return '#cbd5e1'
  if (n.includes('titanium')) return '#94a3b8'
  if (n.includes('gold') || n.includes('champagne') || n.includes('amber')) return '#f59e0b'
  if (n.includes('blue') || n.includes('navy') || n.includes('cyan') || n.includes('sky')) return '#3b82f6'
  if (n.includes('green') || n.includes('olive') || n.includes('mint') || n.includes('emerald')) return '#10b981'
  if (n.includes('purple') || n.includes('violet') || n.includes('lavender')) return '#8b5cf6'
  if (n.includes('red') || n.includes('crimson') || n.includes('ruby')) return '#ef4444'
  if (n.includes('pink') || n.includes('rose')) return '#f43f5e'
  if (n.includes('yellow')) return '#eab308'
  if (n.includes('orange') || n.includes('coral')) return '#f97316'
  return '#64748b'
}

export function BulkInquiryModal({ isOpen, onClose, target }: BulkInquiryModalProps) {
  // Catalog Product List State
  const [productList, setProductList] = useState<ProductListResponseDTO[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Selection States
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedProductName, setSelectedProductName] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('All Colours')

  // Customer Form Data State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    companyName: '',
    gstin: '',
    estimatedQuantity: '1',
    requirements: '',
  })

  // Validation & Submit UI States
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // 1. Reset & initialize modal when opened
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false)
      setErrors({})
      
      if (target?.isProductLocked && target.name) {
        // Mode A: Opened from Product Detail Page (Company & Product Locked)
        const company = target.brandName || 'Mobile'
        setSelectedCompany(company)
        setSelectedProductId(target.id || '')
        setSelectedProductName(target.name)
        
        const prefilledColor = (target.selectedColor && target.selectedColor.toLowerCase() !== 'default') 
          ? target.selectedColor 
          : 'All Colours'
        
        setSelectedColor(prefilledColor)
        fetchProductsForDropdown()
      } else {
        // Mode B: Opened from General CTA (3-Step Selection Flow)
        setSelectedCompany('')
        setSelectedProductId('')
        setSelectedProductName('')
        setSelectedColor('All Colours')
        fetchProductsForDropdown()
      }

      setFormData({
        name: '',
        email: '',
        mobile: '',
        companyName: '',
        gstin: '',
        estimatedQuantity: '1',
        requirements: '',
      })

      // Lock background scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, target])

  // ESC key listener for closing modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const fetchProductsForDropdown = async () => {
    setLoadingProducts(true)
    try {
      const res = await apiClient.getProducts(0, 100)
      if (res.data?.data?.content) {
        setProductList(res.data.data.content)
      }
    } catch (err) {
      console.error('Error fetching products for bulk inquiry:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  // Derived unique companies list from catalog
  const uniqueCompanies = useMemo(() => {
    const brands = productList
      .map(p => p.brandName?.trim())
      .filter((b): b is string => Boolean(b && b.length > 0))
    return Array.from(new Set(brands)).sort()
  }, [productList])

  // Filtered products for currently selected company
  const productsForSelectedCompany = useMemo(() => {
    if (!selectedCompany) return []
    return productList.filter(
      p => (p.brandName || '').trim().toLowerCase() === selectedCompany.trim().toLowerCase()
    )
  }, [productList, selectedCompany])

  // Dynamically extract actual available colours
  const availableColorOptions = useMemo(() => {
    if (target?.isProductLocked) {
      if (target.availableColors && target.availableColors.length > 0) {
        const cleaned = target.availableColors.filter(c => c && c.trim().toLowerCase() !== 'default')
        const unique = Array.from(new Set(cleaned))
        return ['All Colours', ...unique]
      }
    }

    if (!selectedProductId) return ['All Colours']

    const foundProduct = productList.find(p => p.id === selectedProductId)
    return extractActualProductColors(foundProduct)
  }, [target, selectedProductId, productList])

  // Resolve active product data for real preview
  const activeProduct = useMemo(() => {
    if (target?.isProductLocked && target.name) {
      const foundInList = productList.find(p => p.id === target.id)
      return {
        id: target.id || '',
        name: target.name,
        brandName: target.brandName || selectedCompany,
        imageUrl: target.imageUrl || foundInList?.primaryImageUrl || '',
      }
    }
    if (selectedProductId) {
      const found = productsForSelectedCompany.find(p => p.id === selectedProductId)
      if (found) {
        return {
          id: found.id,
          name: found.name,
          brandName: found.brandName || selectedCompany,
          imageUrl: found.primaryImageUrl || '',
        }
      }
    }
    return null
  }, [target, selectedProductId, productsForSelectedCompany, productList, selectedCompany])

  if (!isOpen) return null

  // Progress Completion Checks
  const isStep1Done = Boolean(selectedCompany && selectedProductName && selectedColor)
  const isStep2Done = Boolean(
    formData.name.trim() && 
    formData.email.trim() && 
    formData.mobile.trim().length === 10 && 
    formData.companyName.trim()
  )
  const isStep3Done = Boolean((parseInt(formData.estimatedQuantity, 10) || 0) >= 1)

  // Validation logic
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedCompany) {
      newErrors.company = 'Please select a mobile company'
    }

    if (!selectedProductName) {
      newErrors.product = 'Please select a mobile product'
    }

    if (!selectedColor) {
      newErrors.color = 'Please select a colour'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Your name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile.trim().replace(/\D/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number'
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company / Business name is required'
    }

    if (formData.gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstin.trim())) {
      newErrors.gstin = 'Format should be 22AAAAA0000A1Z5 (15 characters)'
    }

    const qty = parseInt(formData.estimatedQuantity, 10)
    if (isNaN(qty) || qty < 1) {
      newErrors.estimatedQuantity = 'Quantity must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const payload: BulkInquiryFormData = {
        mobileCompany: selectedCompany,
        productName: selectedProductName,
        selectedColor: selectedColor || 'All Colours',
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        companyName: formData.companyName.trim(),
        gstin: formData.gstin.trim() || undefined,
        estimatedQuantity: parseInt(formData.estimatedQuantity, 10),
        requirements: formData.requirements.trim() || undefined,
        productId: selectedProductId || undefined,
      }

      await bulkInquiryService.submitBulkInquiry(payload)
      setIsSubmitted(true)
    } catch (err) {
      console.error('Submission error:', err)
      setErrors({ form: 'Failed to submit inquiry. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const adjustQuantity = (amount: number) => {
    const current = parseInt(formData.estimatedQuantity, 10) || 1
    const next = Math.max(1, current + amount)
    setFormData(prev => ({ ...prev, estimatedQuantity: next.toString() }))
    if (errors.estimatedQuantity) setErrors(prev => ({ ...prev, estimatedQuantity: '' }))
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto animate-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[94vh]">
        
        {/* ===================================================
         * 1. POPUP HEADER (Modern Blue Gradient Banner)
         * =================================================== */}
        <div className="shrink-0 relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 sm:p-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="size-11 sm:size-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-inner shrink-0">
              <FaBoxesPacking size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Bulk Enquiry</h2>
                <span className="hidden sm:inline-flex items-center text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/25">
                  Wholesale & Corporate
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">
                Get wholesale pricing tailored to your requirement
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center justify-center transition-colors focus:outline-none cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <FaXmark size={18} />
          </button>
        </div>

        {/* ===================================================
         * 2. PROGRESS / SECTION INDICATOR
         * =================================================== */}
        <div className="shrink-0 bg-slate-50 border-b border-slate-200/90 px-4 sm:px-8 py-3">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
            
            {/* Step 1 Indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`size-6 sm:size-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                isStep1Done ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-blue-600 text-white'
              }`}>
                {isStep1Done ? <FaCheck size={11} /> : '1'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">1. Product</p>
                <p className="hidden sm:block text-[10px] text-slate-500 truncate">Company, mobile & colour</p>
              </div>
            </div>

            {/* Step 2 Indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`size-6 sm:size-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                isStep2Done ? 'bg-emerald-600 text-white shadow-2xs' : isStep1Done ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {isStep2Done ? <FaCheck size={11} /> : '2'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">2. Your Details</p>
                <p className="hidden sm:block text-[10px] text-slate-500 truncate">Contact & company</p>
              </div>
            </div>

            {/* Step 3 Indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`size-6 sm:size-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                isStep3Done ? 'bg-emerald-600 text-white shadow-2xs' : isStep2Done ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {isStep3Done ? <FaCheck size={11} /> : '3'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">3. Additional</p>
                <p className="hidden sm:block text-[10px] text-slate-500 truncate">Quantity & requirements</p>
              </div>
            </div>

          </div>
        </div>

        {/* ===================================================
         * 3. SCROLLABLE FORM BODY / SUCCESS STATE
         * =================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 bg-[#F8FAFC]">
          
          {isSubmitted ? (
            /* SUCCESS CELEBRATION STATE */
            <div className="py-8 px-4 text-center flex flex-col items-center">
              <div className="grid size-16 sm:size-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-in zoom-in duration-300">
                <FaCircleCheck size={36} />
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Thank You!</h3>
              <p className="mt-2 text-sm sm:text-base font-semibold text-slate-600 max-w-md leading-relaxed">
                Your bulk inquiry has been submitted. Our institutional team will contact you shortly with direct wholesale pricing & delivery timelines.
              </p>

              <div className="mt-6 w-full max-w-md rounded-2xl bg-white p-5 border border-slate-200/90 text-xs sm:text-sm text-left space-y-2.5 font-medium shadow-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Selected Mobile:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{selectedCompany} — {selectedProductName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Selected Colour:</span>
                  <span className="font-bold text-slate-900">{selectedColor}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Estimated Quantity:</span>
                  <span className="font-bold text-slate-900">{formData.estimatedQuantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Person:</span>
                  <span className="font-bold text-slate-900">{formData.name} ({formData.mobile})</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-8 w-full max-w-xs rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              
              {/* ===================================================
               * SECTION 1: PRODUCT REQUIREMENT
               * =================================================== */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="size-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">Product Requirement</h3>
                      <p className="text-xs text-slate-500 font-medium">Select the product details you&apos;re interested in</p>
                    </div>
                  </div>
                  {isStep1Done && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <FaCheck size={10} /> Completed
                    </span>
                  )}
                </div>

                {target?.isProductLocked ? (
                  /* Mode A: Product Locked from Detail Page */
                  <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <FaMobile size={18} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Pre-Selected Smartphone</span>
                        <p className="text-sm sm:text-base font-black text-slate-900 truncate">
                          {target.brandName ? `${target.brandName} ` : ''}{target.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mode B: Dropdowns for Company & Mobile */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Mobile Company * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Mobile Company <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => {
                          const comp = e.target.value
                          setSelectedCompany(comp)
                          setSelectedProductId('')
                          setSelectedProductName('')
                          setSelectedColor('All Colours')
                          if (errors.company) setErrors(prev => ({ ...prev, company: '' }))
                        }}
                        disabled={loadingProducts}
                        className={`w-full rounded-xl border bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 ${
                          errors.company ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      >
                        <option value="">-- Select Mobile Company --</option>
                        {uniqueCompanies.map((comp) => (
                          <option key={comp} value={comp}>{comp}</option>
                        ))}
                      </select>
                      {errors.company && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.company}</p>}
                    </div>

                    {/* Select Mobile * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Select Mobile <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          const prodId = e.target.value
                          const matched = productsForSelectedCompany.find(p => p.id === prodId)
                          setSelectedProductId(prodId)
                          setSelectedProductName(matched ? matched.name : '')
                          setSelectedColor('All Colours')
                          if (errors.product) setErrors(prev => ({ ...prev, product: '' }))
                        }}
                        disabled={!selectedCompany || loadingProducts}
                        className={`w-full rounded-xl border bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 disabled:opacity-50 disabled:bg-slate-100 ${
                          errors.product ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      >
                        {!selectedCompany ? (
                          <option value="">Select company first</option>
                        ) : (
                          <>
                            <option value="">-- Select Mobile Model --</option>
                            {productsForSelectedCompany.map((prod) => (
                              <option key={prod.id} value={prod.id}>{prod.name}</option>
                            ))}
                          </>
                        )}
                      </select>
                      {errors.product && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.product}</p>}
                    </div>

                  </div>
                )}

                {/* Select Colour * */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-900">
                      Select Colour <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-semibold text-slate-600">
                      Selected: <strong className="text-blue-700 font-bold">{selectedColor || 'All Colours'}</strong>
                    </span>
                  </div>

                  {!selectedProductId && !target?.isProductLocked ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs font-medium text-slate-500">
                      Select mobile company & model to view available color options
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableColorOptions.map((colorName) => {
                        const isSelected = selectedColor === colorName
                        const isAllColours = colorName === 'All Colours'

                        return (
                          <button
                            key={colorName}
                            type="button"
                            onClick={() => {
                              setSelectedColor(colorName)
                              if (errors.color) setErrors(prev => ({ ...prev, color: '' }))
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-950 border-2 border-blue-600 shadow-2xs ring-2 ring-blue-500/20 scale-[1.01]'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {isAllColours ? (
                              <FaLayerGroup size={12} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                            ) : (
                              <span 
                                className="size-3 rounded-full border border-black/15 shrink-0" 
                                style={{ background: getSwatchBg(colorName) }} 
                              />
                            )}
                            <span>{colorName}</span>
                            {isSelected && <FaCheck size={11} className="text-blue-600 ml-0.5" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {errors.color && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.color}</p>}
                </div>

                {/* Dynamic Product Preview (Real Data Only) */}
                {activeProduct && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-white border border-blue-200/80 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
                    <div className="size-16 sm:size-20 rounded-xl bg-white p-1.5 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                      {activeProduct.imageUrl ? (
                        <img 
                          src={activeProduct.imageUrl} 
                          alt={activeProduct.name} 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <FaMobile className="text-blue-500" size={24} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Bulk quantity pricing available
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {activeProduct.name}
                      </h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1.5">
                        <span>{activeProduct.brandName}</span>
                        <span>•</span>
                        <span className="text-blue-700 font-bold">{selectedColor || 'All Colours'}</span>
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* ===================================================
               * SECTION 2: YOUR DETAILS
               * =================================================== */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="size-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">Your Details</h3>
                      <p className="text-xs text-slate-500 font-medium">Please provide your contact and company information</p>
                    </div>
                  </div>
                  {isStep2Done && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <FaCheck size={10} /> Completed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  
                  {/* Your Name * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaUser size={13} />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          if (errors.name) setErrors({ ...errors, name: '' })
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 ${
                          errors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.name}</p>}
                  </div>

                  {/* Email Address * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaEnvelope size={13} />
                      </div>
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          if (errors.email) setErrors({ ...errors, email: '' })
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 ${
                          errors.email ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.email}</p>}
                  </div>

                  {/* Mobile Number * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaPhone size={13} />
                      </div>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setFormData({ ...formData, mobile: val })
                          if (errors.mobile) setErrors({ ...errors, mobile: '' })
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 ${
                          errors.mobile ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.mobile && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.mobile}</p>}
                  </div>

                  {/* Company Name * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaBuilding size={13} />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Manoj Enterprises / Org"
                        value={formData.companyName}
                        onChange={(e) => {
                          setFormData({ ...formData, companyName: e.target.value })
                          if (errors.companyName) setErrors({ ...errors, companyName: '' })
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 ${
                          errors.companyName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.companyName && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.companyName}</p>}
                  </div>

                  {/* GSTIN (Optional) */}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      GSTIN <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      maxLength={15}
                      value={formData.gstin}
                      onChange={(e) => {
                        setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
                        if (errors.gstin) setErrors({ ...errors, gstin: '' })
                      }}
                      className={`w-full rounded-xl border bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold uppercase text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 ${
                        errors.gstin ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                    {errors.gstin && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.gstin}</p>}
                  </div>

                </div>
              </div>

              {/* ===================================================
               * SECTION 3: ADDITIONAL INFORMATION
               * =================================================== */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="size-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                      3
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">Additional Information</h3>
                      <p className="text-xs text-slate-500 font-medium">Help us understand your requirements better</p>
                    </div>
                  </div>
                  {isStep3Done && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <FaCheck size={10} /> Set
                    </span>
                  )}
                </div>

                {/* Estimated Quantity * Stepper */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-2">
                    Estimated Quantity <span className="text-rose-500">*</span>
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50/80 p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => adjustQuantity(-1)}
                        className="size-9 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-2xs disabled:opacity-40"
                        disabled={(parseInt(formData.estimatedQuantity, 10) || 1) <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={formData.estimatedQuantity}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setFormData({ ...formData, estimatedQuantity: val })
                          if (errors.estimatedQuantity) setErrors({ ...errors, estimatedQuantity: '' })
                        }}
                        className="w-20 text-center font-black text-sm sm:text-base bg-transparent focus:outline-none text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => adjustQuantity(1)}
                        className="size-9 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-2xs"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Preset Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[5, 10, 25, 50, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, estimatedQuantity: preset.toString() }))
                            if (errors.estimatedQuantity) setErrors(prev => ({ ...prev, estimatedQuantity: '' }))
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            formData.estimatedQuantity === preset.toString()
                              ? 'bg-blue-600 text-white shadow-2xs scale-105'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {preset} units
                        </button>
                      ))}
                    </div>
                  </div>
                  {errors.estimatedQuantity && <p className="mt-1.5 text-[11px] font-semibold text-rose-500">{errors.estimatedQuantity}</p>}
                </div>

                {/* Fleet / Institutional Requirements (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Fleet / Institutional Requirements <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mention delivery location, color preferences, custom packaging, tax exemption, or special requirements..."
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 resize-none"
                  />
                </div>

              </div>

              {/* Form Level Error Alert */}
              {errors.form && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 text-center animate-in fade-in">
                  {errors.form}
                </div>
              )}

              {/* ===================================================
               * 4. FORM FOOTER / CTA
               * =================================================== */}
              <div className="pt-2">
                <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  
                  {/* Security / Privacy Trust Guarantee */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <FaShieldHalved size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Your information is safe with us.</p>
                      <p className="text-[11px] text-slate-500">Your details are used only to process your enquiry.</p>
                    </div>
                  </div>

                  {/* Primary CTA Submit Button */}
                  <div className="flex flex-col sm:items-end gap-1.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base py-3.5 px-8 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner size={16} className="animate-spin text-white" />
                          <span>Processing Quote...</span>
                        </>
                      ) : (
                        <>
                          <span>Get Wholesale Quote</span>
                          <FaArrowRight size={13} />
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center sm:text-right font-medium">
                      We&apos;ll get back to you with the best available wholesale pricing.
                    </p>
                  </div>

                </div>
              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  )
}
