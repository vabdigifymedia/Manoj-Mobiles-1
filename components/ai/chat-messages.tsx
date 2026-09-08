import { Sparkles } from 'lucide-react'
import type { ChatMessage } from './types'
import { ProductRecommendationCard } from './product-recommendation-card'

/** Small AI avatar shown beside assistant messages. */
export function AIAvatar() {
  return (
    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
      <Sparkles size={13} />
    </div>
  )
}

/**
 * Assistant (AI) message bubble — left aligned.
 * Renders optional ProductRecommendationCards when the AI API
 * attaches product suggestions to the response.
 */
export function AIMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex max-w-[92%] items-end gap-2">
      <AIAvatar />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="whitespace-pre-line break-words rounded-2xl rounded-tl-md border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
          {message.content}
        </div>
        {message.products && message.products.length > 0 && (
          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {message.products.map(product => (
              <ProductRecommendationCard
                key={`${product.productId}-${product.variantId || 'default'}`}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** User message bubble — right aligned. */
export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-line break-words rounded-2xl rounded-tr-md bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
        {message.content}
      </div>
    </div>
  )
}

export interface QuickAction {
  /** Label shown on the chip. */
  label: string
  /** Prompt sent to the AI when the chip is tapped (future API query). */
  prompt: string
}

/** Quick action chips shown under the welcome message. Clicking sends the prompt through the normal message flow. */
export function QuickActions({
  actions,
  onAction,
  disabled = false,
}: {
  actions: QuickAction[]
  onAction: (prompt: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2 pl-9">
      {actions.map(action => (
        <button
          key={action.label}
          type="button"
          disabled={disabled}
          onClick={() => onAction(action.prompt)}
          className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-xs transition-all duration-150 hover:border-primary/50 hover:bg-muted active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
