import type { AIResponse, ChatMessage } from './types'

export async function sendMessageToAI(userMessage: string, history: ChatMessage[]): Promise<AIResponse> {
  try {
    const res = await fetch('/api/public/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Pass the new message and the history to the backend
      body: JSON.stringify({ message: userMessage, history }),
    })
    
    if (!res.ok) {
      throw new Error('AI request failed')
    }
    
    return (await res.json()) as AIResponse
  } catch (error) {
    console.error('Failed to send message to AI:', error)
    return {
      message: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
    }
  }
}
