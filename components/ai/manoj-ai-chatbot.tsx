'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SendHorizonal, Sparkles, X } from 'lucide-react'
import { AIMessage, QuickActions, UserMessage, type QuickAction } from './chat-messages'
import { TypingIndicator } from './typing-indicator'
import { sendMessageToAI } from './ai-service'
import type { ChatMessage } from './types'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'manoj-ai-welcome',
  role: 'assistant',
  content:
    "Hi! 👋 I'm Manoj AI.\n\nI can help you find the right mobile, compare phones, check specifications, and answer questions about Manoj Mobiles.",
  createdAt: 0,
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Find a Mobile', prompt: 'Help me find a mobile' },
  { label: 'Compare Phones', prompt: 'Compare phones for me' },
  { label: 'Best Phone Under ₹20,000', prompt: 'What is the best phone under ₹20,000?' },
  { label: 'Latest Phones', prompt: 'Show me the latest phones' },
  { label: 'Help Me Choose', prompt: 'Help me choose the right phone' },
]

// ── Automatic "Ask Manoj AI" attention CTA timing ──
const PROMPT_INITIAL_DELAY = 12000 // first appearance ~10-15s after page load
const PROMPT_VISIBLE_DURATION = 4500 // bubble stays visible ~4-5s
const PROMPT_REPEAT_INTERVAL = 22000 // re-shows every ~20-30s

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Manoj AI — the Manoj Mobiles AI assistant chatbot.
 *
 * This phase is UI-only: messages flow through local state and a clearly
 * separated placeholder in `components/ai/ai-service.ts`. To connect the
 * real AI later, only `sendMessageToAI` needs to change.
 */
