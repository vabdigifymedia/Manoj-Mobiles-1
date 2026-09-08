import type { AIResponse, ChatMessage } from './types'

/**
 * ═══════════════════════════════════════════════════════════════
 *  FUTURE AI API INTEGRATION POINT
 * ═══════════════════════════════════════════════════════════════
 *
 * This is the ONLY module the chatbot UI talks to. When the real AI
 * backend is ready (next phase), replace the placeholder body below
 * with an actual request — the rest of the UI stays untouched:
 *
 *   const res = await fetch('/api/ai/chat', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ message: userMessage, history }),
 *   })
 *   if (!res.ok) throw new Error('AI request failed')
 *   return (await res.json()) as AIResponse
 *
 * NOTE: No AI API, API key, or environment variable is added in this
 * phase — this file only returns a temporary frontend placeholder.
 */
export async function sendMessageToAI(userMessage: string, _history: ChatMessage[]): Promise<AIResponse> {
  // ── TEMPORARY PLACEHOLDER (frontend only) ──────────────────────
  // Simulates a short thinking delay so the typing indicator and
  // response flow can be demonstrated until the real API lands.
  await new Promise(resolve => setTimeout(resolve, 1400))

  return {
    message: "I'm getting ready to help you with that. 🤖",
  }
  // ── END TEMPORARY PLACEHOLDER ──────────────────────────────────
}
