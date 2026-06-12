import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import {
  SendHorizontal, Sparkles, CircleUserRound, Bot,
  SquarePen, MessageSquare, Trash2, PanelLeftClose,
  PanelLeftOpen, GraduationCap, X, ArrowRight, ArrowLeft,
  BookOpen, ChevronDown, ThumbsUp, ThumbsDown, RefreshCw,
  ChevronLeft, ChevronRight, Download, FileText
} from 'lucide-react'

const API = 'http://localhost:8000'
const USER_ID = 1
const TOUR_KEY = 'astra_tour_done'
const PASSAGE_DELIMITER = '||PASSAGE||'

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
  text: 'Ask me anything about CIS Controls v8.',
  versions: null,
  activeVersionIndex: 0,
})

// ─── Parse context string into passages ──────────────────────────────────────
function parsePassages(contextStr) {
  if (!contextStr) return []
  if (contextStr.includes(PASSAGE_DELIMITER)) {
    return contextStr.split(PASSAGE_DELIMITER).map(p => p.trim()).filter(Boolean)
  }
  const legacyParts = contextStr.split(/(?=Passage\s+\d+:\s*)/).map(p => p.trim()).filter(Boolean)
  if (legacyParts.length > 0) return legacyParts
  return contextStr.split('\n').filter(p => p.trim())
}

// ─── Tour step definitions ────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    target: 'header-brand',
    placement: 'bottom',
    title: 'Welcome to Astra',
    body: 'Your AI assistant for CIS Controls v8. Ask questions, explore controls, and get cited answers drawn straight from the framework.',
  },
  {
    target: 'sidebar-toggle',
    placement: 'right',
    title: 'Collapse the sidebar',
    body: 'Short on screen space? Collapse the sidebar to a slim icon rail and expand it again whenever you need it.',
  },
  {
    target: 'sidebar-new-chat',
    placement: 'right',
    title: 'Start a new chat',
    body: 'Each conversation is saved automatically. Start fresh here whenever you want to explore a new topic.',
  },
  {
    target: 'sidebar-chat-list',
    placement: 'right',
    title: 'Your chat history',
    body: 'All your past conversations live here. Click any one to pick up where you left off, or hover to delete it.',
  },
  {
    target: 'message-input',
    placement: 'top',
    title: 'Ask your question',
    body: 'Type a question about any CIS Control, safeguard, or implementation group. Press Enter or click Send — Shift+Enter adds a new line.',
  },
  {
    target: 'send-button',
    placement: 'top',
    title: 'Send & stream',
    body: 'Astra streams its answer live. Click "Show Context" below any reply to expand individual source passages one by one.',
  },
  {
    target: 'replay-tour-btn',
    placement: 'bottom',
    title: 'Replay this tour',
    body: "You can rewatch this walkthrough any time using the Tour button in the header. That's everything — enjoy using Astra!",
  },
]