export function ManojAIChatbot() {
  // ── Chat state (kept while the page stays open — closing only hides the panel) ──
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Automatic "Ask Manoj AI" attention CTA ──
  const [showAiPrompt, setShowAiPrompt] = useState(false)
  const isHoveredRef = useRef(false) // hovering keeps the bubble visible (overrides the scheduled hide)
  const promptDelayRef = useRef(PROMPT_INITIAL_DELAY) // first show ≈12s, later shows use the repeat gap

  // Keep the newest message visible while chatting
  useEffect(() => {
    if (!isChatOpen) return
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping, isChatOpen])

  // Keyboard support: focus input on open (desktop) and close on Escape
  useEffect(() => {
    if (!isChatOpen) return
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      inputRef.current?.focus()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsChatOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isChatOpen])

  // Automatic attention CTA: shows "Ask Manoj AI" ~12s after load for ~4.5s, then
  // repeats with a ~22s gap. Fully paused while the chat is open; every timer is
  // cleaned up on unmount/chat-open (single timer chain — no duplicates on re-render).
  useEffect(() => {
    if (isChatOpen) {
      setShowAiPrompt(false)
      promptDelayRef.current = PROMPT_REPEAT_INTERVAL
      return
    }

    let active = true
    const timers: ReturnType<typeof setTimeout>[] = []

    const scheduleShow = (delay: number) => {
      const showTimer = setTimeout(() => {
        if (!active) return
        setShowAiPrompt(true)
        const hideTimer = setTimeout(() => {
          if (!active) return
          // Hovering keeps the bubble visible (hover takes priority)
          if (!isHoveredRef.current) setShowAiPrompt(false)
          scheduleShow(PROMPT_REPEAT_INTERVAL)
        }, PROMPT_VISIBLE_DURATION)
        timers.push(hideTimer)
      }, delay)
      timers.push(showTimer)
    }

    scheduleShow(promptDelayRef.current)

    return () => {
      active = false
      timers.forEach(clearTimeout)
    }
  }, [isChatOpen])

  /**
   * Message flow: user message → local state → sendMessageToAI() → AI message.
   * Today sendMessageToAI returns a temporary placeholder; once the real API
   * lands, this handler needs no changes.
   */
  const handleSend = useCallback(
    async (rawText: string) => {
      const text = rawText.trim()
      if (!text || isTyping) return

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
      }
      const history = [...messages, userMessage]

      setMessages(history)
      setInput('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      setIsTyping(true)

      try {
        // ── FUTURE AI API INTEGRATION POINT (see components/ai/ai-service.ts) ──
        const response = await sendMessageToAI(text, history)
        setMessages(prev => [
          ...prev,
          {
            id: createMessageId(),
            role: 'assistant',
            content: response.message,
            products: response.products,
            createdAt: Date.now(),
          },
        ])
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: createMessageId(),
            role: 'assistant',
            content: 'Sorry, something went wrong on my side. Please try again in a moment.',
            createdAt: Date.now(),
          },
        ])
      } finally {
        setIsTyping(false)
      }
    },
    [isTyping, messages]
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void handleSend(input)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends · Shift + Enter adds a new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend(input)
    }
  }

  const autoResize = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  return (
    /* Shared fixed wrapper: the AI button and the chat panel live in the same
       anchored container, so the panel always opens directly above the button. */
    <div
      className="fixed bottom-20 right-4 z-[55] md:bottom-6 md:right-6"
      onMouseEnter={() => {
        isHoveredRef.current = true
        setShowAiPrompt(true)
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false
        setShowAiPrompt(false)
      }}
      onFocus={() => setShowAiPrompt(true)}
      onBlur={() => setShowAiPrompt(false)}
    >
      {/* ── Automatic "Ask Manoj AI" attention bubble (doubles as the hover tooltip) ── */}
      <div
        aria-hidden={!showAiPrompt || isChatOpen}
        className={`absolute bottom-full right-0 pb-2.5 ${showAiPrompt && !isChatOpen ? '' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          tabIndex={showAiPrompt && !isChatOpen ? 0 : -1}
          onClick={() => setIsChatOpen(true)}
          aria-label="Ask Manoj AI"
          className={`flex items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-3 pr-3.5 shadow-lg transition-all duration-300 md:py-2 md:pl-3.5 md:pr-4 ${
            showAiPrompt && !isChatOpen
              ? 'translate-y-0 scale-100 opacity-100 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
              : 'pointer-events-none translate-y-1.5 scale-95 opacity-0'
          }`}
        >
          <Sparkles size={12} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="whitespace-nowrap text-[11px] font-bold text-foreground md:text-xs">Ask Manoj AI</span>
        </button>
        {/* Speech-bubble tail pointing at the AI button */}
        <span className="absolute bottom-[6px] right-6 size-2.5 rotate-45 rounded-[2px] border-b border-r border-border bg-card" aria-hidden="true" />
      </div>

      {/* ── Floating Manoj AI launcher (replaces the old floating WhatsApp button position) ── */}
      <button
        type="button"
        onClick={() => setIsChatOpen(open => !open)}
        aria-label={isChatOpen ? 'Close Manoj AI chat' : 'Ask Manoj AI'}
        aria-expanded={isChatOpen}
        aria-controls="manoj-ai-chat"
        className={`group relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          showAiPrompt && !isChatOpen ? 'scale-105' : ''
        }`}
      >
        {/* Subtle pulse glow (closed state only — brightens while the attention CTA is visible) */}
        {!isChatOpen && (
          <span
            className={`absolute inset-0 rounded-full motion-safe:animate-ping [animation-duration:2.8s] ${showAiPrompt ? 'bg-primary/60' : 'bg-primary/40'}`}
            aria-hidden="true"
          />
        )}
        <span className={`relative grid place-items-center transition-transform duration-300 ${isChatOpen ? 'rotate-90' : ''}`}>
          {isChatOpen ? <X size={24} /> : <Sparkles size={24} />}
        </span>
      </button>

      {/* ── Chat panel (compact popup anchored directly above the AI button) ── */}
      <div
        id="manoj-ai-chat"
        role="dialog"
        aria-label="Manoj AI chat"
        aria-hidden={!isChatOpen}
        className={`absolute bottom-[calc(100%_+_12px)] right-0 z-[60] flex origin-bottom-right flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl transition-all duration-300 ease-out w-[calc(100vw_-_28px)] max-w-none h-[75dvh] max-h-[calc(100dvh_-_10rem)] md:h-[600px] md:max-h-[calc(100dvh_-_120px)] md:w-[360px] md:max-w-[380px] ${
          isChatOpen ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible pointer-events-none translate-y-3 scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-tight text-foreground">Manoj AI</p>
            <p className="truncate text-[11px] font-medium text-muted-foreground">Your Manoj Mobiles Assistant</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden="true" />
            Online
          </span>
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            aria-label="Close Manoj AI chat"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages (scrollable · newest stays visible) */}
        <div
          ref={scrollRef}
          aria-live="polite"
          className="scrollbar-hide flex-1 space-y-4 overflow-y-auto overscroll-contain bg-muted/20 px-4 py-4"
        >
          {messages.map((message, index) => (
            <div key={message.id}>
              {message.role === 'user' ? <UserMessage message={message} /> : <AIMessage message={message} />}
              {index === 0 && message.role === 'assistant' && (
                <div className="mt-3">
                  <QuickActions actions={QUICK_ACTIONS} onAction={prompt => void handleSend(prompt)} disabled={isTyping} />
                </div>
              )}
            </div>
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={event => {
                setInput(event.target.value)
                autoResize()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Manoj AI anything..."
              aria-label="Message Manoj AI"
              className="max-h-28 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-150 hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <SendHorizonal size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
