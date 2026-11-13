import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  // "How this scam works" (scam emails only): the signs of this kind of scam, each pointed out
  // in this email (clue = exact words from the email), then what to do instead
  learn?: { signs: { icon: string; title: StringKey; text: StringKey; clue: string }[]; instead: StringKey }
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
    learn: {
      signs: [
        { icon: 'warning', title: 'learn_sender_title', text: 'learn_sender_text', clue: 'security@acc0unt-verify.net' },
        { icon: 'clock', title: 'learn_rush_title', text: 'learn_rush_text', clue: '“within 24 hours”' },
        { icon: 'linkoff', title: 'learn_link_title', text: 'learn_link_text', clue: 'secure-check.info' },
      ],
      instead: 'learn_account_instead',
    },
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
    reasons: ['r_ok_contact', 'r_ok_personal'],
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
    learn: {
      signs: [
        { icon: 'card', title: 'learn_fee_title', text: 'learn_fee_text', clue: '“A customs charge of £1.99”' },
        { icon: 'clock', title: 'learn_rush_title', text: 'learn_rush_text', clue: '“within 48 hours”' },
        { icon: 'linkoff', title: 'learn_pay_title', text: 'learn_pay_text', clue: 'parcel-fee-pay.top' },
      ],
      instead: 'learn_parcel_instead',
    },
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
    reasons: ['r_ok_nhs', 'r_ok_reminder'],
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
    reasons: ['r_ok_contact', 'r_ok_personal'],
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
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  card: <><rect x="3" y="6" width="18" height="12.5" rx="2.2" /><path d="M3 10.5h18M7 15h3.5" /></>,
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
  // Each sheet needs its own title id, or screen readers announce the wrong title
  const titleId = useId()
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
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className="sheet-inner">
        <span className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button className="grey-pill" onClick={onClose}>
            <Icon name="close" size={20} />
            <span>{closeLabel}</span>
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
type Step = 'simple' | 'questions' | 'actions' | 'learn'

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
    const measure = () => {
      setBox({ w: inner.offsetWidth, h: inner.offsetHeight })
      // Share the height so the email can move down exactly far enough (any language or text size)
      inner.closest<HTMLElement>('.pane-reader')?.style.setProperty('--island-h', `${inner.offsetHeight}px`)
    }
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
      // Not aria-modal: the comfort bar (and the list on desktop) stay usable while it is open.
      // The email behind it is made inert instead.
      role={isDialog ? 'dialog' : 'region'}
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

// Short intro (about 30 seconds): opens on the first visit, and again from the Help button
const INTRO_SEEN_KEY = 'cat-intro-seen'
const INTRO: { title: StringKey; body: StringKey }[] = [
  { title: 'intro1_title', body: 'intro1_body' },
  { title: 'intro2_title', body: 'intro2_body' },
  { title: 'intro3_title', body: 'intro3_body' },
  { title: 'intro4_title', body: 'intro4_body' },
]

