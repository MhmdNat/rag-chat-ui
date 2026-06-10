import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { SendHorizontal, Sparkles, CircleUserRound, Bot, SquarePen, MessageSquare, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

const API = 'http://localhost:8000'
const USER_ID = 1

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const formatTime = (isoString) => {
  if (!isoString) return now()
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const makeWelcomeMsg = () => ({
  id: 'welcome',
  role: 'assistant',
  name: 'Astra',
  time: now(),
  text: 'Ask me anything about CIS Controls v8.'
})

function ThinkingIndicator() {
  const [label, setLabel] = useState('Reading relevant documents...')

  useEffect(() => {
    const timer = setTimeout(() => setLabel('Thinking...'), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <article className="flex items-start gap-3 justify-start">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
        <Bot className="h-5 w-5" />
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex gap-2 items-center">
          <div className="flex gap-1.5 items-center h-5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400 italic">{label}</span>
        </div>
      </div>
    </article>
  )
}

function ContextDropdown({ context }) {
  const [open, setOpen] = useState(false)

  if (!context) return null

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
      >
        {open ? 'Hide Context' : 'Show Context'}
      </button>

      {open && (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-3">
          {context
            .split('\n')
            .filter(p => p.trim())
            .map((p, i) => (
              <div key={i} className="border-b border-slate-200 pb-2 last:border-none">
                <div className="font-semibold text-slate-600 mb-1">
                  Passage {i + 1}:
                </div>
                <div className="whitespace-pre-wrap">
                  {p}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

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
          <p className="text-sm leading-6 whitespace-pre-wrap">{message.text}</p>
        ) : (
          <div>
            <div className="prose prose-sm max-w-none prose-p:leading-6 prose-p:my-1 prose-li:my-0 prose-headings:my-2">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
            <ContextDropdown context={message.context} />
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

function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, isLoadingChats, collapsed, onToggleCollapse }) {
  return (
    <aside
      className={`flex shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.5)] backdrop-blur transition-all duration-300 overflow-hidden ${
        collapsed ? 'w-14 p-2' : 'w-64 p-3'
      }`}
    >
      {/* Header row */}
      <div className={`flex items-center mb-2 ${collapsed ? 'justify-center' : 'justify-between px-2 py-1'}`}>
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chats</span>
        )}
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col gap-2' : ''}`}>
          {!collapsed && (
            <button
              onClick={onNewChat}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="New chat"
            >
              <SquarePen className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsed: icon-only buttons */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 mt-1">
          <button
            onClick={onNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="New chat"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Chat list — scrollable, fills available space */}
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto min-h-0">
            {isLoadingChats ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">Loading chats...</p>
            ) : chats.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">No chats yet</p>
            ) : (
              chats.map(chat => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                    chat.id === activeChatId
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className="flex-1 truncate text-left"
                  >
                    {chat.chat_title}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat(chat.id)
                    }}
                    className={`shrink-0 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      chat.id === activeChatId
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                    }`}
                    title="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>

          {/* Footer new-chat button */}
          <div className="border-t border-slate-200/80 pt-2 mt-2 shrink-0">
            <button
              onClick={onNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <SquarePen className="h-4 w-4" />
              New Chat
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

function App() {
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([makeWelcomeMsg()])
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const bottomRef = useRef(null)
  const tokenBufferRef = useRef('')
  const flushTimerRef = useRef(null)

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`${API}/api/chats?user_id=${USER_ID}`)
        const data = await res.json()
        setChats(data)
      } catch (e) {
        console.error('Failed to load chats:', e)
      } finally {
        setIsLoadingChats(false)
      }
    }
    fetchChats()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId)
    setIsLoadingMessages(true)
    try {
      const res = await fetch(`${API}/api/chats/${chatId}/messages?user_id=${USER_ID}`)
      const data = await res.json()
      const mapped = data.map(m => ({
        id: m.id,
        role: m.role,
        name: m.role === 'user' ? 'You' : 'Astra',
        time: formatTime(m.created_at),
        text: m.content,
      }))
      setMessages(mapped.length > 0 ? mapped : [makeWelcomeMsg()])
    } catch (e) {
      console.error('Failed to load messages:', e)
      setMessages([makeWelcomeMsg()])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleNewChat = () => {
    setActiveChatId(null)
    setMessages([makeWelcomeMsg()])
  }

  const handleDeleteChat = async (chatId) => {
    try {
      const res = await fetch(`${API}/api/chats/${chatId}/user/${USER_ID}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      setChats(prev => prev.filter(c => c.id !== chatId))
      if (chatId === activeChatId) {
        setActiveChatId(null)
        setMessages([makeWelcomeMsg()])
      }
    } catch (e) {
      console.error('Failed to delete chat:', e)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMsg = { id: Date.now(), role: 'user', name: 'You', time: now(), text: input }
    const firstUserText = input.trim()
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setIsThinking(true)

    const assistantId = Date.now() + 1

    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        name: 'Astra',
        time: now(),
        text: '',
        context: null,
      }
    ])

    const response = await fetch(`${API}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: input,
        user_id: USER_ID,
        chat_id: activeChatId ?? null,
      }),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let firstToken = true

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
          const raw = line.slice('data: '.length)

          if (eventType === 'token') {
            let data
            try { data = JSON.parse(raw).t } catch { data = raw }

            if (firstToken) {
              setIsThinking(false)
              firstToken = false
            }

            tokenBufferRef.current += data
            clearTimeout(flushTimerRef.current)
            flushTimerRef.current = setTimeout(() => {
              const text = tokenBufferRef.current
              tokenBufferRef.current = ''
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, text: m.text + text } : m
              ))
            }, 60)

          } else if (eventType === 'metadata') {
            try {
              const meta = JSON.parse(raw)
              if (meta.Context) {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, context: meta.Context }
                      : m
                  )
                )
              }
              console.log('metadata', meta)
              if (meta.chat_id) {
                const backendChatId = meta.chat_id
                if (!activeChatId) {
                  const title = firstUserText.length > 40
                    ? firstUserText.slice(0, 40) + '…'
                    : firstUserText
                  setChats(prev => {
                    if (prev.some(c => c.id === backendChatId)) return prev
                    return [{ id: backendChatId, chat_title: title }, ...prev]
                  })
                }
                setActiveChatId(backendChatId)
              }
            } catch { /* ignore */ }
          }

          eventType = null
        }
      }
    }

    clearTimeout(flushTimerRef.current)
    const remaining = tokenBufferRef.current
    tokenBufferRef.current = ''
    if (remaining) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, text: m.text + remaining } : m
      ))
    }
    setIsStreaming(false)
    setIsThinking(false)
  }

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
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

        {/* Body: sidebar + chat */}
        <div className="flex min-h-0 flex-1 gap-3">

          {/* Sidebar — fixed height, does not scroll itself */}
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            isLoadingChats={isLoadingChats}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          />

          {/* Main chat panel */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.5)] backdrop-blur">

            {/* Messages — only this scrolls */}
            <section className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-4">
                {isLoadingMessages ? (
                  <p className="text-center text-sm text-slate-400 italic pt-8">Loading messages...</p>
                ) : (
                  messages.map(m => <Message key={m.id} message={m} />)
                )}
                {isThinking && <ThinkingIndicator />}
                <div ref={bottomRef} />
              </div>
            </section>

            {/* Input — pinned to bottom, never scrolls away */}
            <footer className="shrink-0 border-t border-slate-200/80 bg-white/90 px-4 py-4 sm:px-6">
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
                      <SendHorizontal className="mr-2 h-4 w-4" />
                      {isStreaming ? 'Thinking...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App