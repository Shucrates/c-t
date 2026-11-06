import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Cat, Logo, type CatMood } from './Cat'
import { languages, plainText, translator, type LangCode, type StringKey } from './i18n'

/* -------------------------------------------------------------------------- */
/* Data (prototype: fake mailbox)                                              */
/* -------------------------------------------------------------------------- */

type Verdict = 'scam' | 'safe'

type Mail = {
  id: number
  sender: string
  address: string
  initials: string
  tone: string
  subject: string
  preview: string
  body: string[]
  time: string
  unread?: boolean
  verdict: Verdict
  reasons: StringKey[]
  simple: StringKey
  link?: { label: string; domain: string }
}

const MAILS: Mail[] = [
  {
    id: 1,
    sender: 'Account Security Team',
    address: 'security@acc0unt-verify.net',
    initials: 'AS',
    tone: 'tone-violet',
    subject: 'Your account will be locked today',
    preview: 'We detected an unusual sign-in. Confirm your identity within 24 hours or…',
    body: [
      'Dear Customer,',
      'We detected a new sign-in to your account from an unrecognised device. For your security, access to your account has been temporarily limited.',
      'Please confirm your identity within 24 hours to prevent your account from being permanently suspended.',
    ],
    time: '10:42',
    unread: true,
    verdict: 'scam',
    reasons: ['r_sender', 'r_link', 'r_rush'],
    simple: 'simple_scam_account',
    link: { label: 'Confirm my identity', domain: 'secure-check.info' },
  },
  {
    id: 2,
    sender: 'Maya Chen',
    address: 'maya.chen@mail.com',
    initials: 'MC',
    tone: 'tone-teal',
    subject: 'Notes from this morning',
    preview: 'Lovely to catch up today. Here are the notes and the dates we talked about.',
    body: [
      'Hi!',
      'Lovely to catch up this morning. Here are the dates we talked about: the book club moves to Thursdays from next month, and the coffee morning is on the 14th.',
      'See you soon,',
      'Maya',
    ],
    time: '09:18',
    unread: true,
    verdict: 'safe',
    reasons: ['r_ok_sender', 'r_ok_link'],
    simple: 'simple_safe',
  },
  {
    id: 3,
    sender: 'Parcel Track',
    address: 'notice@parcel-track-delivery.co',
    initials: 'PT',
    tone: 'tone-amber',
    subject: 'Your package is on hold',
    preview: 'A small customs charge of £1.99 is needed before we can deliver your parcel.',
    body: [
      'Hello,',
      'Your parcel is waiting at our depot. A customs charge of £1.99 must be paid before we can deliver it.',
      'If the charge is not paid within 48 hours, the parcel will be returned to the sender.',
    ],
    time: 'Yesterday',
    verdict: 'scam',
    reasons: ['r_money', 'r_link', 'r_rush'],
    simple: 'simple_scam_parcel',
    link: { label: 'Pay £1.99 now', domain: 'parcel-fee-pay.top' },
  },
  {
    id: 4,
    sender: 'Riverside Surgery',
    address: 'appointments@riversidesurgery.nhs.uk',
    initials: 'RS',
    tone: 'tone-sky',
    subject: 'Appointment reminder: Tuesday 10:30',
    preview: 'This is a reminder of your appointment with Dr Patel on Tuesday at 10:30.',
    body: [
      'Dear patient,',
      'This is a reminder of your appointment with Dr Patel on Tuesday at 10:30.',
      'If you cannot attend, please phone the surgery on the number printed on your appointment card.',
    ],
    time: 'Yesterday',
    verdict: 'safe',
    reasons: ['r_ok_sender', 'r_ok_link'],
    simple: 'simple_safe',
  },
  {
    id: 5,
    sender: 'Sam Reid',
    address: 'sam.reid@mail.com',
    initials: 'SR',
    tone: 'tone-rose',
    subject: 'Dinner on Friday?',
    preview: 'There’s a new place near the station I think you would like. Shall we try it?',
    body: ['Hello!', 'There’s a new place near the station I think you would like. Shall we try it on Friday at 7?', 'Sam'],
    time: 'Mon',
    verdict: 'safe',
    reasons: ['r_ok_sender', 'r_ok_link'],
    simple: 'simple_safe',
  },
]

