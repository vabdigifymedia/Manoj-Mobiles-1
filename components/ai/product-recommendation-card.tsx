import Link from 'next/link'
import { formatINR } from '@/lib/apiClient'
import type { ChatProductSuggestion } from './types'

/**
 * Future-ready product recommendation card for Manoj AI responses.
 *
 * Styled to match the existing Manoj Mobiles product cards (rounded
 * borders, clean surfaces, brand accent) and links straight into the
 * existing Product Detail page. It renders ONLY when an assistant
 * message carries `products` — no fake/demo products are populated
 * in this phase; real data will flow in from the AI API later.
 */
export function ProductRecommendationCard({ product }: { product: ChatProductSuggestion }) {
  const href = `/product/${product.productId}${product.variantId ? `?variant=${product.variantId}` : ''}`

  return (
    <Link
      href={href}
      className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      {/* Image */}
      <div className="flex h-24 w-full items-center justify-center overflow-hidden bg-white p-2 dark:bg-zinc-950">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product</span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-0.5 p-2.5">
        {product.brandName && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">{product.brandName}</span>
        )}
        <span className="line-clamp-2 text-xs font-bold leading-snug text-foreground">{product.name}</span>
        <span className="mt-0.5 text-sm font-black text-foreground">{formatINR(product.price)}</span>
        {product.mrp && product.mrp > product.price && (
          <span className="text-[10px] font-semibold text-muted-foreground line-through">{formatINR(product.mrp)}</span>
        )}
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary transition-colors group-hover:underline">
          View Product
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  )
}
