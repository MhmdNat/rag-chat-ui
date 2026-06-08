import { Button } from '@/components/ui/button'
import { SendHorizontal, Sparkles, CircleUserRound, Bot } from 'lucide-react'

const messages = [
  {
    id: 1,
    role: 'assistant',
    name: 'Astra',
    time: '09:41',
    text: 'I can help draft messages, summarize threads, and keep your conversations organized.',
  },
  {
    id: 2,
    role: 'user',
    name: 'You',
    time: '09:42',
    text: 'Please build the layout first so I can review spacing and hierarchy.',
  },
  {
    id: 3,
    role: 'assistant',
    name: 'Astra',
    time: '09:43',
    text: 'Perfect. I have the shell ready with a header, message viewport, and composer area.',
  },
]

function Message({ message }) {
  const isUser = message.role === 'user'

  return (
    <article
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
      ) : null}

      <div
        className={`max-w-[min(42rem,85%)] rounded-3xl border px-4 py-3 shadow-sm ${
          isUser
            ? 'border-slate-200 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-800'
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] opacity-70">
          <span>{message.name}</span>
          <span>•</span>
          <span>{message.time}</span>
        </div>
        <p className="text-sm leading-6">{message.text}</p>
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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-center justify-between rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Team Chat
              </p>
              <h1 className="text-lg font-semibold text-slate-950">
                Conversation Workspace
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-600">Live preview mode</span>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
          <section className="border-b border-slate-200/80 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Active thread
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Product launch planning
                </h2>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                  3 participants
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  Mock data
                </span>
              </div>
            </div>
          </section>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </div>
          </section>

          <footer className="border-t border-slate-200/80 bg-white/90 px-4 py-4 sm:px-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
                  Drafting
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
                  Attach files
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
                  AI assist
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-h-28 flex-1 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Type a message, describe a task, or paste a prompt here...
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-slate-200 bg-white px-4 text-slate-700"
                  >
                    Save draft
                  </Button>
                  <Button className="h-11 rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800">
                    <SendHorizontal className="mr-2 h-4 w-4" />
                    Send
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
