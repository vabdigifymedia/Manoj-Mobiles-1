# Restore Guide: Temporarily Hidden Features (Global Buy & Bulk Inquiry)

This document provides a complete record of the changes made to temporarily hide **Global Buy** and **Bulk Inquiry / Bulk Enquiry** from the public-facing storefront of Manoj Mobiles, along with exact instructions and code to restore them at any time.

---

## 1. Summary of Hidden Features

| Feature | Description | Public Entry Points Hidden | Underlying Code Preserved? |
| :--- | :--- | :--- | :--- |
| **Global Buy** | Filtered catalog showcasing Apple & Samsung devices | Desktop Header Nav, Mobile Header Drawer, Footer Quick Links, `/global-buy` route URL | Yes (components, helpers & page route logic intact) |
| **Bulk Inquiry / Bulk Enquiry** | B2B wholesale order inquiry modal & submission flow | Desktop Header Nav button, Mobile Header Drawer button, Homepage Bulk Section, Product Details Bulk Inquiry button, public modal renderer | Yes (APIs, Admin panel `/admin/bulk-inquiries`, backend services & forms intact) |

---

## 2. Inventory of Affected Files & Components

### A. Public UI Files Modified to Hide Features:
1. `components/header.tsx`
   - Removed `/global-buy` from `nav` array.
   - Commented out "Bulk Inquiry" desktop navigation button.
   - Commented out "Bulk Buy" mobile sidebar drawer button.
2. `components/footer.tsx`
   - Commented out "Global Buy" link from the "Quick Links" column.
3. `app/page.tsx`
   - Commented out `<BulkInquirySection />` from the homepage.
4. `components/product-detail.tsx`
   - Commented out the `<button>Bulk Inquiry</button>` section below the color picker.
5. `app/global-buy/page.tsx`
   - Added a safe server-side redirect to `/shop` so that manual navigation or bookmarks cannot access the page while hidden.
6. `components/bulk-inquiry-modal.tsx`
   - Added an immediate early return (`return null`) to guarantee the modal does not pop up under any circumstances on the storefront.

### B. Unmodified Preserved Files (Fully Intact):
- `app/admin/bulk-inquiries/page.tsx` (Admin Bulk Inquiries dashboard & management)
- `app/admin/layout.tsx` (Admin sidebar with pending bulk inquiry counter)
- `app/api/revalidate-catalog/route.ts` (Admin cache revalidation)
- `components/home/bulk-inquiry-section.tsx` (Original homepage section component)
- `components/shop/global-buy-search.tsx` (Global Buy search bar component)
- `components/bulk-inquiry-provider.tsx` (Context provider for state management)
- `lib/bulkInquiryService.ts` (Bulk inquiry submission & fetch service)
- `lib/apiClient.ts` (Public & Admin bulk inquiry API endpoints)
- `lib/types.ts` (Bulk inquiry TypeScript interfaces & DTOs)

---

## 3. Exact Changes & Original Code Backup

### 1) `components/header.tsx`

#### A. Global Buy Navigation Entry
- **Original Code (lines 28–32):**
```tsx
const nav = [
  { key: '/', label: 'Home' },
  { key: '/shop', label: 'Shop' },
  { key: '/global-buy', label: 'Global Buy' }
]
```
- **Hidden State:**
```tsx
const nav = [
  { key: '/', label: 'Home' },
  { key: '/shop', label: 'Shop' },
  // TEMPORARILY HIDDEN: Global Buy
  // { key: '/global-buy', label: 'Global Buy' }
]
```

#### B. Desktop "Bulk Inquiry" Button
- **Original Code (lines 263–269):**
```tsx
            <button
              type="button"
              onClick={() => openBulkInquiry(null)}
              className="text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Bulk Inquiry
            </button>
```
- **Hidden State:**
```tsx
            {/* TEMPORARILY HIDDEN: Bulk Inquiry
            <button
              type="button"
              onClick={() => openBulkInquiry(null)}
              className="text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Bulk Inquiry
            </button>
            */}
```

