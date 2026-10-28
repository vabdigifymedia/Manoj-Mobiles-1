import type { Metadata } from 'next'
import { fetchCatalogServer, selectMobileProducts } from '@/lib/productCatalog'
import { EmiEligibilityWizard } from '@/components/emi/emi-eligibility-wizard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Check EMI Eligibility | Easy Smartphone EMIs - EMIStore',
  description:
    'Check your smartphone EMI eligibility in a few simple steps. Browse real smartphones from Apple, Samsung, OnePlus, and submit an initial enquiry with our financing partners.',
}

export default async function EmiEligibilityPage() {
  const catalog = await fetchCatalogServer()
  const mobileProducts = selectMobileProducts(catalog)

  return (
    <main className="min-h-screen bg-muted/20">
      {/* Header Banner */}
      <section className="border-b border-border bg-card py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            Digital EMI Desk
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Check Your Smartphone EMI Eligibility
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Quick, transparent eligibility enquiry for your next smartphone. Choose your preferred model and check financing options.
          </p>
        </div>
      </section>

      {/* Multi-step Form */}
      <EmiEligibilityWizard initialMobileProducts={mobileProducts} />
    </main>
  )
}

