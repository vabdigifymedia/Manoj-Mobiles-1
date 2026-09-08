/**
 * Professional AI typing indicator (three bouncing dots).
 * Reusable — will be shown whenever the future AI API call is in flight.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" aria-live="polite">
      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3.5 shadow-sm"
        role="status"
        aria-label="Manoj AI is typing"
      >
        <span className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce [animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="sr-only">Manoj AI is typing…</span>
    </div>
  )
}
