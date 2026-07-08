import { useState } from 'react'
import {
  useAuth,
  SignIn,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react'
import {
  startSleepSession,
  sendSleepMessage,
  type ChatMessage,
} from './sleepApi'

export function App() {
  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Sleep Therapist — headless API test</h1>
      <SignedOut>
        <p>Sign in with the same Clerk instance as the sleep-therapist app.</p>
        <SignIn />
      </SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <UserButton />
        </div>
        <Chat />
      </SignedIn>
    </div>
  )
}

function Chat() {
  const { getToken } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ensureSession(): Promise<string> {
    if (conversationId) return conversationId
    const id = await startSleepSession(getToken)
    setConversationId(id)
    return id
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    try {
      const id = await ensureSession()
      const reply = await sendSleepMessage(getToken, id, text)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p style={{ color: '#666', fontSize: 13 }}>
        Conversation: {conversationId ?? '(none yet — created on first message)'}
      </p>
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 12,
          minHeight: 240,
          marginBottom: 12,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#999' }}>Say something about your sleep…</p>
        )}
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.role === 'user' ? 'You' : 'Therapist'}:</strong> {m.content}
          </p>
        ))}
        {busy && <p style={{ color: '#999' }}>…thinking</p>}
      </div>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          value={input}
          placeholder="I keep waking up at 3am…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={busy}
        />
        <button onClick={handleSend} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}