// ─── Spotlight / Tour overlay ─────────────────────────────────────────────────
function TourOverlay({ step, total, onNext, onPrev, onClose }) {
  const [rect, setRect] = useState(null)
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  const tooltipRef = useRef(null)

  const measureTarget = useCallback(() => {
    const el = document.querySelector(`[data-tour="${TOUR_STEPS[step].target}"]`)
    if (el) {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    } else {
      setRect(null)
    }
    setDims({ w: window.innerWidth, h: window.innerHeight })
  }, [step])

  useEffect(() => {
    measureTarget()
    const t = setTimeout(measureTarget, 80)
    window.addEventListener('resize', measureTarget)
    return () => { clearTimeout(t); window.removeEventListener('resize', measureTarget) }
  }, [measureTarget])

  const PAD = 10
  const info = TOUR_STEPS[step]

  const getTooltipStyle = () => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
    const TW = 320
    const { placement } = info
    const styles = {}
    if (placement === 'bottom') {
      styles.top = rect.top + rect.height + PAD + 12
      styles.left = Math.max(8, Math.min(rect.left + rect.width / 2 - TW / 2, dims.w - TW - 8))
    } else if (placement === 'top') {
      styles.top = rect.top - PAD - 160
      styles.left = Math.max(8, Math.min(rect.left + rect.width / 2 - TW / 2, dims.w - TW - 8))
    } else if (placement === 'right') {
      styles.top = rect.top + rect.height / 2 - 80
      styles.left = rect.left + rect.width + PAD + 12
    } else if (placement === 'left') {
      styles.top = rect.top + rect.height / 2 - 80
      styles.left = rect.left - TW - PAD - 12
    }
    if (styles.top !== undefined) {
      styles.top = Math.max(8, Math.min(styles.top, dims.h - 200))
    }
    return { position: 'fixed', width: TW, zIndex: 10001, ...styles }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
        onClick={onClose}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - PAD} y={rect.top - PAD}
                width={rect.width + PAD * 2} height={rect.height + PAD * 2}
                rx="14" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2,6,23,0.62)" mask="url(#spotlight-mask)" />
      </svg>

      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 14,
          border: '2px solid rgba(52,211,153,0.8)',
          boxShadow: '0 0 0 4px rgba(52,211,153,0.15)',
          pointerEvents: 'none',
          transition: 'all 0.25s ease',
        }} />
      )}

      <div ref={tooltipRef} style={{ ...getTooltipStyle(), pointerEvents: 'auto', transition: 'top 0.25s ease, left 0.25s ease' }}>
        <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 25px 60px -12px rgba(2,6,23,0.45), 0 0 0 1px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '14px 16px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.9)', marginBottom: 3 }}>
                Step {step + 1} of {total}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white', lineHeight: 1.3 }}>{info.title}</div>
            </div>
            <button onClick={onClose} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ padding: '14px 16px', fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>{info.body}</div>
          <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 9, background: i === step ? '#10b981' : '#cbd5e1', transition: 'all 0.2s ease' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {step > 0 && (
                <button onClick={onPrev} style={{ height: 32, paddingInline: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={12} /> Back
                </button>
              )}
              <button onClick={step === total - 1 ? onClose : onNext} style={{ height: 32, paddingInline: 14, borderRadius: 10, border: 'none', background: step === total - 1 ? '#10b981' : '#0f172a', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                {step === total - 1 ? 'Done' : <>{`Next `}<ArrowRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
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
              <span key={i} className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-xs text-slate-400 italic">{label}</span>
        </div>
      </div>
    </article>
  )
}

function PassageRow({ number, text }) {
  const [open, setOpen] = useState(false)
  const cleanText = text.replace(/^Passage\s+\d+:\s*/i, '').trim()
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
          {number}
        </span>
        <span className="flex-1 truncate text-xs text-slate-600 font-medium">
          {cleanText.slice(0, 100)}{cleanText.length > 100 ? '…' : ''}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
          {cleanText}
        </div>
      )}
    </div>
  )
}