#### C. Mobile Drawer "Bulk Buy" Button
- **Original Code (lines 549–560):**
```tsx
              {/* Bulk Buy — placed directly below Global Buy. Opens the existing Bulk Inquiry
                  (Bulk Buy) flow used by the home page section & product pages. */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openBulkInquiry(null)
                }}
                className="p-2.5 text-left hover:bg-muted rounded-xl transition-colors cursor-pointer"
              >
                Bulk Buy
              </button>
```
- **Hidden State:**
```tsx
              {/* TEMPORARILY HIDDEN: Bulk Buy
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openBulkInquiry(null)
                }}
                className="p-2.5 text-left hover:bg-muted rounded-xl transition-colors cursor-pointer"
              >
                Bulk Buy
              </button>
              */}
```

---

### 2) `components/footer.tsx`

#### Global Buy Link in Quick Links
- **Original Code (line 111):**
```tsx
              <li><Link href="/global-buy" className="hover:text-primary transition-colors">Global Buy</Link></li>
```
- **Hidden State:**
```tsx
              {/* TEMPORARILY HIDDEN: Global Buy */}
              {/* <li><Link href="/global-buy" className="hover:text-primary transition-colors">Global Buy</Link></li> */}
```

---

### 3) `app/page.tsx`

#### Bulk Inquiry Homepage Section
- **Original Code (lines 166–167):**
```tsx
      {/* Bulk Inquiry Section — Positioned IMMEDIATELY after Trending Reels */}
      <BulkInquirySection />
```
- **Hidden State:**
```tsx
      {/* TEMPORARILY HIDDEN: Bulk Inquiry Section
      <BulkInquirySection />
      */}
```

---

### 4) `components/product-detail.tsx`

#### Bulk Inquiry Button on Product Page
- **Original Code (lines 437–455):**
```tsx
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
                imageUrl: primaryImage,
                isProductLocked: true
              })}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 text-xs md:text-sm font-extrabold transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer group/bulk"
            >
              <FaBoxesPacking size={16} className="shrink-0 text-white group-hover/bulk:scale-110 transition-transform" />
              <span className="text-white font-extrabold">Bulk Inquiry</span>
            </button>
          </div>
```
- **Hidden State:**
```tsx
          {/* TEMPORARILY HIDDEN: Bulk Inquiry Button
          <div className="mt-1 md:mt-2">
            <button
              type="button"
              onClick={() => openBulkInquiry({
                id: product.id,
                name: product.name,
                brandName: product.brandName,
                selectedColor: selectedColor,
                availableColors: availableColorsForSelectedName.length > 0 ? availableColorsForSelectedName : [selectedColor || 'Standard'],
                imageUrl: primaryImage,
                isProductLocked: true
              })}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 text-xs md:text-sm font-extrabold transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer group/bulk"
            >
              <FaBoxesPacking size={16} className="shrink-0 text-white group-hover/bulk:scale-110 transition-transform" />
              <span className="text-white font-extrabold">Bulk Inquiry</span>
            </button>
          </div>
          */}
```

---

### 5) `app/global-buy/page.tsx`

#### Direct URL Access Protection
- **Original Code (lines 18–22):**
```tsx
export default async function GlobalBuyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q, brand } = await searchParams
```
- **Hidden State:**
```tsx
import { redirect } from 'next/navigation'

export default async function GlobalBuyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // TEMPORARILY HIDDEN: Redirect direct visits to /shop
  redirect('/shop')

  const { q, brand } = await searchParams
```

---

### 6) `components/bulk-inquiry-modal.tsx`

#### Modal Public Display Guard
- **Original Code (line 216):**
```tsx
  if (!isOpen) return null
```
- **Hidden State:**
```tsx
  // TEMPORARILY HIDDEN: Bulk Inquiry Modal disabled on public storefront
  return null
```

---

## 4. Step-by-Step Restoration Instructions

