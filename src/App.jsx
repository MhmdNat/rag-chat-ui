import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { SendHorizontal, Sparkles, CircleUserRound, Bot } from 'lucide-react'

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function Message({ message }) {
  const isUser = message.role === 'user'
  return (
    <article className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
      ) : null}
      <div className={`max-w-[min(42rem,85%)] rounded-3xl border px-4 py-3 shadow-sm ${
        isUser ? 'border-slate-200 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800'
      }`}>
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] opacity-70">
          <span>{message.name}</span>
          <span>•</span>
          <span>{message.time}</span>
        </div>
        {isUser ? (
          <p className="text-sm leading-6">{message.text}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:leading-6 prose-p:my-1 prose-li:my-0 prose-headings:my-2">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
          <CircleUserRound className="h-5 w-5" />
        </div>
      ) : null}
    </article>
  )
}

function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', name: 'Astra', time: '09:41', text: 'Ask me anything about CIS Controls v8.' }
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMsg = { id: Date.now(), role: 'user', name: 'You', time: now(), text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    const assistantId = Date.now() + 1
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', name: 'Astra', time: now(), text: '' }])

    const response = await fetch('http://localhost:8000/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input, top_k: 5, index: 'RAGDocs' }),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop()

      let eventType = null
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.replace('event:', '').trim()
        } else if (line.startsWith('data:')) {
          const data = line.replace('data:', '')
          if (eventType === 'token') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, text: m.text + data } : m
            ))
          } else if (eventType === 'metadata') {
            console.log('metadata', JSON.parse(data))
          }
          eventType = null
        }
      }
    }
    setIsStreaming(false)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-center justify-between rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">CIS Controls</p>
              <h1 className="text-lg font-semibold text-slate-950">Astra</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-600">Online</span>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4">
              {messages.map(m => <Message key={m.id} message={m} />)}
            </div>
          </section>

          <footer className="border-t border-slate-200/80 bg-white/90 px-4 py-4 sm:px-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  className="min-h-28 flex-1 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm resize-none focus:outline-none"
                  placeholder="Type a message or ask a question..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSend}
                    disabled={isStreaming}
                    className="h-11 rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SendHorizontal className="mr-2 h-4 w-4" /> Send
                  </Button>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App