/* -------------------------------------------------------------------------- */
/* Icons (one stroke family, 24px grid)                                        */
/* -------------------------------------------------------------------------- */

const ICONS: Record<string, ReactNode> = {
  back: <path d="m15 5-7 7 7 7" />,
  forward: <path d="m9 5 7 7-7 7" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  text: <><path d="M3 18 8 6l5 12M4.6 14h6.8" /><path d="M15 18l3.5-8.5L22 18M16 15.2h5" /></>,
  speaker: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />,
  contrast: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5Z" /></>,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  warning: <><path d="M12 4.5 3 19.5h18Z" /><path d="M12 10v4.2M12 16.8v.2" /></>,
  shield: <><path d="M12 3.5 5 6.2v5.3c0 4.3 2.9 7.4 7 9 4.1-1.6 7-4.7 7-9V6.2Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4.2-2 1.5a11 11 0 0 0 5.8 5.8l1.5-2 4.2 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />,
  send: <><path d="M20.5 3.5 10 14" /><path d="m20.5 3.5-6.5 17-4-6.5-6.5-4Z" /></>,
  folder: <><path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" /><path d="m10 11 4 4M14 11l-4 4" /></>,
  undo: <><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9.5a5 5 0 0 1 0 10H12" /></>,
  book: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" /></>,
  linkoff: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /><path d="m4 4 16 16" /></>,
  question: <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.5v.2" /></>,
  inbox: <><path d="M3.5 13.5 6 5.5h12l2.5 8V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z" /><path d="M3.5 13.5h5l1.2 2h4.6l1.2-2h5" /></>,
}

function Icon({ name, size = 24, className = '' }: { name: keyof typeof ICONS; size?: number; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                       */
/* -------------------------------------------------------------------------- */

function useSpeech(langCode: LangCode) {
  const [speaking, setSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported) return
      const synth = window.speechSynthesis
      synth.cancel()
      const lang = languages.find((l) => l.code === langCode) ?? languages[0]
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang.speech
      const prefix = lang.speech.slice(0, 2).toLowerCase()
      const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(prefix))
      if (voice) utterance.voice = voice
      utterance.rate = 0.9
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      setSpeaking(true)
      synth.speak(utterance)
    },
    [langCode, supported],
  )

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  return { speaking, speak, stop, supported }
}

/* -------------------------------------------------------------------------- */
/* Sheet (native <dialog>: focus trap + Escape for free)                       */
/* -------------------------------------------------------------------------- */