### Option 1: Automated Patch Restoration (Fastest)
If you created the patch file `restore-hidden-features.patch`, simply run:
```bash
git apply restore-hidden-features.patch
```
Or to reverse git changes directly:
```bash
git checkout components/header.tsx components/footer.tsx app/page.tsx components/product-detail.tsx app/global-buy/page.tsx components/bulk-inquiry-modal.tsx
```

---

### Option 2: Manual Step-by-Step Restoration

1. **Restore Global Buy & Bulk Inquiry in Header (`components/header.tsx`):**
   - In `const nav = [...]`, uncomment `{ key: '/global-buy', label: 'Global Buy' }`.
   - In the desktop `<nav>`, uncomment the `<button ...>Bulk Inquiry</button>`.
   - In the mobile menu drawer, uncomment the `<button ...>Bulk Buy</button>`.

2. **Restore Global Buy in Footer (`components/footer.tsx`):**
   - Under "Quick Links", uncomment `<li><Link href="/global-buy" ...>Global Buy</Link></li>`.

3. **Restore Bulk Inquiry on Homepage (`app/page.tsx`):**
   - Uncomment `<BulkInquirySection />` right below `<InstagramReels />`.

4. **Restore Bulk Inquiry on Product Details (`components/product-detail.tsx`):**
   - Uncomment the `<div className="mt-1 md:mt-2">...</div>` containing the Bulk Inquiry button.

5. **Reactivate the Global Buy Page (`app/global-buy/page.tsx`):**
   - Remove `redirect('/shop')` and `import { redirect } from 'next/navigation'` from `app/global-buy/page.tsx`.

6. **Reactivate the Bulk Inquiry Modal (`components/bulk-inquiry-modal.tsx`):**
   - Restore `if (!isOpen) return null` in place of `return null` at line 216.

7. **Verify & Rebuild:**
   - Run `npm run build` or inspect on `http://localhost:3000` to confirm both features work as expected.

---

## 5. Complete Git Diff Reverse Patch

The patch file `restore-hidden-features.patch` at the project root contains the following exact diff. Applying this patch with `git apply restore-hidden-features.patch` completely restores all 6 files:

