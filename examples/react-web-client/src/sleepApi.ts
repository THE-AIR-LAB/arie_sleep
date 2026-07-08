// Thin client for the headless Sleep Therapist API.
//
// Every request carries the Clerk session token as a Bearer header — that is how
// a cross-origin browser app authenticates without a cookie. `getToken` comes
// from Clerk's `useAuth()` hook (see App.tsx).

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type ChatMessage = {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type GetToken = () => Promise<string | null>

async function authedFetch(
  getToken: GetToken,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`)
  }
  return res
}

/** Create a new sleep conversation. Returns its id. */
export async function startSleepSession(
  getToken: GetToken,
  title = 'Sleep chat'
): Promise<string> {
  const res = await authedFetch(getToken, '/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ topic: 'sleep', title }),
  })
  const { id } = (await res.json()) as { id: string }
  return id
}

/**
 * Send a user message and get the assistant's reply text.
 * `stage` selects the model: 'base' (stateful runtime) or 'ft-1' (fine-tuned).
 */
export async function sendSleepMessage(
  getToken: GetToken,
  conversationId: string,
  userMessage: string,
  stage: 'base' | 'ft-1' = 'base'
): Promise<string> {
  const res = await authedFetch(getToken, `/api/chat/sleep/${stage}`, {
    method: 'POST',
    body: JSON.stringify({ conversationId, userMessage }),
  })
  // The chat route returns plain text (the assistant reply).
  return res.text()
}

/** Load full message history for a conversation. */
export async function loadSleepHistory(
  getToken: GetToken,
  conversationId: string
): Promise<ChatMessage[]> {
  const res = await authedFetch(
    getToken,
    `/api/conversations/${conversationId}/messages`
  )
  const { messages } = (await res.json()) as { messages: ChatMessage[] }
  return messages
}