function Sheet({ open, title, onClose, closeLabel, children }: { open: boolean; title: string; onClose: () => void; closeLabel: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className="sheet-inner">
        <span className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id="sheet-title">{title}</h2>
          <button className="round-button" onClick={onClose} aria-label={closeLabel}>
            <Icon name="close" size={22} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Island: the c@t assistant, morphing like a Dynamic Island                   */
/* -------------------------------------------------------------------------- */

type IslandState = 'checking' | 'compact' | 'banner' | 'expanded'
type Step = 'simple' | 'questions' | 'actions'

function Island({
  state,
  children,
  onExpand,
  label,
}: {
  state: IslandState
  children: ReactNode
  onExpand: () => void
  label: string
}) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const inner = innerRef.current
    if (!inner) return
    const measure = () => setBox({ w: inner.offsetWidth, h: inner.offsetHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  const isCompact = state === 'compact'
  const isDialog = state === 'expanded'

  return (
    <div
      className="island"
      data-state={state}
      style={box ? { width: box.w, height: box.h } : undefined}
      role={isDialog ? 'dialog' : 'region'}
      aria-modal={isDialog || undefined}
      aria-label={label}
    >
      <div className="island-inner" ref={innerRef}>
        {isCompact ? (
          <button className="island-compact" onClick={onExpand} aria-expanded="false">
            {children}
          </button>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* App                                                                         */
/* -------------------------------------------------------------------------- */

type Toast = { id: number; message: string; note?: string; undo?: () => void }
const SIZES = [16, 19, 22]

export default function App() {
  // Comfort settings
  const [lang, setLang] = useState<LangCode>('en')
  const [sizeIndex, setSizeIndex] = useState(0)
  const [highContrast, setHighContrast] = useState(() => window.matchMedia?.('(prefers-contrast: more)').matches ?? false)
  const [sheet, setSheet] = useState<null | 'size' | 'language'>(null)
  const t = useMemo(() => translator(lang), [lang])
  const { speaking, speak, stop, supported: speechSupported } = useSpeech(lang)
  const langInfo = languages.find((l) => l.code === lang) ?? languages[0]

  // Mailbox
  const [folder, setFolder] = useState<'inbox' | 'scam'>('inbox')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [readIds, setReadIds] = useState<number[]>([])
  const [scamIds, setScamIds] = useState<number[]>([])
  const [safeIds, setSafeIds] = useState<number[]>([])
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [autoEmpty, setAutoEmpty] = useState(true)

  // Assistant
  const [island, setIsland] = useState<IslandState>('compact')
  const [step, setStep] = useState<Step>('simple')
  const [answers, setAnswers] = useState<boolean[]>([])
  const [learnOpen, setLearnOpen] = useState(false)
  const [summarySent, setSummarySent] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const islandHeading = useRef<HTMLHeadingElement>(null)

  const mail = MAILS.find((m) => m.id === selectedId) ?? null
  const verdictOf = (m: Mail): Verdict => (safeIds.includes(m.id) ? 'safe' : m.verdict)
  const verdict = mail ? verdictOf(mail) : 'safe'
  const userMarkedSafe = mail ? safeIds.includes(mail.id) : false

  // Apply comfort settings to the document
  useEffect(() => {
    const root = document.documentElement
    root.lang = lang === 'sga' ? 'en' : lang
    root.dir = langInfo.rtl ? 'rtl' : 'ltr'
    root.style.fontSize = `${SIZES[sizeIndex]}px`
    root.dataset.contrast = highContrast ? 'high' : 'normal'
    document.title = 'c@t'
  }, [lang, langInfo.rtl, sizeIndex, highContrast])

  // Toasts disappear after 8s (long enough to read and reach Undo)
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 8000)
    return () => window.clearTimeout(id)
  }, [toast])

  // Focus the assistant heading when it opens, so screen readers and keyboards follow
  useEffect(() => {
    if (island === 'banner' || island === 'expanded') islandHeading.current?.focus({ preventScroll: true })
  }, [island, step])

  // Escape collapses the assistant
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (island === 'expanded' || island === 'banner') && !sheet) setIsland('compact')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [island, sheet])

  const showToast = (message: string, extra?: Omit<Toast, 'id' | 'message'>) => setToast({ id: Date.now(), message, ...extra })

  const openMail = (id: number) => {
    stop()
    const target = MAILS.find((m) => m.id === id)!
    setSelectedId(id)
    setReadIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    setStep('simple')
    setAnswers([])
    setLearnOpen(false)
    setSummarySent(false)
    if (checkedIds.includes(id)) {
      setIsland(verdictOf(target) === 'scam' ? 'banner' : 'compact')
      return
    }
    setIsland('checking')
    window.setTimeout(() => {
      setCheckedIds((ids) => [...ids, id])
      setIsland((current) => (current === 'checking' ? (verdictOf(target) === 'scam' ? 'banner' : 'compact') : current))
    }, 1900)
  }

  const closeMail = () => {
    stop()
    setSelectedId(null)
  }

  const expand = (next: Step) => {
    stop()
    setStep(next)
    setIsland('expanded')
  }

  const moveToScam = () => {
    if (!mail) return
    const id = mail.id
    setScamIds((ids) => [...ids, id])
    setSafeIds((ids) => ids.filter((x) => x !== id))
    setIsland('compact')
    setSelectedId(null)
    showToast(t('movedToScam'), {
      undo: () => {
        setScamIds((ids) => ids.filter((x) => x !== id))
        setToast(null)
      },
    })
  }

  const markSafe = () => {
    if (!mail) return
    const id = mail.id
    setSafeIds((ids) => [...ids, id])
    setScamIds((ids) => ids.filter((x) => x !== id))
    setIsland('compact')
    showToast(t('markedSafe'), {
      undo: () => {
        setSafeIds((ids) => ids.filter((x) => x !== id))
        setToast(null)
      },
    })
  }

  // What the "Read aloud" button reads depends on what is on screen
  const screenText = () => {
    const say = (key: StringKey) => plainText(lang, key)
    if (mail && island === 'expanded') {
      if (step === 'simple') return [say(verdict === 'scam' ? 'likelyScam' : 'looksSafe'), say(mail.simple), ...mail.reasons.map(say)].join('. ')
      if (step === 'questions') return [say('q1'), say('q2'), say('q3')].join(' ')
      return [say('whatWouldYouLike'), say('askTrusted'), say('moveToScam'), say('undoFine')].join('. ')
    }
    if (mail && island === 'banner') return `${say('checkedThis')}. ${say(verdict === 'scam' ? 'likelyScam' : 'looksSafe')}.`
    if (mail) return [mail.subject, `${say('from')} ${mail.sender}`, ...mail.body].join('. ')
    return [say(folder === 'inbox' ? 'inbox' : 'scamFolder'), ...visibleMails.map((m) => `${m.sender}: ${m.subject}`)].join('. ')
  }

  const toggleRead = () => (speaking ? stop() : speak(screenText()))

  const visibleMails = MAILS.filter((m) => (folder === 'scam' ? scamIds.includes(m.id) : !scamIds.includes(m.id))).filter((m) => {
    const q = query.trim().toLowerCase()
    return !q || `${m.sender} ${m.subject} ${m.preview}`.toLowerCase().includes(q)
  })

  const catMood: CatMood = island === 'checking' ? 'thinking' : verdict === 'scam' ? 'alert' : 'happy'
  const questions: StringKey[] = ['q1', 'q2', 'q3']
  // Risky answers: not expecting it, not knowing the sender, being asked for money/passwords
  const riskyAnswers = answers.filter((a, i) => (i === 2 ? a : !a)).length

  /* ------------------------------ Island content ----------------------------- */

  const verdictLabel = verdict === 'scam' ? t('likelyScam') : t('looksSafe')

  const islandContent = (() => {
    if (!mail) return null
    if (island === 'checking')
      return (
        <div className="isl isl-checking" aria-live="polite">
          <Cat mood="thinking" size={52} />
          <div>
            <p className="isl-title">{t('checking')}</p>
            <p className="isl-sub">{t('checkingSub')}</p>
            <span className="isl-progress" aria-hidden="true"><span /></span>
          </div>
        </div>
      )

    if (island === 'compact')
      return (
        <>
          <Cat mood={catMood} size={34} />
          <span className={`isl-dot ${verdict}`} aria-hidden="true" />
          <span className="isl-compact-label">{verdictLabel}</span>
          <span className="visually-hidden">— {t('openAssistant')}</span>
        </>
      )

    if (island === 'banner')
      return (
        <div className="isl isl-banner" aria-live="polite">
          <div className="isl-row">
            <Cat mood={catMood} size={64} />
            <div className="isl-grow">
              <p className="isl-sub">{t('checkedThis')}</p>
              <h2 className={`isl-verdict ${verdict}`} tabIndex={-1} ref={islandHeading}>{verdictLabel}</h2>
            </div>
            <button className="isl-close" onClick={() => setIsland('compact')} aria-label={t('close')}>
              <Icon name="close" size={22} />
            </button>
          </div>
          <div className="isl-actions two">
            <button className="pill pill-light" onClick={() => expand('simple')}>{t('why')}</button>
            <button className="pill pill-dark" onClick={() => expand('questions')}>{t('askQuestions')}</button>
          </div>
        </div>
      )

    // Expanded
    const head = (title: string, back?: Step) => (
      <div className="isl-head">
        {back ? (
          <button className="isl-close" onClick={() => setStep(back)} aria-label={t('back')}>
            <Icon name="back" size={24} className="flip" />
          </button>
        ) : (
          <Cat mood={catMood} size={52} />
        )}
        <h2 className="isl-heading" tabIndex={-1} ref={islandHeading}>{title}</h2>
        <button className="isl-close" onClick={() => setIsland('compact')} aria-label={t('close')}>
          <Icon name="close" size={22} />
        </button>
      </div>
    )

    if (step === 'simple')
      return (
        <div className="isl isl-expanded" key="simple">
          {head(t('inSimpleWords'))}
          <p className={`isl-chip ${verdict}`}>
            <Icon name={verdict === 'scam' ? 'warning' : 'shield'} size={20} />
            {verdictLabel}
          </p>
          <label className="isl-field">
            <span>{t('language')}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as LangCode)}>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.native} — {l.english}</option>
              ))}
            </select>
          </label>
          <p className="isl-explain">{t(mail.simple)}</p>
          <h3 className="isl-subhead">{t('reasons')}</h3>
          <ul className="isl-reasons">
            {mail.reasons.map((r) => (
              <li key={r} className={verdict}>
                <Icon name={verdict === 'scam' ? 'warning' : 'check'} size={20} />
                <span>{t(r)}</span>
              </li>
            ))}
          </ul>
          <div className="isl-actions">
            <button className="pill pill-dark" onClick={() => speak(plainText(lang, mail.simple))}>
              <Icon name="speaker" size={22} />
              {t('readToMe')}
            </button>
            <button className="pill pill-light" onClick={() => setStep('actions')}>
              {t('whatToDo')}
              <Icon name="forward" size={22} className="flip" />
            </button>
          </div>
        </div>
      )

    if (step === 'questions') {
      const index = answers.length
      const finished = index >= questions.length
      return (
        <div className="isl isl-expanded" key="questions">
          {head(t('q_title'))}
          {!finished ? (
            <>
              <p className="isl-progress-text" aria-live="polite">{index + 1} / {questions.length}</p>
              <p className="isl-question" key={index}>{t(questions[index])}</p>
              <div className="isl-actions two">
                <button className="pill pill-light big" onClick={() => setAnswers([...answers, true])}>
                  <Icon name="check" size={24} />
                  {t('yes')}
                </button>
                <button className="pill pill-dark big" onClick={() => setAnswers([...answers, false])}>
                  <Icon name="close" size={24} />
                  {t('no')}
                </button>
              </div>
              {index > 0 && (
                <button className="pill pill-ghost" onClick={() => setAnswers(answers.slice(0, -1))}>
                  <Icon name="undo" size={22} />
                  {t('back')}
                </button>
              )}
            </>
          ) : (
            <>
              <p className={`isl-chip ${riskyAnswers > 0 || verdict === 'scam' ? 'scam' : 'safe'}`}>
                <Icon name={riskyAnswers > 0 || verdict === 'scam' ? 'warning' : 'shield'} size={20} />
                {riskyAnswers > 0 || verdict === 'scam' ? t('likelyScam') : t('looksSafe')}
              </p>
              <p className="isl-explain">{riskyAnswers > 0 || verdict === 'scam' ? t('q_result_scam') : t('q_result_safe')}</p>
              <div className="isl-actions">
                <button className="pill pill-light" onClick={() => setStep('actions')}>
                  {t('whatToDo')}
                  <Icon name="forward" size={22} className="flip" />
                </button>
                <button className="pill pill-dark" onClick={() => setStep('simple')}>{t('why')}</button>
              </div>
            </>
          )}
        </div>
      )
    }

    return (
      <div className="isl isl-expanded" key="actions">
        {head(t('whatWouldYouLike'), 'simple')}

        <section className="isl-group" aria-labelledby="g-trust">
          <h3 id="g-trust" className="isl-subhead">{t('askTrusted')}</h3>
          <div className="contact">
            <span className="contact-avatar" aria-hidden="true">A</span>
            <div>
              <strong>{t('trustedName')}</strong>
              <span>{t('trustedRole')}</span>
            </div>
          </div>
          <div className="isl-actions two">
            <button className="pill pill-dark" onClick={() => showToast(`${t('calling')} ${t('trustedName')}…`, { note: t('simulated') })}>
              <Icon name="phone" size={22} />
              {t('call')}
            </button>
            <button
              className="pill pill-light"
              onClick={() => {
                setSummarySent(true)
                showToast(`${t('summarySent')} ${t('trustedName')}.`, { note: t('simulated') })
              }}
            >
              <Icon name={summarySent ? 'check' : 'send'} size={22} />
              {summarySent ? `${t('summarySent')} ${t('trustedName')}` : t('sendSummary')}
            </button>
          </div>
        </section>

        <section className="isl-group" aria-labelledby="g-rid">
          <h3 id="g-rid" className="isl-subhead">{t('getRidOfIt')}</h3>
          <button className="pill pill-danger wide" onClick={moveToScam}>
            <Icon name="folder" size={22} />
            {t('moveToScam')}
          </button>
          <label className="switch-row">
            <span>{t('emptyAfter30')}</span>
            <input type="checkbox" role="switch" checked={autoEmpty} onChange={(e) => setAutoEmpty(e.target.checked)} />
          </label>
        </section>

        <div className="isl-links">
          <button className="pill pill-ghost wide" aria-expanded={learnOpen} onClick={() => setLearnOpen(!learnOpen)}>
            <Icon name="book" size={22} />
            {t('learnScam')}
          </button>
          {learnOpen && (
            <ol className="learn">
              <li>{t('learn_account_1')}</li>
              <li>{t('learn_account_2')}</li>
              <li>{t('learn_account_3')}</li>
            </ol>
          )}
          {verdict === 'scam' && !userMarkedSafe && (
            <button className="pill pill-ghost wide" onClick={markSafe}>
              <Icon name="undo" size={22} />
              {t('undoFine')}
            </button>
          )}
        </div>
      </div>
    )
  })()

  /* --------------------------------- Render --------------------------------- */

  return (
    <div className="app" data-mail-open={mail ? 'true' : 'false'}>
      {/* Mailbox list */}
      <section className="pane pane-list" aria-label={t('inbox')}>
        <header className="list-top">
          <Logo />
          <span className="me" aria-hidden="true">JR</span>
        </header>
        <h1 className="large-title">{folder === 'inbox' ? t('inbox') : t('scamFolder')}</h1>
        <label className="search">
          <Icon name="search" size={22} />
          <input type="search" placeholder={t('search')} aria-label={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="segmented" role="tablist" aria-label={t('inbox')}>
          <button role="tab" aria-selected={folder === 'inbox'} onClick={() => setFolder('inbox')}>
            <Icon name="inbox" size={20} />
            {t('inbox')}
          </button>
          <button role="tab" aria-selected={folder === 'scam'} onClick={() => setFolder('scam')}>
            <Icon name="folder" size={20} />
            {t('scamFolder')}
            {scamIds.length > 0 && <span className="count">{scamIds.length}</span>}
          </button>
        </div>

        <ul className="mail-list">
          {visibleMails.map((m) => {
            const unread = m.unread && !readIds.includes(m.id)
            const v = verdictOf(m)
            return (
              <li key={m.id}>
                <button className={`mail-row ${selectedId === m.id ? 'active' : ''}`} onClick={() => openMail(m.id)} aria-current={selectedId === m.id || undefined}>
                  <span className={`avatar ${m.tone}`} aria-hidden="true">{m.initials}</span>
                  <span className="mail-text">
                    <span className="mail-meta">
                      <strong className={unread ? 'unread' : ''}>{m.sender}</strong>
                      <time>{m.time}</time>
                    </span>
                    <span className="mail-subject">{m.subject}</span>
                    <span className="mail-preview">{m.preview}</span>
                    {v === 'scam' && folder === 'inbox' && (
                      <span className="tag tag-scam"><Icon name="warning" size={16} />{t('likelyScam')}</span>
                    )}
                  </span>
                  {unread && <span className="unread-dot"><span className="visually-hidden">Unread</span></span>}
                </button>
              </li>
            )
          })}
          {visibleMails.length === 0 && (
            <li className="empty">
              <Cat mood="sleep" size={96} />
              <p>{query ? t('noResults') : t('scamEmpty')}</p>
            </li>
          )}
        </ul>
      </section>

      {/* Reader */}
      <section className="pane pane-reader" aria-label={mail ? mail.subject : 'c@t'}>
        {mail ? (
          <>
            <div className="reader-top">
              <button className="round-button reader-back" onClick={closeMail} aria-label={t('back')}>
                <Icon name="back" size={26} className="flip" />
              </button>
            </div>

            {island === 'expanded' && <div className="island-scrim" onClick={() => setIsland('compact')} aria-hidden="true" />}
            <Island
              state={island}
              onExpand={() => (verdict === 'scam' ? setIsland('banner') : expand('simple'))}
              label={`c@t — ${verdictLabel}`}
            >
              {islandContent}
            </Island>

            <article className="message" key={mail.id} lang="en" dir="ltr" aria-hidden={island === 'expanded' || undefined}>
              <h2 className="message-subject">{mail.subject}</h2>
              <div className="message-sender">
                <span className={`avatar large ${mail.tone}`} aria-hidden="true">{mail.initials}</span>
                <div>
                  <strong>{mail.sender}</strong>
                  <span className={verdict === 'scam' ? 'address-warn' : ''}>{mail.address}</span>
                </div>
                <time>{mail.time}</time>
              </div>
              <div className="message-body">
                {mail.body.map((p, i) => <p key={i}>{p}</p>)}
                {mail.link && verdict === 'scam' && (
                  <button className="blocked-link" onClick={() => expand('simple')} dir={langInfo.rtl ? 'rtl' : 'ltr'} lang={lang === 'sga' ? 'en' : lang}>
                    <Icon name="linkoff" size={26} />
                    <span>
                      <strong>{t('linkBlocked')}</strong>
                      <span>“{mail.link.label}” → {mail.link.domain}</span>
                    </span>
                    <Icon name="forward" size={22} className="flip" />
                  </button>
                )}
                {mail.link && verdict === 'safe' && (
                  <p className="plain-link"><Icon name="shield" size={20} /> {mail.link.label} — {mail.link.domain}</p>
                )}
              </div>
            </article>
          </>
        ) : (
          <div className="reader-empty">
            <Cat mood="sleep" size={140} />
          </div>
        )}
      </section>

      {/* Comfort bar: always reachable accessibility controls */}
      <nav className="comfort" aria-label="Accessibility">
        <button onClick={() => setSheet('size')} aria-haspopup="dialog">
          <Icon name="text" size={26} />
          <span>{t('textSize')}</span>
        </button>
        <button onClick={toggleRead} aria-pressed={speaking} disabled={!speechSupported}>
          <Icon name={speaking ? 'stop' : 'speaker'} size={26} />
          <span>{speaking ? t('stopReading') : t('readAloud')}</span>
        </button>
        <button onClick={() => setHighContrast(!highContrast)} aria-pressed={highContrast}>
          <Icon name="contrast" size={26} />
          <span>{t('contrast')}</span>
        </button>
        <button onClick={() => setSheet('language')} aria-haspopup="dialog">
          <Icon name="globe" size={26} />
          <span>{t('language')}</span>
        </button>
      </nav>

      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <div>
            <p>{toast.message}</p>
            {toast.note && <p className="toast-note">{toast.note}</p>}
          </div>
          {toast.undo ? (
            <button className="pill pill-light" onClick={toast.undo}>{t('undo')}</button>
          ) : (
            <button className="round-button dark" onClick={() => setToast(null)} aria-label={t('close')}>
              <Icon name="close" size={22} />
            </button>
          )}
        </div>
      )}

      <Sheet open={sheet === 'size'} title={t('textSize')} onClose={() => setSheet(null)} closeLabel={t('close')}>
        <div className="choice-list" role="radiogroup" aria-label={t('textSize')}>
          {(['sizeNormal', 'sizeLarge', 'sizeLargest'] as StringKey[]).map((key, i) => (
            <button key={key} role="radio" aria-checked={sizeIndex === i} className="choice" onClick={() => setSizeIndex(i)}>
              <span className="choice-sample" style={{ fontSize: SIZES[i] * 1.4 }} aria-hidden="true">Aa</span>
              <span className="choice-label">{t(key)}</span>
              {sizeIndex === i && <Icon name="check" size={24} className="choice-check" />}
            </button>
          ))}
        </div>
        <button className="pill pill-primary wide" onClick={() => setSheet(null)}>{t('done')}</button>
      </Sheet>

      <Sheet open={sheet === 'language'} title={t('language')} onClose={() => setSheet(null)} closeLabel={t('close')}>
        <div className="choice-list scroll" role="radiogroup" aria-label={t('language')}>
          {languages.map((l) => (
            <button
              key={l.code}
              role="radio"
              aria-checked={lang === l.code}
              className="choice"
              onClick={() => {
                stop()
                setLang(l.code)
              }}
            >
              <span className="choice-label" lang={l.code === 'sga' ? undefined : l.code} dir={l.rtl ? 'rtl' : undefined}>{l.native}</span>
              <span className="choice-sub">{l.english}</span>
              {lang === l.code && <Icon name="check" size={24} className="choice-check" />}
            </button>
          ))}
        </div>
        <button className="pill pill-primary wide" onClick={() => setSheet(null)}>{t('done')}</button>
      </Sheet>
    </div>
  )
}
