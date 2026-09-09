'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaMicrochip, FaCircleCheck, FaArrowLeft, FaBolt, FaHardDrive, FaBatteryFull, FaCamera, FaShieldHalved, FaWifi, FaMobileScreen, FaComment, FaLocationDot, FaGear, FaBluetooth, FaMemory, FaTruckFast, FaStar, FaCartShopping, FaBoxesPacking, FaChevronDown, FaChevronUp } from 'react-icons/fa6'
import { formatINR } from '@/lib/apiClient'
import { useStore } from '@/components/store-provider'
import { useBulkInquiry } from '@/components/bulk-inquiry-provider'
import { useAuth } from '@/lib/auth-context'
import type { ProductResponseDTO, ProductVariantResponseDTO, ProductSpecificationResponseDTO } from '@/lib/types'
import { ProductReviews } from '@/components/product-reviews'
import { apiClient } from '@/lib/apiClient'
import { ProductFeatureImages } from './product-detail-feature-images'
import { ProductSuggestedPhones } from './product-detail-suggested-phones'
import { motion, AnimatePresence } from 'framer-motion'
import { parseRamRomFromText } from '@/lib/utils'

export function ProductDetailClient({ product: initialProduct }: { product: ProductResponseDTO }) {
  const [product] = useState<ProductResponseDTO>(initialProduct)
  const { openBulkInquiry } = useBulkInquiry()

  // Helper to extract clean Variant Name (stripping color suffix if appended in parenthesis)
  const getCleanVariantName = (v: ProductVariantResponseDTO) => {
    if (!v || !v.variantName) return ''
    if (v.color && v.variantName.toLowerCase().includes(`(${v.color.toLowerCase()})`)) {
      return v.variantName.replace(new RegExp(`\\s*\\(${v.color}\\)`, 'gi'), '').trim()
    }
    return v.variantName.replace(/\s*\([^)]*\)\s*$/, '').trim() || v.variantName.trim()
  }

  // 1. Get all unique clean variant names
  const uniqueVariantNames = useMemo(() => {
    return Array.from(
      new Set(product?.variants?.map(v => getCleanVariantName(v)).filter(Boolean) || [])
    )
  }, [product])

  // Selected Variant Name state
  const [selectedVariantName, setSelectedVariantName] = useState<string>('')

  // Selected Color state
  const [selectedColor, setSelectedColor] = useState<string>('')

  // Initialize selectedVariantName when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      if (!selectedVariantName || !uniqueVariantNames.includes(selectedVariantName)) {
        const initialName = getCleanVariantName(product.variants[0])
        setSelectedVariantName(initialName)
      }
    }
  }, [product, uniqueVariantNames])

  // Get all variant entries belonging to the currently selected Variant Name
  const variantsForSelectedName = useMemo(() => {
    return product?.variants?.filter(
      v => getCleanVariantName(v) === selectedVariantName
    ) || []
  }, [product, selectedVariantName])

  // Available colours specifically for the selected Variant Name
  const availableColorsForSelectedName = useMemo(() => {
    return Array.from(
      new Set(variantsForSelectedName.map(v => v.color).filter((c): c is string => Boolean(c && c.trim())))
    )
  }, [variantsForSelectedName])

  // Synchronize selectedColor when selectedVariantName changes
  useEffect(() => {
    if (availableColorsForSelectedName.length > 0) {
      if (!selectedColor || !availableColorsForSelectedName.includes(selectedColor)) {
        setSelectedColor(availableColorsForSelectedName[0])
      }
    } else {
      setSelectedColor('')
    }
  }, [selectedVariantName, availableColorsForSelectedName])

  // Active Variant row corresponding to the selected Variant Name + selected Color
  const selectedVariant = useMemo(() => {
    if (variantsForSelectedName.length === 0) return product?.variants?.[0] || null
    if (selectedColor) {
      const match = variantsForSelectedName.find(v => (v.color || '').trim() === selectedColor.trim())
      if (match) return match
    }
    return variantsForSelectedName[0]
  }, [variantsForSelectedName, selectedColor, product])

  const primaryImage = selectedVariant?.images?.find(img => img.isPrimary)?.url || selectedVariant?.imageUrls?.[0] || '/placeholder.png'
  const allImages = selectedVariant?.images?.map(img => img.url) || selectedVariant?.imageUrls || []

  // Specifications collapsible state (See More / Show Less)
  const [specsExpanded, setSpecsExpanded] = useState(false)

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [mobileImageIndex, setMobileImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const mobileSliderRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchMovedRef = useRef(false)
  const isHorizontalSwipeRef = useRef(false)

  // Navigate to a specific image with smooth transition
  const goToImage = useCallback((index: number) => {
    if (isTransitioning) return
    const clampedIndex = Math.max(0, Math.min(index, allImages.length - 1))
    setIsTransitioning(true)
    setMobileImageIndex(clampedIndex)
    setSelectedImage(allImages[clampedIndex] || primaryImage)
    setTimeout(() => setIsTransitioning(false), 350)
  }, [allImages, primaryImage, isTransitioning])

  // Handle touch start - record initial position
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    touchMovedRef.current = false
    isHorizontalSwipeRef.current = false
  }

  // Handle touch move - determine swipe direction and prevent unwanted scrolling
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = touchStartXRef.current - currentX
    const diffY = touchStartYRef.current - currentY

    // Determine if this is a horizontal swipe (only once)
    if (!touchMovedRef.current && Math.abs(diffX) > 10) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontalSwipeRef.current = true
      }
      touchMovedRef.current = true
    }

    // If horizontal swipe detected, prevent default to stop page scroll
    if (isHorizontalSwipeRef.current) {
      e.preventDefault()
    }
  }

  // Handle touch end - determine if we should change image
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX
    const threshold = 40 // Minimum swipe distance to trigger image change

    // Only change image if horizontal swipe exceeded threshold
    if (isHorizontalSwipeRef.current && Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - go to next image
        goToImage(mobileImageIndex + 1)
      } else {
        // Swipe right - go to previous image
        goToImage(mobileImageIndex - 1)
      }
    }

    touchStartXRef.current = null
    touchStartYRef.current = null
    touchMovedRef.current = false
    isHorizontalSwipeRef.current = false
  }

  useEffect(() => {
    if (selectedVariant) {
      const primary = selectedVariant.images?.find(img => img.isPrimary)?.url || selectedVariant.imageUrls?.[0]
      setSelectedImage(primary || '/placeholder.png')
      setMobileImageIndex(0)
    }
  }, [selectedVariant])

  // Collapse specs back to compact state when switching variant/color
  useEffect(() => {
    setSpecsExpanded(false)
  }, [selectedVariant])

  const [pincode, setPincode] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { addToCart, toggleCompare, isInCompare, cart } = useStore()
  const { isAuthenticated } = useAuth()
  const isCompared = isInCompare(selectedVariant.id)
  const router = useRouter()

  const isVariantInCart = selectedVariant ? cart?.items?.some(i => i.variantId === selectedVariant.id || i.id === selectedVariant.id) : false

  const handleAddToCart = () => {
    if (isVariantInCart) {
      router.push('/cart')
      return
    }
    if (selectedVariant) {
      const primaryImg = selectedVariant.images?.find(img => img.isPrimary)?.url || selectedVariant.imageUrls?.[0] || '/placeholder.png'
      addToCart(selectedVariant.id, 1, {
        productName: product.name,
        variantName: selectedVariant.variantName || selectedColor.trim() || 'Default',
        sku: selectedVariant.sku,
        primaryImage: primaryImg,
        currentPrice: selectedVariant.sellingPrice,
        priceAtAdd: selectedVariant.sellingPrice
      })
    }
  }

  const handleBuyNow = () => {
    if (selectedVariant) {
      handleAddToCart()
      if (isAuthenticated) {
        router.push('/checkout')
      } else {
        router.push('/auth?redirect=/checkout')
      }
    }
  }

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault()
    if (pincode.length === 6) setDeliveryStatus('success')
    else setDeliveryStatus('error')
  }

  if (!selectedVariant) return <div className="p-8 text-center">Loading product details...</div>

  // Flatten specifications preserving their existing groups (all data kept - only the visual is collapsed)
  const specFlatItems: { group: string; spec: ProductSpecificationResponseDTO }[] = []
  Object.entries(
    selectedVariant.specifications?.reduce((acc, spec) => {
      const group = spec.specGroup || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push(spec);
      return acc;
    }, {} as Record<string, typeof selectedVariant.specifications>) || {}
  ).forEach(([group, specs]) => {
    specs!.forEach(spec => specFlatItems.push({ group, spec }))
  })
  const specTotal = specFlatItems.length
  const MAX_VISIBLE_SPECS = 2

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 md:py-8 pb-28 lg:pb-8 lg:px-8">

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4 self-start lg:sticky lg:top-24 min-w-0">

          {/* Desktop View Image Gallery */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="rounded-3xl bg-[#F4F4F5] p-6 dark:bg-white">
              <img src={selectedImage || primaryImage} alt={product.name} className="aspect-square w-full object-contain transition-all duration-300 mix-blend-multiply dark:mix-blend-normal" />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(url)}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#F4F4F5] p-2 transition-all dark:bg-white ${selectedImage === url ? 'border-primary shadow-sm dark:border-primary' : 'border-transparent hover:border-primary/40 dark:border-zinc-200 dark:hover:border-primary/40'}`}
                  >
                    <img src={url} alt={`${product.name} thumbnail ${idx + 1}`} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile View Image Slider */}
          <div className="lg:hidden flex flex-col gap-3">
            <div
              ref={mobileSliderRef}
              className="relative overflow-hidden rounded-3xl bg-[#F4F4F5] dark:bg-white"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-y' }}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${mobileImageIndex * 100}%)`,
                }}
              >
                {allImages.length > 0 ? allImages.map((url, idx) => (
                  <div key={idx} className="w-full shrink-0 p-4 md:p-6">
                    <img src={url} alt={`${product.name} ${idx + 1}`} className="aspect-square w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </div>
                )) : (
                  <div className="w-full shrink-0 p-4 md:p-6">
                    <img src={primaryImage} alt={product.name} className="aspect-square w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </div>
                )}
              </div>
            </div>
            {allImages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-1">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToImage(idx)}
                    aria-label={`Go to image ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === mobileImageIndex ? 'w-4 bg-primary' : 'w-1.5 bg-border hover:bg-border/80'}`}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="flex flex-col gap-4 md:gap-6 min-w-0">
          <div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[.18em] text-primary dark:text-zinc-400">{product.brandName}</p>
            {product.brandName && (
              <div className="mt-0.5">
                <Link
                  href={`/shop?brand=${encodeURIComponent(product.brandName.toLowerCase().trim())}`}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors"
                >
                  Visit Brand Store
                </Link>
              </div>
            )}
            <h1 className="mt-1.5 text-xl md:text-3xl lg:text-4xl font-black leading-tight">{product.name}</h1>
            <div className="mt-2.5 md:mt-3 flex items-center gap-1.5 md:gap-2">
              <FaStar className="size-[15px] md:size-[17px] text-accent" fill="currentColor" />
              <b className="text-sm md:text-base">{product.avgRating || 0}</b>
              <a href="#reviews" className="text-xs md:text-sm text-muted-foreground hover:text-primary hover:underline">{product.totalReviews || 0} reviews</a>
            </div>
          </div>

          <div>
            <p className="text-xl md:text-3xl font-black">{formatINR(selectedVariant.sellingPrice)}</p>
            {selectedVariant.mrp && selectedVariant.mrp > selectedVariant.sellingPrice && (
              <p className="mt-0.5 md:mt-1 text-[11px] md:text-sm text-muted-foreground">MRP <span className="line-through">{formatINR(selectedVariant.mrp)}</span></p>
            )}
          </div>

          {/* CASE 2: Show Variant Selector ONLY if uniqueVariantNames.length > 1 */}
          {uniqueVariantNames.length > 1 && (
            <div>
              <p className="mb-2 md:mb-3 text-xs md:text-sm font-bold">Variant</p>
              <div className="flex flex-wrap gap-2">
                {uniqueVariantNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedVariantName(name)}
                    className={`rounded-lg md:rounded-xl border px-3 md:px-4 py-1.5 md:py-2.5 text-[11px] md:text-sm font-medium transition-colors ${selectedVariantName === name ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border hover:border-foreground/30'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector: Shown if multiple colors exist or if variant selector is hidden but color exists */}
          {availableColorsForSelectedName.length > 0 && (availableColorsForSelectedName.length > 1 || uniqueVariantNames.length > 1) && (
            <div>
              <p className="mb-2 md:mb-3 text-xs md:text-sm font-bold">Color: <span className="font-normal text-muted-foreground">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {availableColorsForSelectedName.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-lg md:rounded-xl border px-3 md:px-4 py-1.5 md:py-2.5 text-[11px] md:text-sm font-medium transition-colors ${selectedColor === color ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border hover:border-foreground/30'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Inquiry Button — Positioned IMMEDIATELY below Colour Selection */}
          <div className="mt-1 md:mt-2">
            <button
              type="button"
              onClick={() => openBulkInquiry({
                id: product.id,
                name: product.name,
                brandName: product.brandName,
                selectedColor: selectedColor,
                availableColors: availableColorsForSelectedName.length > 0 ? availableColorsForSelectedName : [selectedColor || 'Standard'],
                isProductLocked: true
              })}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 text-xs md:text-sm font-extrabold transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer group/bulk"
            >
              <FaBoxesPacking size={16} className="shrink-0 text-white group-hover/bulk:scale-110 transition-transform" />
              <span className="text-white font-extrabold">Bulk Inquiry</span>
            </button>
          </div>

          <div className="mt-2 hidden lg:flex gap-3">
            <button 
              onClick={handleAddToCart} 
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-4 font-bold transition-all duration-300 active:scale-95 ${
                isVariantInCart 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400' 
                  : 'border-primary text-primary hover:bg-primary/5'
              }`}
            >
              {isVariantInCart ? (
                <>
                  <FaCircleCheck size={20} className="animate-bounce" style={{ animationIterationCount: 1, animationDuration: '0.5s' }} /> 
                  <span>Go to cart</span>
                </>
              ) : (
                <>
                  <FaCartShopping size={20} /> 
                  <span>Add to cart</span>
                </>
              )}
            </button>
            <button onClick={handleBuyNow} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
              <FaBolt size={20} /> Buy now
            </button>
            <button
              onClick={() => toggleCompare(selectedVariant.id, product.categoryId, product.id)}
              className={`px-4 py-4 rounded-xl border-2 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-colors ${isCompared
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-400'
                  : 'border-border text-foreground hover:bg-muted'
                }`}
              title="Add to Compare"
            >
              {isCompared ? 'Compared' : 'Compare'}
            </button>
          </div>

          <form onSubmit={checkPincode} className="rounded-2xl border border-border p-4 bg-muted/30">
            <p className="text-sm font-bold flex items-center gap-2 mb-3">
              <FaLocationDot size={16} className="text-primary" /> Delivery Options
            </p>
            <div className="flex gap-2">
              <input
                type="text" placeholder="Enter 6-digit Pincode" value={pincode}
                onChange={(e) => { setPincode(e.target.value); setDeliveryStatus('idle'); }}
                className="flex-1 min-w-0 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                maxLength={6}
              />
              <button type="submit" className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Check</button>
            </div>
            {deliveryStatus === 'success' && (
              <p className="mt-3 text-sm font-semibold text-emerald-600 flex items-center gap-1.5"><FaCircleCheck size={16} /> Delivery available by tomorrow!</p>
            )}
            {deliveryStatus === 'error' && (
              <p className="mt-3 text-sm font-semibold text-destructive">Please enter a valid 6-digit pincode.</p>
            )}
          </form>

          {product.highlights && product.highlights.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 mt-4">
              <h2 className="font-bold text-lg mb-4">Highlights</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {product.highlights.map(h => {
                  const Icon = h.iconName === 'MemoryStick' ? FaMemory :
                    h.iconName === 'HardDrive' ? FaHardDrive :
                      h.iconName === 'Microchip' ? FaMicrochip :
                        h.iconName === 'ShieldCheck' ? FaShieldHalved :
                          h.iconName === 'Truck' ? FaTruckFast :
                            h.iconName === 'Cpu' ? FaMicrochip :
                              h.iconName === 'Battery' ? FaBatteryFull :
                                h.iconName === 'Star' ? FaStar :
                                  h.iconName === 'Settings' ? FaGear :
                                    h.iconName === 'Smartphone' ? FaMobileScreen :
                                      h.iconName === 'Camera' ? FaCamera :
                                        h.iconName === 'Wifi' ? FaWifi :
                                          h.iconName === 'Bluetooth' ? FaBluetooth :
                                            h.iconName === 'Zap' ? FaBolt : FaCircleCheck;

                  const cleanName = getCleanVariantName(selectedVariant);
                  let text = h.text.replace('{variant}', cleanName);

                  const isMemoryHighlight = h.iconName === 'MemoryStick' || 
                    text.toUpperCase().includes('RAM') || 
                    text.toUpperCase().includes('ROM') || 
                    text.includes('{ram}') || 
                    text.includes('{rom}');

                  if (isMemoryHighlight) {
                    let parsed = parseRamRomFromText(cleanName);
                    if (!parsed.ram && !parsed.rom) {
                      parsed = parseRamRomFromText(text);
                    }

                    if (parsed.ram && parsed.rom) {
                      text = `${parsed.ram} | ${parsed.rom}`;
                    } else if (parsed.rom) {
                      text = parsed.rom;
                    } else if (parsed.ram) {
                      text = parsed.ram;
                    }
                  }

                  return (
                    <div key={h.id} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-medium">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5 mt-4">
            <h2 className="font-bold text-lg">Description</h2>
            <div className="mt-3 prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 mt-4">
            <h2 className="font-bold text-lg mb-4">Specifications</h2>
            <AnimatePresence mode="wait">
              <motion.div
                key={specsExpanded ? 'specs-expanded' : 'specs-collapsed'}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                {(() => {
                  // Default collapsed state shows only the first 1-2 rows;
                  // all specification data remains intact in `specFlatItems`.
                  const displayItems = specsExpanded ? specFlatItems : specFlatItems.slice(0, MAX_VISIBLE_SPECS)
                  const byGroup: Record<string, typeof specFlatItems> = {}
                  displayItems.forEach(item => {
                    if (!byGroup[item.group]) byGroup[item.group] = []
                    byGroup[item.group].push(item)
                  })
                  return Object.entries(byGroup).map(([group, items]) => (
                    <div key={group}>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 bg-primary/5 p-2 rounded-lg">{group}</h3>
                      <div className="grid gap-4 sm:grid-cols-2 px-2">
                        {items.map(item => (
                          <div key={item.spec.specKey} className="border-b border-border pb-3 sm:border-b-0 sm:pb-0">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">{item.spec.specKey}</p>
                            <p className="mt-1 text-sm font-medium">{item.spec.specValue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </motion.div>
            </AnimatePresence>
            {specTotal > MAX_VISIBLE_SPECS && (
              <button
                type="button"
                onClick={() => setSpecsExpanded(!specsExpanded)}
                aria-expanded={specsExpanded}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-5 py-2.5 text-sm font-bold hover:bg-muted/50 transition-colors mt-2"
              >
                <FaChevronDown size={16} className={`transition-transform duration-300 ${specsExpanded ? 'rotate-180' : ''}`} />
                {specsExpanded ? 'Show Less' : 'See More'}
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className="my-12 border-border" />

      <ProductFeatureImages />

      <ProductReviews productId={product.id} />

      <ProductSuggestedPhones product={product} />

      {/* Mobile Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-2.5 border-t border-border bg-background p-3 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <button 
          onClick={handleAddToCart} 
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-300 active:scale-95 ${
            isVariantInCart 
              ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400' 
              : 'border-primary text-primary hover:bg-primary/5'
          }`}
        >
          {isVariantInCart ? (
            <>
              <FaCircleCheck size={16} className="animate-bounce" style={{ animationIterationCount: 1, animationDuration: '0.5s' }} /> 
              <span>Go to cart</span>
            </>
          ) : (
            <>
              <FaCartShopping size={16} /> 
              <span>Add to cart</span>
            </>
          )}
        </button>
        <button onClick={handleBuyNow} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
          <FaBolt size={16} /> Buy now
        </button>
      </div>
    </main>
  )
}
