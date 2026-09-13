import type { AIResponse } from './types'

export async function sendMessageToAI(userMessage: string, chatId: string): Promise<AIResponse> {
  try {
    const res = await fetch('/api/public/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, chatId }),
    })
    
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      const backendMsg = errorBody?.message || 'AI request failed'
      console.error(`AI request failed — status ${res.status}`, backendMsg)
      throw new Error(backendMsg)
    }
    
    const json = await res.json()
    if (!json.success) {
      throw new Error(json.message || 'AI request failed')
    }
    
    return {
      message: json.data.message
    }
  } catch (error) {
    console.error('Failed to send message to AI:', error)
    return {
      message: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
    }
  }
}
