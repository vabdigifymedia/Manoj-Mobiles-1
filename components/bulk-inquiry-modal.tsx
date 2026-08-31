'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FaXmark, FaCheck, FaBuilding, FaPhone, FaEnvelope, FaBoxesPacking, FaMobile, FaSpinner, FaAngleRight, FaLayerGroup } from 'react-icons/fa6'
import { bulkInquiryService, BulkInquiryFormData, extractActualProductColors } from '@/lib/bulkInquiryService'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO } from '@/lib/types'

export interface BulkInquiryTarget {
  id?: string
  name?: string
  brandName?: string
  selectedColor?: string
  availableColors?: string[]
  isProductLocked?: boolean
}

interface BulkInquiryModalProps {
  isOpen: boolean
  onClose: () => void
  target?: BulkInquiryTarget | null
}

export function BulkInquiryModal({ isOpen, onClose, target }: BulkInquiryModalProps) {
  // Catalog Product List State for general selection mode
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
        
        // Pre-fill user selected color from Product Detail Page (if any valid color, else default to 'All Colours')
        const prefilledColor = (target.selectedColor && target.selectedColor.toLowerCase() !== 'default') 
          ? target.selectedColor 
          : 'All Colours'
        
        setSelectedColor(prefilledColor)
      } else {
        // Mode B: Opened from Home Page / General CTA (3-Step Selection Flow)
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

  // Dynamically extract actual available colours (No "Default" string ever, "All Colours" compulsory as first option)
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

  if (!isOpen) return null

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
      newErrors.name = 'Full Name is required'
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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      
      {/* Light Theme Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container — Strict Light Theme Card */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto animate-in zoom-in-95 duration-200 text-slate-900">
        
        {/* Header — Light Premium Blue Banner */}
        <div className="relative bg-gradient-to-r from-blue-50 via-sky-50 to-blue-100 p-5 sm:p-6 border-b border-blue-200/80">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <FaXmark size={18} />
          </button>
          
          <div className="flex items-center gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-xs">
              <FaBoxesPacking size={20} className="text-white" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Bulk Enquiry — Manoj Mobiles</h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">Get direct wholesale quotes & volume commercial pricing</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto bg-white text-slate-900">
          {isSubmitted ? (
            /* SUCCESS STATE */
            <div className="py-8 px-4 text-center flex flex-col items-center">
              <div className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-in zoom-in">
                <FaCheck size={32} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900">Thank You!</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600 max-w-md leading-relaxed">
                Your bulk inquiry has been received. Our team will contact you shortly with custom pricing & availability.
              </p>

              <div className="mt-6 w-full max-w-sm rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-left space-y-2 font-medium">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Mobile & Model:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[180px]">{selectedCompany} — {selectedProductName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Selected Colour:</span>
                  <span className="font-bold text-slate-900">{selectedColor}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Est. Quantity:</span>
                  <span className="font-bold text-slate-900">{formData.estimatedQuantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-bold text-slate-900">{formData.mobile} ({formData.name})</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-8 w-full max-w-xs rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-600 py-3 text-sm font-extrabold text-white transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
              
              {/* ===================================================
               * SELECTION FLOW (COMPANY -> MOBILE -> COLOUR CHIPS)
               * =================================================== */}
              {target?.isProductLocked ? (
                /* PRODUCT DETAIL PAGE MODE */
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white font-bold">
                      <FaMobile size={18} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">Selected Mobile</span>
                      <p className="text-base sm:text-lg font-black text-slate-900 truncate">
                        {target.brandName ? `${target.brandName} ` : ''}{target.name}
                      </p>
                    </div>
                  </div>

                  {/* Colour Selection Swatches / Chips */}
                  <div className="pt-3 border-t border-blue-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-900">
                        Select Colour <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-slate-600">
                        Selected: <strong className="text-slate-950">{selectedColor}</strong>
                      </span>
                    </div>

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
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-950 border-2 border-blue-600 shadow-xs scale-[1.02]'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-blue-50/50 hover:border-blue-300 font-medium'
                            }`}
                          >
                            {isSelected ? (
                              <FaCheck size={12} className="text-blue-600 shrink-0" />
                            ) : isAllColours ? (
                              <FaLayerGroup size={12} className="text-blue-600 shrink-0" />
                            ) : null}
                            <span className={isSelected ? 'text-blue-950 font-black' : 'text-slate-700'}>{colorName}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* HOME PAGE / GENERAL FLOW (3-Step Selection Flow) */
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    <FaAngleRight size={12} className="text-blue-600" />
                    <span>Select Requirements</span>
                  </div>

                  {/* Step 1 & Step 2: Company & Mobile Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Step 1: Select Mobile Company */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        1. Mobile Company <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => {
                          const comp = e.target.value
                          setSelectedCompany(comp)
                          // Reset dependent fields when company changes
                          setSelectedProductId('')
                          setSelectedProductName('')
                          setSelectedColor('All Colours')
                          if (errors.company) setErrors(prev => ({ ...prev, company: '' }))
                        }}
                        disabled={loadingProducts}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 ${errors.company ? 'border-rose-500' : 'border-slate-300'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {uniqueCompanies.map((comp) => (
                          <option key={comp} value={comp}>{comp}</option>
                        ))}
                      </select>
                      {errors.company && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.company}</p>}
                    </div>

                    {/* Step 2: Select Mobile */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        2. Select Mobile <span className="text-rose-500">*</span>
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
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 disabled:opacity-50 disabled:bg-slate-100 ${errors.product ? 'border-rose-500' : 'border-slate-300'}`}
                      >
                        {!selectedCompany ? (
                          <option value="">Select company first</option>
                        ) : (
                          <>
                            <option value="">-- Select Mobile --</option>
                            {productsForSelectedCompany.map((prod) => (
                              <option key={prod.id} value={prod.id}>{prod.name}</option>
                            ))}
                          </>
                        )}
                      </select>
                      {errors.product && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.product}</p>}
                    </div>

                  </div>

                  {/* Step 3: Select Colour Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-900">
                        3. Select Colour <span className="text-rose-500">*</span>
                      </label>
                      {selectedProductId && (
                        <span className="text-[11px] font-semibold text-slate-600">
                          Selected: <strong className="text-slate-950">{selectedColor}</strong>
                        </span>
                      )}
                    </div>

                    {!selectedProductId ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center text-xs font-medium text-slate-500">
                        Select mobile first to view available colours
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
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-950 border-2 border-blue-600 shadow-xs scale-[1.02]'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-blue-50/50 hover:border-blue-300 font-medium'
                              }`}
                            >
                              {isSelected ? (
                                <FaCheck size={12} className="text-blue-600 shrink-0" />
                              ) : isAllColours ? (
                                <FaLayerGroup size={12} className="text-blue-600 shrink-0" />
                              ) : null}
                              <span className={isSelected ? 'text-blue-950 font-black' : 'text-slate-700'}>{colorName}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {errors.color && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.color}</p>}
                  </div>

                </div>
              )}

              {/* 2-Column Grid for Customer & Company Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                
                {/* Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: '' })
                    }}
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 ${errors.name ? 'border-rose-500' : 'border-slate-300'}`}
                  />
                  {errors.name && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: '' })
                    }}
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 ${errors.email ? 'border-rose-500' : 'border-slate-300'}`}
                  />
                  {errors.email && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.email}</p>}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
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
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 ${errors.mobile ? 'border-rose-500' : 'border-slate-300'}`}
                  />
                  {errors.mobile && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.mobile}</p>}
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manoj Enterprises / Org"
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value })
                      if (errors.companyName) setErrors({ ...errors, companyName: '' })
                    }}
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 ${errors.companyName ? 'border-rose-500' : 'border-slate-300'}`}
                  />
                  {errors.companyName && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.companyName}</p>}
                </div>

                {/* GSTIN (Optional) */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
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
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-semibold uppercase text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 ${errors.gstin ? 'border-rose-500' : 'border-slate-300'}`}
                  />
                  {errors.gstin && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.gstin}</p>}
                </div>

                {/* Estimated Quantity */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    Estimated Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Minimum 1 unit"
                    value={formData.estimatedQuantity}
                    onChange={(e) => {
                      setFormData({ ...formData, estimatedQuantity: e.target.value })
                      if (errors.estimatedQuantity) setErrors({ ...errors, estimatedQuantity: '' })
                    }}
                    className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 ${errors.estimatedQuantity ? 'border-rose-500' : 'border-slate-300'}`}
                  />
                  {errors.estimatedQuantity && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.estimatedQuantity}</p>}
                </div>

              </div>

              {/* Fleet / Institutional Requirements Textarea */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  Fleet / Institutional Requirements <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention delivery location, color preferences, custom packaging, tax exemption, or special instructions..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 resize-none"
                />
              </div>

              {/* Form level error */}
              {errors.form && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 text-center">
                  {errors.form}
                </div>
              )}

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-600 py-3.5 px-6 text-sm font-extrabold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-[.99]"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner size={16} className="animate-spin text-white" />
                      <span className="text-white font-extrabold">Submitting...</span>
                    </>
                  ) : (
                    <span className="text-white font-extrabold">Submit Bulk Inquiry</span>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  )
}
