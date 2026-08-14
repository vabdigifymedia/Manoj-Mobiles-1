'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star, MapPin, CheckCircle2, MessageSquare, ShoppingCart, Zap, MemoryStick, HardDrive, Microchip, ShieldCheck, Truck, Cpu, Battery, Settings, Smartphone, Camera, Wifi, Bluetooth } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatINR } from '@/lib/apiClient'
import { useStore } from '@/components/store-provider'
import type { ProductResponseDTO, ProductVariantResponseDTO } from '@/lib/types'
import { ProductReviews } from '@/components/product-reviews'

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<ProductResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantResponseDTO | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('')
  
  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedColor) {
      setSelectedColor(product.variants[0].color || '')
    }
  }, [product])
  
  const availableColors = Array.from(new Set(product?.variants.map(v => v.color).filter(Boolean) || []))
  const variantsForColor = product?.variants.filter(v => v.color === selectedColor).sort((a, b) => a.sellingPrice - b.sellingPrice) || []
  
  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    const newVariants = product?.variants.filter(v => v.color === color).sort((a, b) => a.sellingPrice - b.sellingPrice) || []
    if (newVariants.length > 0) {
      if (selectedVariant) {
        const equivalent = newVariants.find(v => v.variantName === selectedVariant.variantName)
        setSelectedVariant(equivalent || newVariants[0])
      } else {
        setSelectedVariant(newVariants[0])
      }
    }
  }
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  useEffect(() => {
    if (selectedVariant) {
      const primary = selectedVariant.images?.find(img => img.isPrimary)?.url || selectedVariant.imageUrls?.[0]
      setSelectedImage(primary || '/placeholder.png')
    }
  }, [selectedVariant])
  
  const [pincode, setPincode] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(5)
  
  const { addToCart } = useStore()
  const router = useRouter()

  useEffect(() => {
    apiClient.getProductById(id).then(res => {
      setProduct(res.data.data)
      if (res.data.data.variants.length > 0) {
        setSelectedVariant(res.data.data.variants[0])
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [id])

  const handleBuyNow = () => {
    if (selectedVariant) {
      addToCart(selectedVariant.id, 1)
      router.push('/checkout')
    }
  }

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault()
    if (pincode.length === 6) setDeliveryStatus('success')
    else setDeliveryStatus('error')
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!product || !selectedVariant) return <div className="p-8 text-center text-red-500">Product not found</div>

  const primaryImage = selectedVariant.images?.find(img => img.isPrimary)?.url || selectedVariant.imageUrls?.[0] || '/placeholder.png'
  const allImages = selectedVariant.images?.map(img => img.url) || selectedVariant.imageUrls || []

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link href="/shop" className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to shop
      </Link>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4 self-start sticky top-24">
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
        
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary dark:text-zinc-400">{product.brandName}</p>
            <h1 className="mt-1 text-4xl font-black">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2">
              <Star size={17} fill="currentColor" className="text-accent" />
              <b>{product.avgRating || 0}</b>
              <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary hover:underline">{product.totalReviews || 0} reviews</a>
            </div>
          </div>
          
          <div>
            <p className="text-3xl font-black">{formatINR(selectedVariant.sellingPrice)}</p>
            <p className="mt-1 text-sm text-muted-foreground">MRP <span className="line-through">{formatINR(selectedVariant.mrp)}</span></p>
          </div>
          
          {availableColors.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold">Color: {selectedColor}</p>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(color => (
                  <button 
                    key={color} 
                    onClick={() => handleColorChange(color as string)} 
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${selectedColor === color ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border hover:border-foreground/30'}`}
                  >
                    {color as string}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <p className="mb-3 text-sm font-bold">Storage / Variant</p>
            <div className="flex flex-col gap-2">
              {variantsForColor.map(v => (
                <button 
                  key={v.id} 
                  onClick={() => setSelectedVariant(v)} 
                  className={`flex justify-between items-center rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${selectedVariant.id === v.id ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border hover:border-foreground/30'}`}
                >
                  <span>{v.variantName.replace(`(${v.color})`, '').trim()}</span>
                  <span className="font-bold">{formatINR(v.sellingPrice)}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-2 flex gap-3">
            <button onClick={() => addToCart(selectedVariant.id, 1)} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-primary px-5 py-4 font-bold text-primary hover:bg-primary/5 transition-colors">
              <ShoppingCart size={20} /> Add to cart
            </button>
            <button onClick={handleBuyNow} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
              <Zap size={20} /> Buy now
            </button>
          </div>
          
          <form onSubmit={checkPincode} className="rounded-2xl border border-border p-4 bg-muted/30">
            <p className="text-sm font-bold flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-primary" /> Delivery Options
            </p>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Enter 6-digit Pincode" value={pincode}
                onChange={(e) => { setPincode(e.target.value); setDeliveryStatus('idle'); }}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                maxLength={6}
              />
              <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Check</button>
            </div>
            {deliveryStatus === 'success' && (
              <p className="mt-3 text-sm font-semibold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={16} /> Delivery available by tomorrow!</p>
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
                  const Icon = h.iconName === 'MemoryStick' ? MemoryStick :
                               h.iconName === 'HardDrive' ? HardDrive :
                               h.iconName === 'Microchip' ? Microchip :
                               h.iconName === 'ShieldCheck' ? ShieldCheck :
                               h.iconName === 'Truck' ? Truck :
                               h.iconName === 'Cpu' ? Cpu :
                               h.iconName === 'Battery' ? Battery :
                               h.iconName === 'Star' ? Star :
                               h.iconName === 'Settings' ? Settings :
                               h.iconName === 'Smartphone' ? Smartphone :
                               h.iconName === 'Camera' ? Camera :
                               h.iconName === 'Wifi' ? Wifi :
                               h.iconName === 'Bluetooth' ? Bluetooth :
                               h.iconName === 'Zap' ? Zap : CheckCircle2;
                  
                  const cleanName = selectedVariant.variantName.replace(`(${selectedVariant.color})`, '').trim();
                  let text = h.text.replace('{variant}', cleanName);
                  
                  // Auto-detect RAM and ROM from variant name (e.g. "512 GB + 12 GB")
                  const sizes = [...cleanName.matchAll(/(\d+)\s*(GB|TB|MB)/gi)].map(m => ({
                    value: parseInt(m[1]),
                    unit: m[2].toUpperCase(),
                    original: m[0]
                  }));
                  
                  if (sizes.length === 2 && (text.includes('{ram}') || text.includes('{rom}'))) {
                    sizes.sort((a, b) => {
                      const aVal = a.unit === 'TB' ? a.value * 1024 : a.unit === 'MB' ? a.value / 1024 : a.value;
                      const bVal = b.unit === 'TB' ? b.value * 1024 : b.unit === 'MB' ? b.value / 1024 : b.value;
                      return aVal - bVal;
                    });
                    text = text.replace(/{ram}/gi, sizes[0].original).replace(/{rom}/gi, sizes[1].original);
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
            <div className="flex flex-col gap-6">
              {Object.entries(
                selectedVariant.specifications?.reduce((acc, spec) => {
                  const group = spec.specGroup || 'General';
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(spec);
                  return acc;
                }, {} as Record<string, typeof selectedVariant.specifications>) || {}
              ).map(([group, specs]) => (
                <div key={group}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 bg-primary/5 p-2 rounded-lg">{group}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 px-2">
                    {specs!.map(spec => (
                      <div key={spec.specKey} className="border-b border-border pb-3 sm:border-b-0 sm:pb-0">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{spec.specKey}</p>
                        <p className="mt-1 text-sm font-medium">{spec.specValue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className="my-12 border-border" />
      
      <ProductReviews productId={product.id} />
    </main>
  )
}