function ContextDropdown({ context }) {
  const [open, setOpen] = useState(false)
  if (!context) return null
  const passages = parsePassages(context)
  if (passages.length === 0) return null
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span>
          {open ? 'Hide' : 'Show'} context
          <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            {passages.length}
          </span>
        </span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {passages.map((p, i) => (
            <PassageRow key={i} number={i + 1} text={p} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
const NEGATIVE_REASONS = [
  'Inaccurate information',
  'Incomplete answer',
  'Misunderstood the question',
  'Outdated information',
  'Other',
]

function FeedbackRow({ message }) {
  const [rating, setRating] = useState(null)
  const [showReasons, setShowReasons] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)
  const [otherText, setOtherText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!message.dbId || !message.queryDbId) return null

  const submitFeedback = async (finalRating, finalReason) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.chatId,
          query_message_id: message.queryDbId,
          answer_message_id: message.dbId,
          rating: finalRating,
          reason: finalReason ?? null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to submit feedback')
      }
      setSubmitted(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleThumbsUp = () => { setRating(1); setShowReasons(false); setSelectedReason(null); submitFeedback(1, null) }
  const handleThumbsDown = () => { setRating(0); setShowReasons(true); setSelectedReason(null) }
  const handleSelectReason = (reason) => {
    if (reason === 'Other') { setSelectedReason('Other'); return }
    setSelectedReason(reason); setShowReasons(false); submitFeedback(0, reason)
  }

  if (submitted) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
        {rating === 1 ? <ThumbsUp className="h-3 w-3 text-emerald-500" /> : <ThumbsDown className="h-3 w-3 text-red-400" />}
        <span>{rating === 1 ? 'Thanks for the feedback!' : `Noted: ${selectedReason}`}</span>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        <button onClick={handleThumbsUp} disabled={submitting} title="Good response"
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${rating === 1 ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}>
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleThumbsDown} disabled={submitting} title="Bad response"
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${rating === 0 ? 'bg-red-50 text-red-400' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}>
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
        {error && <span className="ml-2 text-[10px] text-red-400">{error}</span>}
      </div>
      {showReasons && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {NEGATIVE_REASONS.map(reason => (
            <button key={reason} onClick={() => handleSelectReason(reason)} disabled={submitting}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 ${selectedReason === reason ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600'}`}>
              {reason}
            </button>
          ))}
        </div>
      )}
      {selectedReason === 'Other' && (
        <div className="mt-2 flex gap-2">
          <input autoFocus type="text" value={otherText} onChange={e => setOtherText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && otherText.trim()) { setShowReasons(false); submitFeedback(0, otherText.trim()) } }}
            placeholder="Describe the issue…"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
          <button onClick={() => { if (!otherText.trim()) return; setShowReasons(false); submitFeedback(0, otherText.trim()) }}
            disabled={submitting || !otherText.trim()}
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-40">
            Submit
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Version navigator ────────────────────────────────────────────────────────
function VersionNav({ activeIndex, total, onPrev, onNext, onRegenerate, onCompare, isRegenerating }) {
  if (total <= 1 && !onRegenerate) return null
  return (
    <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
      {total > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={activeIndex === 0 || isRegenerating}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous version"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[2.5rem] text-center text-[11px] font-medium text-slate-500">
            {activeIndex + 1} / {total}
          </span>
          <button
            onClick={onNext}
            disabled={activeIndex === total - 1 || isRegenerating}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next version"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-1">
        {onCompare && total >= 2 && (
          <button
            onClick={onCompare}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-indigo-500 transition-colors hover:bg-indigo-50"
            title="Compare versions side by side"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Compare
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Regenerate response"
          >
            <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Side-by-Side Comparison View ────────────────────────────────────────────
function ComparisonView({ message, versions, onClose, onSelectVersion, onRegenerateVersion }) {
  const [leftIdx, setLeftIdx] = useState(0)
  const [rightIdx, setRightIdx] = useState(Math.min(1, versions.length - 1))
  const [showLeftMenu, setShowLeftMenu] = useState(false)
  const [showRightMenu, setShowRightMenu] = useState(false)

  const totalVersions = versions.length

  const VersionSelector = ({ currentIdx, onSelect, showMenu, setShowMenu }) => (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        Version {currentIdx + 1}
        <ChevronDown className="h-3 w-3" />
      </button>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 z-20 min-w-[120px] rounded-lg border border-slate-200 bg-white shadow-lg">
          {Array.from({ length: totalVersions }).map((_, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); setShowMenu(false) }}
              className={`block w-full px-3 py-2 text-left text-xs hover:bg-slate-50 ${
                i === currentIdx ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600'
              }`}
            >
              Version {i + 1}
              {i === currentIdx && ' ✓'}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Safely get text for a version, falling back to "No content"
  const getVersionText = (idx) => versions[idx]?.text || 'No content'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Compare Responses
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Left Panel */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <VersionSelector
                currentIdx={leftIdx}
                onSelect={(idx) => { setLeftIdx(idx); setShowLeftMenu(false) }}
                showMenu={showLeftMenu}
                setShowMenu={setShowLeftMenu}
              />
              <button
                onClick={() => onSelectVersion(message.id, leftIdx)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Use this version as active"
              >
                Use this →
              </button>
            </div>
            <div className="p-4 prose prose-sm max-w-none flex-1">
              <ReactMarkdown>{getVersionText(leftIdx)}</ReactMarkdown>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
              <button
                onClick={() => onRegenerateVersion(message.id, leftIdx)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate this version
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <VersionSelector
                currentIdx={rightIdx}
                onSelect={(idx) => { setRightIdx(idx); setShowRightMenu(false) }}
                showMenu={showRightMenu}
                setShowMenu={setShowRightMenu}
              />
              <button
                onClick={() => onSelectVersion(message.id, rightIdx)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Use this →
              </button>
            </div>
            <div className="p-4 prose prose-sm max-w-none flex-1">
              <ReactMarkdown>{getVersionText(rightIdx)}</ReactMarkdown>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
              <button
                onClick={() => onRegenerateVersion(message.id, rightIdx)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate this version
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Message ──────────────────────────────────────────────────────────────────
function Message({ message, onVersionChange, onRegenerate, onCompare, isRegenerating, isAnyStreaming }) {
  const isUser = message.role === 'user'

  const versions = message.versions
  const activeIdx = message.activeVersionIndex ?? 0
  const activeVersion = versions ? versions[activeIdx] : null

  // Display text: prefer active version's text, otherwise fallback to message.text
  const displayText = (activeVersion?.text) || message.text || ''
  const displayContext = (activeVersion?.context) || message.context
  const feedbackMsg = activeVersion ? { ...message, ...activeVersion } : message

  return (
    <article className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
      )}
      <div className={`max-w-[min(42rem,85%)] rounded-3xl border px-4 py-3 shadow-sm ${
        isUser ? 'border-slate-200 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800'
      }`}>
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] opacity-70">
          <span>{message.name}</span><span>•</span><span>{message.time}</span>
        </div>
        {isUser ? (
          <p className="text-sm leading-6 whitespace-pre-wrap">{message.text}</p>
        ) : (
          <div>
            <div className="prose prose-sm max-w-none prose-p:leading-6 prose-p:my-1 prose-li:my-0 prose-headings:my-2">
              <ReactMarkdown>{displayText}</ReactMarkdown>
            </div>
            <ContextDropdown context={displayContext} />
            <FeedbackRow message={feedbackMsg} />
            {message.id !== 'welcome' && !isAnyStreaming && (
              <VersionNav
                activeIndex={activeIdx}
                total={versions ? versions.length : 1}
                onPrev={() => onVersionChange(message.id, activeIdx - 1)}
                onNext={() => onVersionChange(message.id, activeIdx + 1)}
                onRegenerate={() => onRegenerate(message.id)}
                onCompare={versions && versions.length >= 2 ? () => onCompare(message.id, versions, message.text) : null}
                isRegenerating={isRegenerating}
              />
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
          <CircleUserRound className="h-5 w-5" />
        </div>
      )}
    </article>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, isLoadingChats, collapsed, onToggleCollapse }) {
  return (
    <aside className={`flex shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.5)] backdrop-blur transition-all duration-300 overflow-hidden ${
      collapsed ? 'w-14 p-2' : 'w-64 p-3'
    }`}>
      <div className={`flex items-center mb-2 ${collapsed ? 'justify-center' : 'justify-between px-2 py-1'}`}>
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chats</span>
        )}
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col gap-2' : ''}`}>
          {!collapsed && (
            <button data-tour="sidebar-new-chat" onClick={onNewChat}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" title="New chat">
              <SquarePen className="h-4 w-4" />
            </button>
          )}
          <button data-tour="sidebar-toggle" onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="flex flex-col items-center gap-2 mt-1">
          <button onClick={onNewChat} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" title="New chat">
            <SquarePen className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <nav data-tour="sidebar-chat-list" className="flex flex-1 flex-col gap-1 overflow-y-auto min-h-0">
            {isLoadingChats ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">Loading chats...</p>
            ) : chats.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">No chats yet</p>
            ) : (
              chats.map(chat => (
                <div key={chat.id} className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                  chat.id === activeChatId ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}>
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <button onClick={() => onSelectChat(chat.id)} className="flex-1 truncate text-left">{chat.chat_title}</button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id) }}
                    className={`shrink-0 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      chat.id === activeChatId ? 'hover:bg-white/20 text-white' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                    }`} title="Delete chat">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>
          <div className="border-t border-slate-200/80 pt-2 mt-2 shrink-0">
            <button onClick={onNewChat} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              <SquarePen className="h-4 w-4" />
              New Chat
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function buildExportMessages(messages) {
  return messages.filter(m => m.id !== 'welcome' && m.role !== undefined)
}

function exportAsMarkdown(messages, chatTitle) {
  const lines = []
  lines.push(`# ${chatTitle || 'Astra Chat Export'}`)
  lines.push(`*Exported on ${new Date().toLocaleString()}*`)
  lines.push('')

  buildExportMessages(messages).forEach(m => {
    const activeVersion = m.versions ? m.versions[m.activeVersionIndex ?? 0] : null
    const text = activeVersion?.text || m.text
    if (m.role === 'user') {
      lines.push(`## You — ${m.time}`)
      lines.push(text)
    } else {
      lines.push(`## Astra — ${m.time}`)
      lines.push(text)
    }
    lines.push('')
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${chatTitle || 'astra-chat'}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function exportAsPDF(messages, chatTitle) {
  const printWindow = window.open('', '_blank')
  const rows = buildExportMessages(messages).map(m => {
    const activeVersion = m.versions ? m.versions[m.activeVersionIndex ?? 0] : null
    const text = (activeVersion?.text || m.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>')
    const isUser = m.role === 'user'
    return `
      <div class="msg ${isUser ? 'user' : 'assistant'}">
        <div class="meta">${isUser ? 'You' : 'Astra'} · ${m.time}</div>
        <div class="text">${html}</div>
      </div>`
  }).join('')

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${chatTitle || 'Astra Chat'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #1e293b; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #94a3b8; margin-bottom: 32px; }
    .msg { margin-bottom: 24px; }
    .meta { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8; margin-bottom: 6px; }
    .user .text { background: #0f172a; color: white; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.6; display: inline-block; max-width: 80%; }
    .assistant .text { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.6; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    h2, h3 { margin: 8px 0 4px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${chatTitle || 'Astra Chat Export'}</h1>
  <div class="subtitle">Exported on ${new Date().toLocaleString()}</div>
  ${rows}
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close() }<\/script>
</body>
</html>`)
  printWindow.document.close()
}

// ─── Export dropdown button (FIXED) ───────────────────────────────────────────
function ExportMenu({ messages, chatTitle, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Export chat"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
      {open && (
          <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl border border-slate-200 bg-white shadow-xl z-[100] overflow-visible">          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            Export as
          </div>
          <button
            onClick={() => { exportAsMarkdown(messages, chatTitle); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <FileText className="h-4 w-4 text-slate-400" />
            Markdown (.md)
          </button>
          <button
            onClick={() => { exportAsPDF(messages, chatTitle); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4 text-slate-400" />
            PDF
          </button>
        </div>
      )}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
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
  const [regeneratingMsgId, setRegeneratingMsgId] = useState(null)

  const [comparisonMode, setComparisonMode] = useState({
    active: false,
    messageId: null,
    versions: null,
    onSelectVersion: null,
  })

  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  const bottomRef = useRef(null)
  const tokenBufferRef = useRef('')
  const flushTimerRef = useRef(null)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setTourActive(true), 400)
    }
  }, [])

  const startTour = () => { setTourStep(0); setTourActive(true) }
  const endTour = () => { setTourActive(false); localStorage.setItem(TOUR_KEY, '1') }

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

  const mapApiMessage = (m) => {
    if (m.role === 'assistant' && m.versions && m.versions.length > 0) {
      const activeIdx = m.active_version_index ?? m.versions.length - 1
      const active = m.versions[activeIdx]
      return {
        id: m.versions[0].id,
        role: 'assistant',
        name: 'Astra',
        time: formatTime(m.created_at),
        text: active.content,
        context: null,
        versions: m.versions.map(v => ({
          id: v.id,
          text: v.content,
          context: null,
          dbId: v.id,
          queryDbId: null,
          chatId: m.chat_id,
        })),
        activeVersionIndex: activeIdx,
        dbId: active.id,
        queryDbId: null,
        chatId: m.chat_id,
      }
    }
    return {
      id: m.id,
      role: m.role,
      name: m.role === 'user' ? 'You' : 'Astra',
      time: formatTime(m.created_at),
      text: m.content,
      context: null,
      versions: m.role === 'assistant' ? [{ id: m.id, text: m.content, context: null, dbId: m.id, queryDbId: null, chatId: m.chat_id }] : null,
      activeVersionIndex: 0,
    }
  }

  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId)
    setIsLoadingMessages(true)
    try {
      const res = await fetch(`${API}/api/chats/${chatId}/messages?user_id=${USER_ID}`)
      const data = await res.json()
      const mapped = data.map(mapApiMessage)
      setMessages(mapped.length > 0 ? mapped : [makeWelcomeMsg()])
    } catch (e) {
      console.error('Failed to load messages:', e)
      setMessages([makeWelcomeMsg()])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleNewChat = () => { setActiveChatId(null); setMessages([makeWelcomeMsg()]) }

  const handleDeleteChat = async (chatId) => {
    try {
      const res = await fetch(`${API}/api/chats/${chatId}/user/${USER_ID}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setChats(prev => prev.filter(c => c.id !== chatId))
      if (chatId === activeChatId) { setActiveChatId(null); setMessages([makeWelcomeMsg()]) }
    } catch (e) {
      console.error('Failed to delete chat:', e)
    }
  }

  const readStream = async (response, targetMsgId, isRegen = false) => {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let firstToken = true
    let eventType = null
    let firstTokenForRegen = isRegen

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.replace('event:', '').trim()
        } else if (line.startsWith('data:')) {
          const raw = line.slice('data: '.length)

          if (eventType === 'token') {
            let token
            try { token = JSON.parse(raw).t } catch { token = raw }
            if (firstToken) {
              if (!isRegen) setIsThinking(false)
              firstToken = false
            }
            tokenBufferRef.current += token
            clearTimeout(flushTimerRef.current)
            flushTimerRef.current = setTimeout(() => {
              const text = tokenBufferRef.current
              tokenBufferRef.current = ''
              setMessages(prev => prev.map(m => {
                if (m.id !== targetMsgId) return m
                if (isRegen) {
                  const newVersions = m.versions.map((v, i) =>
                    i === m.versions.length - 1 ? { ...v, text: v.text + text } : v
                  )
                  let newActiveIndex = m.activeVersionIndex
                  if (firstTokenForRegen) {
                    newActiveIndex = m.versions.length - 1
                    firstTokenForRegen = false
                  }
                  return { ...m, versions: newVersions, activeVersionIndex: newActiveIndex }
                } else {
                  const newVersions = m.versions
                    ? m.versions.map((v, i) => i === m.activeVersionIndex ? { ...v, text: v.text + text } : v)
                    : null
                  return { ...m, text: m.text + text, versions: newVersions }
                }
              }))
            }, 60)

          } else if (eventType === 'metadata') {
            try {
              const meta = JSON.parse(raw)
              if (meta.chat_id && !isRegen) {
                const backendChatId = meta.chat_id
                setActiveChatId(backendChatId)
                setChats(prev => {
                  if (prev.some(c => c.id === backendChatId)) return prev
                  const title = (meta.query || '').slice(0, 40) + ((meta.query || '').length > 40 ? '…' : '')
                  return [{ id: backendChatId, chat_title: title }, ...prev]
                })
              }

              setMessages(prev => prev.map(m => {
                if (m.id !== targetMsgId) return m
                if (isRegen) {
                  const newVersions = m.versions.map((v, i) =>
                    i === m.versions.length - 1
                      ? { ...v, dbId: meta.answer_message_id, queryDbId: meta.query_message_id, chatId: meta.chat_id, context: meta.Context ?? null }
                      : v
                  )
                  return {
                    ...m,
                    versions: newVersions,
                    dbId: meta.answer_message_id,
                    queryDbId: meta.query_message_id,
                    chatId: meta.chat_id,
                  }
                } else {
                  const updatedVersions = m.versions
                    ? m.versions.map((v, i) =>
                        i === m.activeVersionIndex
                          ? { ...v, dbId: meta.answer_message_id, queryDbId: meta.query_message_id, chatId: meta.chat_id, context: meta.Context ?? null }
                          : v
                      )
                    : null
                  return {
                    ...m,
                    context: meta.Context ?? null,
                    dbId: meta.answer_message_id,
                    queryDbId: meta.query_message_id,
                    chatId: meta.chat_id,
                    versions: updatedVersions,
                  }
                }
              }))
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
      setMessages(prev => prev.map(m => {
        if (m.id !== targetMsgId) return m
        if (isRegen) {
          const newVersions = m.versions.map((v, i) =>
            i === m.versions.length - 1 ? { ...v, text: v.text + remaining } : v
          )
          return { ...m, versions: newVersions }
        }
        return { ...m, text: m.text + remaining }
      }))
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      name: 'You',
      time: now(),
      text: input,
    }
    const queryText = input.trim()
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setIsThinking(true)

    const assistantId = Date.now() + 1
    const placeholder = {
      id: assistantId,
      role: 'assistant',
      name: 'Astra',
      time: now(),
      text: '',
      context: null,
      versions: [{ id: null, text: '', context: null, dbId: null, queryDbId: null, chatId: null }],
      activeVersionIndex: 0,
      dbId: null,
      queryDbId: null,
      chatId: null,
    }
    setMessages(prev => [...prev, placeholder])

    try {
      const response = await fetch(`${API}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, user_id: USER_ID, chat_id: activeChatId ?? null }),
      })
      await readStream(response, assistantId, false)
    } catch (e) {
      console.error('Send error:', e)
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
    }
  }

  const handleRegenerate = async (msgId) => {
    if (isStreaming || regeneratingMsgId) return

    const msgIndex = messages.findIndex(m => m.id === msgId)
    if (msgIndex < 0) return
    const msg = messages[msgIndex]
    let userMsg = null
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { userMsg = messages[i]; break }
    }
    if (!userMsg) return

    const rootAssistantId = msg.versions?.[0]?.dbId || msg.dbId
    const queryMsgDbId = msg.versions?.[0]?.queryDbId || msg.queryDbId

    if (!rootAssistantId || !activeChatId) {
      console.warn('Regenerate blocked: missing ids')
      return
    }

    setRegeneratingMsgId(msgId)
    setIsStreaming(true)

    // Add new empty version but keep active index unchanged
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const newVersion = { id: null, text: '', context: null, dbId: null, queryDbId: null, chatId: null }
      const newVersions = [...(m.versions || []), newVersion]
      return { ...m, versions: newVersions }  // activeVersionIndex unchanged
    }))

    try {
      const response = await fetch(`${API}/api/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: activeChatId,
          user_id: USER_ID,
          original_query: userMsg.text,
          query_message_id: queryMsgDbId ?? 0,
          root_assistant_message_id: rootAssistantId,
        }),
      })
      await readStream(response, msgId, true)
    } catch (e) {
      console.error('Regeneration error:', e)
      // Rollback: remove the empty version
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m
        const trimmed = (m.versions || []).slice(0, -1)
        return { ...m, versions: trimmed }
      }))
    } finally {
      setIsStreaming(false)
      setRegeneratingMsgId(null)
    }
  }

  const handleVersionChange = (msgId, newIndex) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const clamped = Math.max(0, Math.min(newIndex, (m.versions?.length ?? 1) - 1))
      const active = m.versions?.[clamped]
      // Safety: if active version has no text but message.text does, restore it
      if (active && !active.text && m.text) {
        const updatedVersions = [...m.versions]
        updatedVersions[clamped] = { ...active, text: m.text }
        return {
          ...m,
          versions: updatedVersions,
          activeVersionIndex: clamped,
          text: m.text,
          context: active?.context ?? m.context,
          dbId: active?.dbId ?? m.dbId,
          queryDbId: active?.queryDbId ?? m.queryDbId,
        }
      }
      return {
        ...m,
        activeVersionIndex: clamped,
        text: active?.text ?? m.text,
        context: active?.context ?? null,
        dbId: active?.dbId ?? m.dbId,
        queryDbId: active?.queryDbId ?? m.queryDbId,
      }
    }))
  }

  const handleOpenComparison = (msgId, versions, currentText) => {
    // Ensure each version has a non-empty text (fallback to currentText if empty)
    const enrichedVersions = versions.map((v, idx) => ({
      ...v,
      text: v.text || (idx === messages.find(m => m.id === msgId)?.activeVersionIndex ? currentText : '')
    }))
    setComparisonMode({
      active: true,
      messageId: msgId,
      versions: enrichedVersions,
      onSelectVersion: (id, idx) => {
        handleVersionChange(id, idx)
        setComparisonMode(prev => ({ ...prev, active: false, versions: null }))
      }
    })
  }

  const handleRegenerateVersionFromComparison = (msgId, versionIdx) => {
    setComparisonMode({ active: false, messageId: null, versions: null, onSelectVersion: null })
    handleRegenerate(msgId)
  }

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">

        <header data-tour="header-brand"
          className="relative z-50 flex shrink-0 items-center justify-between rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">CIS Controls</p>
              <h1 className="text-lg font-semibold text-slate-950">Astra</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu
              messages={messages}
              chatTitle={chats.find(c => c.id === activeChatId)?.chat_title}
              disabled={messages.length <= 1 || isStreaming}
            />
            <button data-tour="replay-tour-btn" onClick={startTour}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="Replay the guided tour">
              <GraduationCap className="h-3.5 w-3.5" />
              Tour
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-600">Online</span>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-3">
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

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
            <section className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-4">
                {isLoadingMessages ? (
                  <p className="text-center text-sm text-slate-400 italic pt-8">Loading messages...</p>
                ) : (
                  messages.map(m => (
                    <Message
                      key={m.id}
                      message={m}
                      onVersionChange={handleVersionChange}
                      onRegenerate={handleRegenerate}
                      onCompare={handleOpenComparison}
                      isRegenerating={regeneratingMsgId === m.id}
                      isAnyStreaming={isStreaming}
                    />
                  ))
                )}
                {isThinking && <ThinkingIndicator />}
                <div ref={bottomRef} />
              </div>
            </section>

            <footer className="shrink-0 border-t border-slate-200/80 bg-white/90 px-4 py-4 sm:px-6">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <textarea data-tour="message-input"
                    className="min-h-28 flex-1 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm resize-none focus:outline-none"
                    placeholder="Type a message or ask a question..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  />
                  <div className="flex items-center gap-2">
                    <Button data-tour="send-button" onClick={handleSend} disabled={isStreaming}
                      className="h-11 rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
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

      {tourActive && (
        <TourOverlay
          step={tourStep}
          total={TOUR_STEPS.length}
          onNext={() => setTourStep(s => s + 1)}
          onPrev={() => setTourStep(s => s - 1)}
          onClose={endTour}
        />
      )}

      {comparisonMode.active && comparisonMode.versions && (
        <ComparisonView
          message={{ id: comparisonMode.messageId }}
          versions={comparisonMode.versions}
          onClose={() => setComparisonMode({ active: false, messageId: null, versions: null, onSelectVersion: null })}
          onSelectVersion={(msgId, versionIdx) => {
            handleVersionChange(msgId, versionIdx)
            setComparisonMode({ active: false, messageId: null, versions: null, onSelectVersion: null })
          }}
          onRegenerateVersion={handleRegenerateVersionFromComparison}
        />
      )}
    </div>
  )
}

export default App