```diff
diff --git b/app/global-buy/page.tsx a/app/global-buy/page.tsx
index b1680c3..59c0418 100644
--- b/app/global-buy/page.tsx
+++ a/app/global-buy/page.tsx
@@ -1,5 +1,4 @@
 import { Metadata } from 'next'
-import { redirect } from 'next/navigation'
 import { ProductCard as ListProductCard } from '@/components/ui/product-card-1'
 import { GlobalBuySearch } from '@/components/shop/global-buy-search'
 import { serverFetch } from '@/lib/apiClient'
@@ -19,9 +18,6 @@ export const metadata: Metadata = {
 }
 
 export default async function GlobalBuyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
-  // TEMPORARILY HIDDEN: Redirect direct visits away from /global-buy to /shop
-  redirect('/shop')
-
   const { q, brand } = await searchParams
   const searchQuery = typeof q === 'string' ? q.trim() : ''
   const brandQuery = typeof brand === 'string' ? brand : ''
diff --git b/app/page.tsx a/app/page.tsx
index 4e3a529..1ad3e9d 100644
--- b/app/page.tsx
+++ a/app/page.tsx
@@ -163,9 +163,8 @@ export default async function HomePage() {
       {/* Instagram Reels */}
       <InstagramReels reels={reelsData || []} />
 
-      {/* TEMPORARILY HIDDEN: Bulk Inquiry Section
+      {/* Bulk Inquiry Section — Positioned IMMEDIATELY after Trending Reels */}
       <BulkInquirySection />
-      */}
 
       {/* Why Shop With Us */}
       <section className="bg-muted py-20 border-y border-border">
diff --git b/components/bulk-inquiry-modal.tsx a/components/bulk-inquiry-modal.tsx
index 8d1112c..a1492a7 100644
--- b/components/bulk-inquiry-modal.tsx
+++ a/components/bulk-inquiry-modal.tsx
@@ -213,8 +213,7 @@ export function BulkInquiryModal({ isOpen, onClose, target }: BulkInquiryModalPr
     return null
   }, [target, selectedProductId, productsForSelectedCompany, productList, selectedCompany])
 
-  // TEMPORARILY HIDDEN: Bulk Inquiry Modal disabled on public storefront
-  return null
+  if (!isOpen) return null
 
   // Progress Completion Checks
   const isStep1Done = Boolean(selectedCompany && selectedProductName && selectedColor)
diff --git b/components/footer.tsx a/components/footer.tsx
index 5dd09e6..4bfc5b8 100644
--- b/components/footer.tsx
+++ a/components/footer.tsx
@@ -108,8 +108,7 @@ export function Footer() {
           <div>
             <h3 className="font-bold mb-6 tracking-wide">Quick Links</h3>
             <ul className="space-y-4 text-sm text-muted-foreground">
-              {/* TEMPORARILY HIDDEN: Global Buy */}
-              {/* <li><Link href="/global-buy" className="hover:text-primary transition-colors">Global Buy</Link></li> */}
+              <li><Link href="/global-buy" className="hover:text-primary transition-colors">Global Buy</Link></li>
               <li><Link href="/shop" className="hover:text-primary transition-colors">Shop All Phones</Link></li>
               <li><Link href="/shop" className="hover:text-primary transition-colors">Apple iPhones</Link></li>
               <li><Link href="/shop" className="hover:text-primary transition-colors">Samsung Galaxy</Link></li>
diff --git b/components/header.tsx a/components/header.tsx
index 4323354..30518a5 100644
--- b/components/header.tsx
+++ a/components/header.tsx
@@ -28,8 +28,7 @@ import {
 const nav = [
   { key: '/', label: 'Home' },
   { key: '/shop', label: 'Shop' },
-  // TEMPORARILY HIDDEN: Global Buy
-  // { key: '/global-buy', label: 'Global Buy' }
+  { key: '/global-buy', label: 'Global Buy' }
 ]
 
 export function Header() {
@@ -261,7 +260,6 @@ export function Header() {
                 {item.label}
               </Link>
             ))}
-            {/* TEMPORARILY HIDDEN: Bulk Inquiry
             <button
               type="button"
               onClick={() => openBulkInquiry(null)}
@@ -269,7 +267,6 @@ export function Header() {
             >
               Bulk Inquiry
             </button>
-            */}
           </nav>
           <div ref={searchRef} className="ml-auto hidden max-w-md flex-1 relative md:block">
             <div className="flex items-center gap-3 rounded-full bg-[#EAF0F6] dark:bg-zinc-900 px-4 py-2.5">
@@ -549,7 +546,8 @@ export function Header() {
                   {item.label}
                 </Link>
               ))}
-              {/* TEMPORARILY HIDDEN: Bulk Buy
+              {/* Bulk Buy — placed directly below Global Buy. Opens the existing Bulk Inquiry
+                  (Bulk Buy) flow used by the home page section & product pages. */}
               <button
                 type="button"
                 onClick={() => {
@@ -560,7 +558,6 @@ export function Header() {
               >
                 Bulk Buy
               </button>
-              */}
               <hr className="my-1 border-border" />
               {mounted && isAuthenticated ? (
                 <>
diff --git b/components/product-detail.tsx a/components/product-detail.tsx
index 32dc8e3..99923f7 100644
--- b/components/product-detail.tsx
+++ a/components/product-detail.tsx
@@ -434,7 +434,7 @@ export function ProductDetailClient({ product: initialProduct }: { product: Prod
             </div>
           )}
 
-          {/* TEMPORARILY HIDDEN: Bulk Inquiry Button
+          {/* Bulk Inquiry Button — Positioned IMMEDIATELY below Colour Selection */}
           <div className="mt-1 md:mt-2">
             <button
               type="button"
@@ -453,7 +453,6 @@ export function ProductDetailClient({ product: initialProduct }: { product: Prod
               <span className="text-white font-extrabold">Bulk Inquiry</span>
             </button>
           </div>
-          */}
 
           <div className="mt-2 hidden lg:flex gap-3">
             <button 
```

