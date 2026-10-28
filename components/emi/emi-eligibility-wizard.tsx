'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMobileScreen,
  FaFileLines,
  FaShieldHalved,
  FaCheck,
  FaArrowRight,
  FaArrowLeft,
  FaUpload,
  FaCircleInfo,
  FaCircleCheck,
  FaTriangleExclamation,
  FaSpinner,
  FaRegCopy,
  FaFilePdf,
  FaImage,
  FaXmark,
} from 'react-icons/fa6'
import type { CatalogProduct } from '@/lib/productCatalog'

interface EmiEligibilityWizardProps {
  initialMobileProducts: CatalogProduct[]
}

interface PersonalDetails {
  fullName: string
  mobile: string
  email: string
}

interface SelectedPhone {
  productId: string
  productName: string
  brandName: string
  brandId?: string
  imageUrl: string
  price: number
  variantName?: string
}

interface UploadedFiles {
  aadhaarFront: File | null
  aadhaarBack: File | null
  panCard: File | null
}

const FINANCING_PARTNERS = [
  'Bajaj Finserv',
  'HDB Financial Services',
  'IDFC FIRST Bank',
  'Home Credit',
  'TVS Credit',
]

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

export function EmiEligibilityWizard({ initialMobileProducts }: EmiEligibilityWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Personal details
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    fullName: '',
    mobile: '',
    email: '',
  })
  const [errorsStep1, setErrorsStep1] = useState<Record<string, string>>({})

  // Step 2: Smartphone selection
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedPhone, setSelectedPhone] = useState<SelectedPhone | null>(null)
  const [step2Search, setStep2Search] = useState('')

  // Step 3: Documents & Consent
  const [enquiryMode, setEnquiryMode] = useState<'full' | 'enquiry_only'>('full')
  const [files, setFiles] = useState<UploadedFiles>({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
  })
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [consentChecked, setConsentChecked] = useState(false)
  const [acknowledgementChecked, setAcknowledgementChecked] = useState(false)

  // Step 4: Submission & Result
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [copiedRef, setCopiedRef] = useState(false)

  // Extract unique brands from actual mobile products
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, { name: string; count: number }>()
    initialMobileProducts.forEach(p => {
      const bName = (p.brandName || '').trim()
      if (!bName) return
      const bKey = bName.toLowerCase()
      if (!brandMap.has(bKey)) {
        brandMap.set(bKey, { name: bName, count: 1 })
      } else {
        brandMap.get(bKey)!.count++
      }
    })
    return Array.from(brandMap.values()).sort((a, b) => b.count - a.count)
  }, [initialMobileProducts])

  // Filter mobile products by selected brand and search term
  const brandFilteredPhones = useMemo(() => {
    if (!selectedBrand) return []
    const term = step2Search.trim().toLowerCase()
    return initialMobileProducts.filter(p => {
      const matchesBrand = (p.brandName || '').toLowerCase() === selectedBrand.toLowerCase()
      if (!matchesBrand) return false
      if (!term) return true
      return p.name.toLowerCase().includes(term) || (p.highlights || []).some(h => h.toLowerCase().includes(term))
    })
  }, [initialMobileProducts, selectedBrand, step2Search])

  // -------------------------------------------------------------
  // Step 1 Validation
  // -------------------------------------------------------------
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!personalDetails.fullName.trim() || personalDetails.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name as per official records.'
    }
    const cleanMobile = personalDetails.mobile.replace(/[^0-9]/g, '')
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errs.mobile = 'Please enter a valid 10-digit Indian mobile number.'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!personalDetails.email.trim() || !emailRegex.test(personalDetails.email.trim())) {
      errs.email = 'Please enter a valid email address.'
    }

    setErrorsStep1(errs)
    return Object.keys(errs).length === 0
  }

  // -------------------------------------------------------------
  // File Upload Helper
  // -------------------------------------------------------------
  const handleFileChange = (docKey: keyof UploadedFiles, file: File | null) => {
    if (!file) {
      setFiles(prev => ({ ...prev, [docKey]: null }))
      setFileErrors(prev => {
        const next = { ...prev }
        delete next[docKey]
        return next
      })
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileErrors(prev => ({ ...prev, [docKey]: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` }))
      return
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setFileErrors(prev => ({ ...prev, [docKey]: 'Allowed formats: JPG, PNG, WEBP or PDF.' }))
      return
    }

    setFileErrors(prev => {
      const next = { ...prev }
      delete next[docKey]
      return next
    })
    setFiles(prev => ({ ...prev, [docKey]: file }))
  }

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = async () => {
    if (!consentChecked || !acknowledgementChecked) {
      alert('Please accept the required consent and acknowledgement to proceed.')
      return
    }

    if (!selectedPhone) {
      alert('Please select a smartphone from Step 2.')
      setCurrentStep(2)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const formData = new FormData()
      formData.append('fullName', personalDetails.fullName.trim())
      formData.append('mobile', personalDetails.mobile.trim())
      formData.append('email', personalDetails.email.trim())
      formData.append('brandName', selectedPhone.brandName)
      formData.append('brandId', selectedPhone.brandId || '')
      formData.append('productName', selectedPhone.productName)
      formData.append('productId', selectedPhone.productId)
      formData.append('productImageUrl', selectedPhone.imageUrl || '')
      formData.append('variantName', selectedPhone.variantName || '')
      formData.append('price', String(selectedPhone.price || 0))
      formData.append('mode', enquiryMode)
      formData.append('consent', 'true')
      formData.append('financingPartner', FINANCING_PARTNERS.join(', '))
      formData.append(
        'consentText',
        'I voluntarily consent to EMIStore collecting and securely processing the personal information and documents I submit for the purpose of evaluating my EMI enquiry and, where applicable, sharing the necessary information with the identified financing partner for eligibility verification. I have read the Privacy Policy and understand how my information will be used and retained.'
      )

      if (enquiryMode === 'full') {
        if (files.aadhaarFront) formData.append('aadhaarFront', files.aadhaarFront)
        if (files.aadhaarBack) formData.append('aadhaarBack', files.aadhaarBack)
        if (files.panCard) formData.append('panCard', files.panCard)
      }

      const res = await fetch('/api/emi-eligibility/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Submission failed. Please try again.')
      }

      setReferenceNumber(data.referenceNumber || `EMI-${Date.now()}`)
      setCurrentStep(4)
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while submitting your enquiry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyReference = () => {
    if (referenceNumber) {
      navigator.clipboard.writeText(referenceNumber)
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2000)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:px-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Personal Details' },
            { num: 2, label: 'Select Smartphone' },
            { num: 3, label: 'Verification & Consent' },
            { num: 4, label: 'Status' },
          ].map(step => {
            const isCompleted = currentStep > step.num
            const isCurrent = currentStep === step.num
            return (
              <div key={step.num} className="flex-1 flex flex-col items-center relative">
                <div
                  className={`size-9 sm:size-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all z-10 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <FaCheck size={14} /> : step.num}
                </div>
                <span
                  className={`mt-2 text-[10px] sm:text-xs font-semibold text-center hidden sm:block ${
                    isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
        {/* Progress Bar Track */}
        <div className="relative mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl">
        {/* ========================================================= */}
        {/* STEP 1: PERSONAL DETAILS */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 1 of 3</span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">Personal Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your contact information for preliminary eligibility enquiry.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input
                    type="text"
                    placeholder="Enter your name as per Aadhaar / PAN"
                    value={personalDetails.fullName}
                    onChange={e => {
                      setPersonalDetails(prev => ({ ...prev, fullName: e.target.value }))
                      if (errorsStep1.fullName) setErrorsStep1(prev => ({ ...prev, fullName: '' }))
                    }}
                    className={`w-full rounded-xl border bg-background pl-10 pr-4 py-3 text-sm font-medium outline-none transition-colors ${
                      errorsStep1.fullName
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {errorsStep1.fullName && (
                  <p className="text-xs text-rose-500 mt-1.5 font-semibold">{errorsStep1.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={personalDetails.mobile}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setPersonalDetails(prev => ({ ...prev, mobile: val }))
                      if (errorsStep1.mobile) setErrorsStep1(prev => ({ ...prev, mobile: '' }))
                    }}
                    className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-sm font-medium outline-none transition-colors ${
                      errorsStep1.mobile
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {errorsStep1.mobile && (
                  <p className="text-xs text-rose-500 mt-1.5 font-semibold">{errorsStep1.mobile}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  We will use this number to update you on your enquiry status.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={personalDetails.email}
                    onChange={e => {
                      setPersonalDetails(prev => ({ ...prev, email: e.target.value }))
                      if (errorsStep1.email) setErrorsStep1(prev => ({ ...prev, email: '' }))
                    }}
                    className={`w-full rounded-xl border bg-background pl-10 pr-4 py-3 text-sm font-medium outline-none transition-colors ${
                      errorsStep1.email
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {errorsStep1.email && (
                  <p className="text-xs text-rose-500 mt-1.5 font-semibold">{errorsStep1.email}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 p-4 border border-border flex items-start gap-3">
              <FaShieldHalved className="text-primary shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Your privacy is protected.</strong> We collect only the information
                strictly necessary to process your EMI eligibility enquiry. Details are never sold or shared for spam.
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setCurrentStep(2)
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95"
              >
                <span>Continue to Select Smartphone</span>
                <FaArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SELECT SMARTPHONE */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 2 of 3</span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">Select a Smartphone</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose from actual smartphones available in our live catalogue.
              </p>
            </div>

            {/* Currently Selected Card (if any) */}
            {selectedPhone && (
              <div className="rounded-2xl border-2 border-primary bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedPhone.imageUrl || '/placeholder.png'}
                    alt={selectedPhone.productName}
                    className="size-16 object-contain rounded-xl bg-white p-1 border border-border shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Selected Device
                    </span>
                    <h4 className="text-base font-black text-foreground mt-1">{selectedPhone.productName}</h4>
                    <p className="text-xs text-muted-foreground">
                      Starting Price: <strong className="text-foreground">₹{selectedPhone.price.toLocaleString('en-IN')}</strong>
                      {selectedPhone.variantName ? ` · ${selectedPhone.variantName}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhone(null)}
                  className="text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-lg border border-primary/30"
                >
                  Change Selection
                </button>
              </div>
            )}

            {/* Brand Filter Buttons */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                1. Select Brand
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {availableBrands.map(b => {
                  const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase()
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(b.name)
                        setStep2Search('')
                      }}
                      className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30'
                          : 'border border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {b.name} ({b.count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Model Selection */}
            {selectedBrand ? (
              <div>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    2. Select Model ({brandFilteredPhones.length} available)
                  </label>
                  <input
                    type="search"
                    placeholder={`Search in ${selectedBrand}...`}
                    value={step2Search}
                    onChange={e => setStep2Search(e.target.value)}
                    className="text-xs rounded-lg border border-border bg-background px-3 py-1.5 outline-none focus:border-primary max-w-[200px]"
                  />
                </div>

                {brandFilteredPhones.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground">No models match your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1">
                    {brandFilteredPhones.map(phone => {
                      const isSelected = selectedPhone?.productId === phone.id
                      return (
                        <div
                          key={phone.id}
                          onClick={() => {
                            setSelectedPhone({
                              productId: phone.id,
                              productName: phone.name,
                              brandName: phone.brandName || selectedBrand,
                              brandId: phone.brandId,
                              imageUrl: phone.primaryImageUrl || '',
                              price: phone.startingPrice || phone.price || 0,
                            })
                          }}
                          className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                              : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30'
                          }`}
                        >
                          <img
                            src={phone.primaryImageUrl || '/placeholder.png'}
                            alt={phone.name}
                            className="size-14 object-contain rounded-xl bg-card p-1 border border-border shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate">{phone.name}</h4>
                            <p className="text-xs font-extrabold text-primary mt-0.5">
                              ₹{(phone.startingPrice || phone.price || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Est. EMI from ₹{Math.round((phone.startingPrice || phone.price || 20000) / 12).toLocaleString('en-IN')}/mo*
                            </p>
                          </div>
                          {isSelected && (
                            <div className="size-5 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
                              <FaCheck size={10} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <FaMobileScreen className="mx-auto text-muted-foreground mb-2" size={28} />
                <p className="text-sm font-bold text-foreground">Select a brand above to view models</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose from Samsung, Apple, OnePlus, Realme, Xiaomi and more.
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                <FaArrowLeft size={12} />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!selectedPhone}
                onClick={() => {
                  if (selectedPhone) setCurrentStep(3)
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <span>Continue to Verification</span>
                <FaArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: DOCUMENT SUBMISSION AND CONSENT */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 3 of 3</span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">Verification & Consent</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Provide documents for initial verification or choose enquiry-only mode.
              </p>
            </div>

            {/* Device Summary Pill */}
            {selectedPhone && (
              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <FaMobileScreen className="text-primary" size={16} />
                  <span>
                    Selected: <strong className="text-foreground">{selectedPhone.productName}</strong> (₹
                    {selectedPhone.price.toLocaleString('en-IN')})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="font-bold text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            )}

            {/* Identified Financing Partners Notice */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs leading-relaxed text-blue-900 dark:text-blue-200">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <FaShieldHalved size={14} />
                <span>Identified Financing Partners:</span>
              </div>
              <p>
                Your eligibility enquiry is submitted for evaluation with our recognized financing partners:{' '}
                <strong>{FINANCING_PARTNERS.join(', ')}</strong>.
              </p>
            </div>

            {/* Mode Selector Toggle */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Document Submission Preference</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setEnquiryMode('full')}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                    enquiryMode === 'full'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-background hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={enquiryMode === 'full'}
                    onChange={() => setEnquiryMode('full')}
                    className="mt-1"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Upload Documents Online</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Upload Aadhaar and PAN for faster digital processing.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setEnquiryMode('enquiry_only')}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                    enquiryMode === 'enquiry_only'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-background hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={enquiryMode === 'enquiry_only'}
                    onChange={() => setEnquiryMode('enquiry_only')}
                    className="mt-1"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Enquiry Only (No Uploads)</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Submit enquiry without documents. Representative will contact for offline verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Fields (only in full mode) */}
            {enquiryMode === 'full' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    Upload Identity & Address Proofs
                  </label>
                  <span className="text-[11px] text-muted-foreground">PDF, JPG, PNG up to 5MB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Aadhaar Front */}
                  <div className="rounded-2xl border border-border p-3.5 bg-background flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">Aadhaar (Front)</span>
                        {files.aadhaarFront && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Attached</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3">Front side showing photo & name.</p>
                    </div>

                    {files.aadhaarFront ? (
                      <div className="flex items-center justify-between rounded-xl bg-muted/60 p-2 text-xs">
                        <span className="truncate max-w-[120px] font-medium">{files.aadhaarFront.name}</span>
                        <button
                          type="button"
                          onClick={() => handleFileChange('aadhaarFront', null)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <FaXmark size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors">
                        <FaUpload className="text-muted-foreground mb-1" size={14} />
                        <span className="text-[11px] font-bold text-primary">Choose File</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          className="hidden"
                          onChange={e => handleFileChange('aadhaarFront', e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                    {fileErrors.aadhaarFront && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fileErrors.aadhaarFront}</p>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="rounded-2xl border border-border p-3.5 bg-background flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">Aadhaar (Back)</span>
                        {files.aadhaarBack && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Attached</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3">Back side showing full address.</p>
                    </div>

                    {files.aadhaarBack ? (
                      <div className="flex items-center justify-between rounded-xl bg-muted/60 p-2 text-xs">
                        <span className="truncate max-w-[120px] font-medium">{files.aadhaarBack.name}</span>
                        <button
                          type="button"
                          onClick={() => handleFileChange('aadhaarBack', null)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <FaXmark size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors">
                        <FaUpload className="text-muted-foreground mb-1" size={14} />
                        <span className="text-[11px] font-bold text-primary">Choose File</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          className="hidden"
                          onChange={e => handleFileChange('aadhaarBack', e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                    {fileErrors.aadhaarBack && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fileErrors.aadhaarBack}</p>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div className="rounded-2xl border border-border p-3.5 bg-background flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">PAN Card</span>
                        {files.panCard && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Attached</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3">Clear photo of original PAN.</p>
                    </div>

                    {files.panCard ? (
                      <div className="flex items-center justify-between rounded-xl bg-muted/60 p-2 text-xs">
                        <span className="truncate max-w-[120px] font-medium">{files.panCard.name}</span>
                        <button
                          type="button"
                          onClick={() => handleFileChange('panCard', null)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <FaXmark size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors">
                        <FaUpload className="text-muted-foreground mb-1" size={14} />
                        <span className="text-[11px] font-bold text-primary">Choose File</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          className="hidden"
                          onChange={e => handleFileChange('panCard', e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                    {fileErrors.panCard && (
                      <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fileErrors.panCard}</p>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  * All files are stored privately in encrypted server storage and never exposed publicly.
                </p>
              </div>
            )}

            {/* Consent & Acknowledgement Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer rounded-2xl bg-muted/30 p-4 border border-border hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  className="mt-1 size-4 rounded-md border-border text-primary focus:ring-primary"
                />
                <span className="text-xs text-foreground leading-relaxed">
                  I voluntarily consent to EMIStore collecting and securely processing the personal information and
                  documents I submit for the purpose of evaluating my EMI enquiry and, where applicable, sharing the
                  necessary information with the identified financing partner ({FINANCING_PARTNERS.slice(0, 3).join(', ')})
                  for eligibility verification. I have read the{' '}
                  <Link href="/privacy" target="_blank" className="text-primary font-bold hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  and understand how my information will be used and retained.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-2xl bg-muted/30 p-4 border border-border hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={acknowledgementChecked}
                  onChange={e => setAcknowledgementChecked(e.target.checked)}
                  className="mt-1 size-4 rounded-md border-border text-primary focus:ring-primary"
                />
                <span className="text-xs text-foreground leading-relaxed">
                  I acknowledge that submitting this form is only an eligibility enquiry and does not guarantee financing
                  or loan approval. Final approval and loan terms are determined solely by the financing partner.
                </span>
              </label>
            </div>

            {submitError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <FaTriangleExclamation size={14} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <FaArrowLeft size={12} />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!consentChecked || !acknowledgementChecked || isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner size={14} className="animate-spin" />
                    <span>Submitting Enquiry...</span>
                  </>
                ) : (
                  <>
                    <span>Submit EMI Enquiry</span>
                    <FaCheck size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: SUBMISSION CONFIRMATION & STATUS */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="py-6 text-center space-y-6">
            <div className="mx-auto size-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center border border-emerald-500/20">
              <FaCircleCheck size={40} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Enquiry Successfully Logged
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                Your EMI Enquiry is Under Review
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                Thank you, <strong>{personalDetails.fullName}</strong>. We have securely received your preliminary enquiry.
                Our financing desk will review your details with our financing partners.
              </p>
            </div>

            {/* Reference Badge Card */}
            <div className="mx-auto max-w-md rounded-2xl bg-muted/40 p-4 border border-border">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Enquiry Reference Number
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-primary">
                  {referenceNumber}
                </span>
                <button
                  type="button"
                  onClick={copyReference}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                  title="Copy Reference"
                >
                  <FaRegCopy size={16} />
                </button>
              </div>
              {copiedRef && <p className="text-[11px] font-bold text-emerald-600 mt-1">Copied to clipboard!</p>}
            </div>

            {/* Enquiry Summary Box */}
            {selectedPhone && (
              <div className="mx-auto max-w-md rounded-2xl border border-border bg-background p-4 text-left flex items-center gap-4">
                <img
                  src={selectedPhone.imageUrl || '/placeholder.png'}
                  alt={selectedPhone.productName}
                  className="size-16 object-contain rounded-xl bg-card p-1 border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase text-primary tracking-wider">{selectedPhone.brandName}</p>
                  <h4 className="text-sm font-black text-foreground truncate">{selectedPhone.productName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Price: <strong>₹{selectedPhone.price.toLocaleString('en-IN')}</strong> · Verification Status:{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Under Review</span>
                  </p>
                </div>
              </div>
            )}

            {/* Next Steps Information */}
            <div className="mx-auto max-w-md rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-left text-amber-900 dark:text-amber-200 leading-relaxed">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                <FaCircleInfo size={14} />
                <span>What happens next?</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Our EMI specialist will contact you on <strong>+91 {personalDetails.mobile}</strong> within 24-48 business hours.</li>
                <li>You will be guided through final eligibility terms and interest options.</li>
                <li>Final approval and credit limit are determined exclusively by the financing partner.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <span>Browse All Phones</span>
                <FaArrowRight size={12} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