export default function App() {
  // Comfort settings
  const [lang, setLang] = useState<LangCode>('en')
  const [sizeIndex, setSizeIndex] = useState(0)
  const [highContrast, setHighContrast] = useState(() => window.matchMedia?.('(prefers-contrast: more)').matches ?? false)
  const [sheet, setSheet] = useState<null | 'size' | 'language' | 'cat'>(null)
  const [announcement, setAnnouncement] = useState('')
  const t = useMemo(() => translator(lang), [lang])
  const { speaking, speak, stop, supported: speechSupported } = useSpeech(lang)
  const langInfo = languages.find((l) => l.code === lang) ?? languages[0]

  // Intro: show it unless this browser has already finished or closed it
  const [introStep, setIntroStep] = useState<number | null>(() => {
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) ? null : 0
    } catch {
      return 0
    }
  })
  const closeIntro = () => {
    stop()
    setIntroStep(null)
    try {
      localStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      // Storage blocked (private mode): the intro simply shows again next time
    }
  }
  const goToIntroStep = (step: number) => {
    stop()
    setIntroStep(step)
  }

  // Mailbox
  const [folder, setFolder] = useState<'inbox' | 'scam'>('inbox')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [readIds, setReadIds] = useState<number[]>([])
  const [scamIds, setScamIds] = useState<number[]>([])
  const [safeIds, setSafeIds] = useState<number[]>([])
  const [checkedIds, setCheckedIds] = useState<number[]>([])

  // Assistant
  const [island, setIsland] = useState<IslandState>('compact')
  const [step, setStep] = useState<Step>('simple')
  const [answers, setAnswers] = useState<boolean[]>([])
  const [summarySent, setSummarySent] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const islandHeading = useRef<HTMLHeadingElement>(null)

  const mail = MAILS.find((m) => m.id === selectedId) ?? null
  const verdictOf = (m: Mail): Verdict => (safeIds.includes(m.id) ? 'safe' : m.verdict)
  const verdict = mail ? verdictOf(mail) : 'safe'
  const inScamFolder = mail ? scamIds.includes(mail.id) : false
  // Likely scams still sitting in the inbox (shown on the cat logo and in "Inbox check")
  const inboxScams = MAILS.filter((m) => !scamIds.includes(m.id) && verdictOf(m) === 'scam')
  // Content of the "What should I do?" step (also used by Read aloud)
  const advice: StringKey = inScamFolder ? 'advice_in_folder' : verdict === 'scam' ? 'advice_scam' : 'advice_safe'
  const recommendMove = verdict === 'scam' && !inScamFolder
  const wayOutLabel: StringKey = inScamFolder ? 'moveToInbox' : verdict === 'scam' ? 'notScam' : 'moveToScam'

  // Apply comfort settings to the document
  useEffect(() => {
    const root = document.documentElement
    root.lang = lang === 'sga' ? 'en' : lang
    root.dir = langInfo.rtl ? 'rtl' : 'ltr'
    root.style.fontSize = `${SIZES[sizeIndex]}px`
    root.dataset.contrast = highContrast ? 'high' : 'normal'
  }, [lang, langInfo.rtl, sizeIndex, highContrast])

  // The page title says where the person is, e.g. "Inbox – c@t" (WCAG 2.4.2)
  useEffect(() => {
    document.title = mail ? `${mail.subject} – c@t` : `${folder === 'inbox' ? t('inbox') : t('scamFolder')} – c@t`
  }, [mail, folder, t])

  // Keyboard and screen-reader focus follows the person (WCAG 2.4.3): into the email when it opens on a
  // phone, back to the email after the assistant closes, and back to the list when the email closes
  const listTitle = useRef<HTMLHeadingElement>(null)
  const messageTitle = useRef<HTMLHeadingElement>(null)
  const lastOpenedId = useRef<number | null>(null)
  const prevSelectedId = useRef<number | null>(null)
  useEffect(() => {
    const justOpened = selectedId !== null && selectedId !== prevSelectedId.current
    prevSelectedId.current = selectedId
    if (selectedId !== null) {
      lastOpenedId.current = selectedId
      if (island === 'banner' || island === 'expanded') return // the assistant moves focus itself
      const focusLost = !document.activeElement || document.activeElement === document.body
      const listHidden = window.matchMedia('(max-width: 899px)').matches
      if (focusLost || (justOpened && listHidden)) messageTitle.current?.focus({ preventScroll: true })
      return
    }
    if (lastOpenedId.current === null) return
    // The email may have moved to another folder: then go to the list title instead
    const row = document.querySelector<HTMLElement>(`[data-mail-id="${lastOpenedId.current}"]`)
    ;(row ?? listTitle.current)?.focus()
    lastOpenedId.current = null
  }, [selectedId, island])

  // The comfort bar grows when labels wrap or switch to two rows; share its real height
  // so lists, toasts and the assistant always keep clear of it
  const comfortRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const bar = comfortRef.current
    if (!bar) return
    const root = document.documentElement
    const update = () => root.style.setProperty('--bar-h', `${bar.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  // Toasts disappear after 10s, but never while the pointer or keyboard focus is on them,
  // so there is always time to read them and reach Undo (WCAG 2.2.1)
  const [toastPaused, setToastPaused] = useState(false)
  useEffect(() => {
    if (!toast || toastPaused) return
    const id = window.setTimeout(() => setToast(null), 10000)
    return () => window.clearTimeout(id)
  }, [toast, toastPaused])

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

  const showToast = (message: string, extra?: Omit<Toast, 'id' | 'message'>) => {
    setToastPaused(false)
    setToast({ id: Date.now(), message, ...extra })
  }

  const openMail = (id: number) => {
    stop()
    const target = MAILS.find((m) => m.id === id)!
    setSelectedId(id)
    setReadIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    setStep('simple')
    setAnswers([])
    setSummarySent(false)
    // Every email opens with the small pill only (no prompt pops up). The verdict is still
    // announced to screen readers, and tapping the pill opens the details.
    setAnnouncement('')
    const announceVerdict = () => setAnnouncement(`${t('checkedThis')}: ${verdictOf(target) === 'scam' ? t('likelyScam') : t('looksSafe')}`)
    if (checkedIds.includes(id)) {
      setIsland('compact')
      window.setTimeout(announceVerdict, 150)
      return
    }
    setIsland('checking')
    window.setTimeout(() => {
      setCheckedIds((ids) => [...ids, id])
      setIsland((current) => (current === 'checking' ? 'compact' : current))
      announceVerdict()
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
    setScamIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
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

  // Way out of the Scam folder that does not depend on catching the Undo toast in time
  const moveToInbox = () => {
    if (!mail) return
    const id = mail.id
    setScamIds((ids) => ids.filter((x) => x !== id))
    setIsland('compact')
    setSelectedId(null)
    showToast(t('movedToInbox'), {
      undo: () => {
        setScamIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
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

  // Spoken version of "How this scam works"
  const learnSpeech = () => {
    if (!mail?.learn) return ''
    const say = (key: StringKey) => plainText(lang, key)
    const signs = mail.learn.signs.flatMap((sign) => [say(sign.title), say(sign.text), `${say('inThisEmail')} ${sign.clue}`])
    return [say('learnTitle'), ...signs, say('doInstead'), say(mail.learn.instead)].join('. ')
  }

  // What the "Read aloud" button reads depends on what is on screen
  const screenText = () => {
    const say = (key: StringKey) => plainText(lang, key)
    if (mail && island === 'expanded') {
      if (step === 'learn') return learnSpeech()
      if (step === 'simple') return [say(verdict === 'scam' ? 'likelyScam' : 'looksSafe'), say(mail.simple), ...mail.reasons.map(say)].join('. ')
      if (step === 'questions') {
        // Read only the question on screen (plus the sender for "Do you know the sender?")
        const current = (['q1', 'q2', 'q3'] as StringKey[])[answers.length]
        if (!current) return `${say(qResult.label)}. ${say(qResult.text)}`
        return current === 'q2' ? `${say('q2')} ${say('from')}: ${mail.sender}, ${mail.address}` : say(current)
      }
      return [say('whatToDo'), say(advice), say(recommendMove ? 'moveToScam' : 'done'), say('askTrusted'), say('callTrusted'), say('sendTrusted'), say('moreOptions'), say(wayOutLabel)].join('. ')
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
  // Question result: never say the answers "agree with c@t" when they don't
  const qResult: { tone: 'scam' | 'careful' | 'safe'; label: StringKey; text: StringKey } =
    verdict === 'scam'
      ? { tone: 'scam', label: 'likelyScam', text: riskyAnswers > 0 ? 'q_result_scam' : 'q_result_scam_check' }
      : riskyAnswers > 0
        ? { tone: 'careful', label: 'beCareful', text: 'q_result_mixed' }
        : { tone: 'safe', label: 'looksSafe', text: 'q_result_safe' }

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
          {/* Two rows, so the labelled Close button never squeezes the verdict */}
          <div className="isl-row">
            <Cat mood={catMood} size={52} />
            <p className="isl-sub isl-grow">{t('checkedThis')}</p>
            <button className="isl-pill" onClick={() => setIsland('compact')}>
              <Icon name="close" size={20} />
              <span>{t('close')}</span>
            </button>
          </div>
          <h2 className={`isl-verdict ${verdict}`} tabIndex={-1} ref={islandHeading}>{verdictLabel}</h2>
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
          <button className="isl-pill" onClick={() => setStep(back)}>
            <Icon name="back" size={20} className="flip" />
            <span>{t('back')}</span>
          </button>
        ) : (
          <Cat mood={catMood} size={52} />
        )}
        <h2 className="isl-heading" tabIndex={-1} ref={islandHeading}>{title}</h2>
        <button className="isl-pill" onClick={() => setIsland('compact')}>
          <Icon name="close" size={20} />
          <span>{t('close')}</span>
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

    // "How this scam works": one card per sign, each pointed out in this email, then what to do instead
    if (step === 'learn' && mail.learn)
      return (
        <div className="isl isl-expanded" key="learn">
          {head(t('learnTitle'), 'actions')}
          <ol className="learn-signs">
            {mail.learn.signs.map((sign) => (
              <li key={sign.title}>
                <div className="learn-head">
                  <span className="learn-icon" aria-hidden="true">
                    <Icon name={sign.icon} size={22} />
                  </span>
                  <h3>{t(sign.title)}</h3>
                </div>
                <p>{t(sign.text)}</p>
                <p className="learn-clue">
                  <span>{t('inThisEmail')}</span>
                  <span className="learn-clue-text" lang="en" dir="ltr">{sign.clue}</span>
                </p>
              </li>
            ))}
          </ol>
          <div className="learn-instead">
            <div className="learn-head">
              <span className="learn-icon" aria-hidden="true">
                <Icon name="shield" size={22} />
              </span>
              <h3>{t('doInstead')}</h3>
            </div>
            <p>{t(mail.learn.instead)}</p>
          </div>
          <div className="isl-actions">
            <button className="pill pill-dark" onClick={() => speak(learnSpeech())}>
              <Icon name="speaker" size={22} />
              {t('readToMe')}
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
              {/* The email is blurred behind the assistant, so show who sent it right here */}
              {questions[index] === 'q2' && (
                <div className="isl-sender">
                  <span className={`avatar ${mail.tone}`} aria-hidden="true">{mail.initials}</span>
                  <div>
                    <span className="isl-sender-label">{t('from')}</span>
                    <strong>{mail.sender}</strong>
                    <span lang="en" dir="ltr">{mail.address}</span>
                  </div>
                </div>
              )}
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
              <p className={`isl-chip ${qResult.tone}`}>
                <Icon name={qResult.tone === 'safe' ? 'shield' : qResult.tone === 'careful' ? 'question' : 'warning'} size={20} />
                {t(qResult.label)}
              </p>
              <p className="isl-explain">{t(qResult.text)}</p>
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

    // "What should I do?": one sentence of advice and one main button first; every other option
    // sits below in calm, identical list rows (one style, no extra colours).
    const wayOut = inScamFolder ? moveToInbox : verdict === 'scam' ? markSafe : moveToScam
    const wayOutIcon = inScamFolder ? 'inbox' : verdict === 'scam' ? 'undo' : 'folder'
    const chevron = <Icon name="forward" size={20} className="isl-option-end flip" />
    return (
      <div className="isl isl-expanded" key="actions">
        {head(t('whatToDo'), 'simple')}
        <p className="isl-explain">{t(advice)}</p>
        <div className="isl-actions">
          {recommendMove ? (
            <button className="pill pill-light big" onClick={moveToScam}>
              <Icon name="folder" size={24} />
              {t('moveToScam')}
            </button>
          ) : (
            <button className="pill pill-light big" onClick={() => setIsland('compact')}>
              <Icon name="check" size={24} />
              {t('done')}
            </button>
          )}
        </div>

        <h3 className="isl-subhead" id="g-trust">{t('askTrusted')}</h3>
        <ul className="isl-list" aria-labelledby="g-trust">
          <li>
            <button className="isl-option" onClick={() => showToast(`${t('calling')} ${t('trustedName')}…`, { note: t('simulated') })}>
              <Icon name="phone" size={22} />
              <span>{t('callTrusted')}</span>
              {chevron}
            </button>
          </li>
          <li>
            <button
              className="isl-option"
              onClick={() => {
                setSummarySent(true)
                showToast(`${t('summarySent')} ${t('trustedName')}.`, { note: t('simulated') })
              }}
            >
              <Icon name={summarySent ? 'check' : 'send'} size={22} />
              <span>{summarySent ? `${t('summarySent')} ${t('trustedName')}` : t('sendTrusted')}</span>
              {!summarySent && chevron}
            </button>
          </li>
        </ul>

        <h3 className="isl-subhead" id="g-more">{t('moreOptions')}</h3>
        <ul className="isl-list" aria-labelledby="g-more">
          {verdict === 'scam' && mail.learn && (
            <li>
              <button className="isl-option" onClick={() => setStep('learn')}>
                <Icon name="book" size={22} />
                <span>{t('learnScam')}</span>
                {chevron}
              </button>
            </li>
          )}
          <li>
            <button className="isl-option" onClick={wayOut}>
              <Icon name={wayOutIcon} size={22} />
              <span>{t(wayOutLabel)}</span>
              {chevron}
            </button>
          </li>
        </ul>
      </div>
    )
  })()

  /* --------------------------------- Render --------------------------------- */

  return (
    <div className="app" data-mail-open={mail ? 'true' : 'false'}>
      {/* Mailbox list */}
      <section className="pane pane-list" aria-label={t('inbox')}>
        <header className="list-top">
          {/* The cat logo opens "Inbox check": what c@t found and quick ways to act on it */}
          <button className="logo-button" onClick={() => setSheet('cat')} aria-haspopup="dialog" aria-label={t('logoLabel')}>
            <Logo />
          </button>
          <div className="list-top-end">
            <button className="grey-pill" onClick={() => goToIntroStep(0)} aria-haspopup="dialog">
              <Icon name="question" size={22} />
              <span>{t('help')}</span>
            </button>
            <span className="me" aria-hidden="true">JR</span>
          </div>
        </header>
        <h1 className="large-title" tabIndex={-1} ref={listTitle}>{folder === 'inbox' ? t('inbox') : t('scamFolder')}</h1>
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
                <button className={`mail-row ${selectedId === m.id ? 'active' : ''}`} data-mail-id={m.id} onClick={() => openMail(m.id)} aria-current={selectedId === m.id || undefined}>
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
                  {unread && <span className="unread-dot"><span className="visually-hidden">{t('unread')}</span></span>}
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
            {/* While the assistant is open, the blurred email behind it can't be reached by Tab or a screen reader */}
            <div className="reader-top" inert={island === 'expanded'}>
              <button className="back-pill reader-back" onClick={closeMail}>
                <Icon name="back" size={24} className="flip" />
                <span>{t('back')}</span>
              </button>
            </div>
            {/* Screen readers hear the verdict when the check finishes, since no prompt opens by itself */}
            <p className="visually-hidden" role="status">{announcement}</p>

            {island === 'expanded' && <div className="island-scrim" onClick={() => setIsland('compact')} aria-hidden="true" />}
            <Island
              state={island}
              onExpand={() => (verdict === 'scam' ? setIsland('banner') : expand('simple'))}
              label={`c@t — ${verdictLabel}`}
            >
              {islandContent}
            </Island>

            <article className="message" key={mail.id} lang="en" dir="ltr" inert={island === 'expanded'}>
              <h2 className="message-subject" tabIndex={-1} ref={messageTitle}>{mail.subject}</h2>
              <div className="message-sender">
                <span className={`avatar large ${mail.tone}`} aria-hidden="true">{mail.initials}</span>
                <div>
                  <strong>{mail.sender}</strong>
                  <span className={verdict === 'scam' ? 'address-warn' : ''}>{mail.address}</span>
                  {/* Words and an icon as well as red, so the warning does not rely on colour (WCAG 1.4.1) */}
                  {verdict === 'scam' && (
                    <span className="address-note" lang={lang === 'sga' ? 'en' : lang} dir={langInfo.rtl ? 'rtl' : 'ltr'}>
                      <Icon name="warning" size={18} />
                      {t('suspectAddress')}
                    </span>
                  )}
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
      <nav className="comfort" aria-label={t('accessibility')} ref={comfortRef}>
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
        <div
          className="toast"
          role="status"
          key={toast.id}
          onMouseEnter={() => setToastPaused(true)}
          onMouseLeave={() => setToastPaused(false)}
          onFocus={() => setToastPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastPaused(false)
          }}
        >
          <div>
            <p>{toast.message}</p>
            {toast.note && <p className="toast-note">{toast.note}</p>}
          </div>
          {toast.undo ? (
            <button className="pill pill-light" onClick={toast.undo}>{t('undo')}</button>
          ) : (
            <button className="pill pill-light" onClick={() => setToast(null)}>{t('close')}</button>
          )}
        </div>
      )}

      <Sheet open={sheet === 'cat'} title={t('inboxCheck')} onClose={() => setSheet(null)} closeLabel={t('close')}>
        {/* Kept to the essentials: one sentence, then the emails that need care (if any) */}
        <div className="cat-summary">
          <Cat mood={inboxScams.length ? 'alert' : 'happy'} size={64} />
          <p>{inboxScams.length ? t('scamsFound') : t('allSafe')}</p>
        </div>
        {inboxScams.length > 0 && (
          <ul className="sheet-list">
            {inboxScams.map((m) => (
              <li key={m.id}>
                <button
                  className="sheet-row"
                  onClick={() => {
                    setSheet(null)
                    setFolder('inbox')
                    openMail(m.id)
                  }}
                >
                  <span className={`avatar ${m.tone}`} aria-hidden="true">{m.initials}</span>
                  <span className="sheet-row-text">
                    <strong>{m.sender}</strong>
                    <span>{m.subject}</span>
                  </span>
                  <Icon name="forward" size={20} className="sheet-row-end flip" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

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

      <Sheet open={introStep !== null} title={introStep !== null ? t(INTRO[introStep].title) : ''} onClose={closeIntro} closeLabel={t('close')}>
        {introStep !== null && (
          <>
            {/* Steps only move when the person taps: no timers or auto-advance */}
            <div className="intro" aria-live="polite">
              <div className="intro-art" key={`art-${introStep}`} aria-hidden="true">
                {introStep === 0 && <Cat mood="happy" size={104} />}
                {introStep === 1 && (
                  <div className="intro-pills">
                    <div className="intro-pill">
                      <Cat mood="alert" size={34} />
                      <span className="isl-dot scam" />
                      <span>{t('likelyScam')}</span>
                    </div>
                    <div className="intro-pill">
                      <Cat mood="happy" size={34} />
                      <span className="isl-dot safe" />
                      <span>{t('looksSafe')}</span>
                    </div>
                  </div>
                )}
                {introStep === 2 && (
                  <div className="blocked-link intro-link">
                    <Icon name="linkoff" size={26} />
                    <span>
                      <strong>{t('linkBlocked')}</strong>
                      <span>{t('linkBlockedSub')}</span>
                    </span>
                  </div>
                )}
                {introStep === 3 && (
                  <div className="intro-comfort">
                    {(
                      [
                        ['text', 'textSize'],
                        ['speaker', 'readAloud'],
                        ['contrast', 'contrast'],
                        ['globe', 'language'],
                      ] as [string, StringKey][]
                    ).map(([icon, key]) => (
                      <span key={key}>
                        <Icon name={icon} size={26} />
                        {t(key)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="intro-body" key={`body-${introStep}`}>{t(INTRO[introStep].body)}</p>
            </div>

            <div className="intro-tools">
              {/* Language first, so people who do not read English can switch straight away */}
              {introStep === 0 && (
                <button className="grey-pill" onClick={() => setSheet('language')} aria-haspopup="dialog">
                  <Icon name="globe" size={22} />
                  <span>{t('language')}: {langInfo.native}</span>
                </button>
              )}
              <button
                className="grey-pill"
                onClick={() => speak(`${plainText(lang, INTRO[introStep].title)}. ${plainText(lang, INTRO[introStep].body)}`)}
                disabled={!speechSupported}
              >
                <Icon name="speaker" size={22} />
                <span>{t('readToMe')}</span>
              </button>
            </div>

            <div className="intro-foot">
              <span className="intro-count">{introStep + 1} / {INTRO.length}</span>
              <div className="intro-buttons">
                {introStep > 0 && (
                  <button className="pill pill-grey" onClick={() => goToIntroStep(introStep - 1)}>{t('back')}</button>
                )}
                {introStep < INTRO.length - 1 ? (
                  <button className="pill pill-primary" onClick={() => goToIntroStep(introStep + 1)}>{t('next')}</button>
                ) : (
                  <button className="pill pill-primary" onClick={closeIntro}>{t('start')}</button>
                )}
              </div>
            </div>
          </>
        )}
      </Sheet>
    </div>
  )
}
