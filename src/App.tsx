import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ScribbleCat, type ScribbleMood } from './ScribbleCat'
import { Reveal, After } from './motion'
import { fill, languages, translator, type LangCode, type StringKey } from './i18n'
import { FOLDER_MAILS, MAILS, type Mail } from './mail/data'
import { Avatar, Btn, Icon, Row, Sheet, Steps, Toggle, VerdictTag, type IconName } from './mail/ui'
import { useListen, useSpeech } from './mail/speech'
import './mail/mail.css'

export const SIZES = [16, 19, 22]

export type Prefs = {
  lang: LangCode
  sizeIndex: number
  highContrast: boolean
  name: string
  trustedName: string
  trustedPhone: string
}

type Screen =
  | { name: 'inbox' }
  | { name: 'read'; id: number }
  | { name: 'checking'; id: number }
  | { name: 'warning'; id: number }
  | { name: 'anyway'; id: number }
  | { name: 'breather'; id: number }
  | { name: 'why'; id: number }
  | { name: 'questions'; id: number; step: 0 | 1 }
  | { name: 'answer'; id: number }
  | { name: 'todo'; id: number }
  | { name: 'done'; id: number }
  | { name: 'learn'; id: number }
  | { name: 'wrong'; id: number }
  | { name: 'ask'; id: number }
  | { name: 'sent'; id?: number; mode: 'sent' | 'calling' }
  | { name: 'pause'; id: number }
  | { name: 'write'; replyTo?: number }
  | { name: 'help' }
  | { name: 'how' }
  | { name: 'oops' }
  | { name: 'settings' }
  | { name: 'voice' }

type Answer = 'yes' | 'no' | 'unsure'
type Toast = { text: string; undo?: () => void; id: number }
type SheetName = null | 'size' | 'lang' | 'check' | 'more' | 'confirm'

const ICON_OK = { warning: 1, clock: 1, card: 1, lock: 1 }

const QUESTIONS: { q: StringKey; options: [Answer, StringKey][] }[] = [
  { q: 'q1', options: [['yes', 'ansYesWas'], ['no', 'ansNoWasnt'], ['unsure', 'notSure']] },
  { q: 'q3', options: [['yes', 'ansYesIt'], ['no', 'ansNoIt'], ['unsure', 'notSure']] },
]

export default function App({ prefs, onPrefsChange, onReplayIntro }: { prefs: Prefs; onPrefsChange: (p: Partial<Prefs>) => void; onReplayIntro: () => void }) {
  /* ------------------------------------------------------------ Comfort */
  const [lang, setLangState] = useState<LangCode>(prefs.lang)
  const [sizeIndex, setSizeState] = useState(prefs.sizeIndex)
  const [highContrast, setContrastState] = useState(prefs.highContrast)
  const [lessMotion, setLessMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [voiceButton, setVoiceButton] = useState(true)
  const [lockLinks, setLockLinks] = useState(true)
  const [autoEmpty, setAutoEmpty] = useState(true)
  const [trusted, setTrusted] = useState({ name: prefs.trustedName, phone: prefs.trustedPhone })
  const setLang = (v: LangCode) => (setLangState(v), onPrefsChange({ lang: v }))
  const setSize = (v: number) => (setSizeState(v), onPrefsChange({ sizeIndex: v }))
  const setContrast = (v: boolean) => (setContrastState(v), onPrefsChange({ highContrast: v }))

  const t = useMemo(() => translator(lang), [lang])
  const tf = (key: StringKey, vars: Record<string, string | number>) => fill(t(key), vars)
  const langInfo = languages.find((l) => l.code === lang) ?? languages[0]
  const anna = trusted.name.trim()
  const { speaking, speak, stop, supported: canSpeak, slow, toggleSlow } = useSpeech(lang)
  const voice = useListen(lang)

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang === 'sga' ? 'en' : lang
    root.dir = langInfo.rtl ? 'rtl' : 'ltr'
    root.style.fontSize = `${SIZES[sizeIndex]}px`
    root.dataset.contrast = highContrast ? 'high' : ''
    root.dataset.motion = lessMotion ? 'reduce' : ''
  }, [lang, langInfo.rtl, sizeIndex, highContrast, lessMotion])

  /* ------------------------------------------------------------ Mail state */
  const [mails, setMails] = useState<Mail[]>(() => [...MAILS, ...FOLDER_MAILS])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [answers, setAnswers] = useState<Record<number, Answer[]>>({})
  const [folder, setFolder] = useState<'inbox' | 'scam'>('inbox')
  const [query, setQuery] = useState('')
  const [lastMail, setLastMail] = useState<number | null>(null)
  const byId = (id: number) => mails.find((m) => m.id === id)!

  /* ------------------------------------------------------------ Navigation */
  const [stack, setStack] = useState<Screen[]>([{ name: 'inbox' }])
  const screen = stack[stack.length - 1]
  const go = (s: Screen) => (stop(), setStack((st) => [...st, s]))
  const replace = (s: Screen) => setStack((st) => [...st.slice(0, -1), s])
  const back = () => (stop(), setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)))
  const home = () => (stop(), setStack([{ name: 'inbox' }]))
  // Jump back to an earlier screen for this email (e.g. from "Sent" to the email itself)
  const backTo = (names: Screen['name'][]) =>
    setStack((st) => {
      const i = st.map((s) => names.includes(s.name)).lastIndexOf(true)
      return i >= 0 ? st.slice(0, i + 1) : [{ name: 'inbox' }]
    })

  const openMail = (m: Mail) => {
    setLastMail(m.id)
    if (m.verdict === 'safe') go({ name: 'read', id: m.id })
    else go({ name: checked.has(m.id) ? 'warning' : 'checking', id: m.id })
  }

  // The checking screen hands over to the verdict by itself
  useEffect(() => {
    if (screen.name !== 'checking') return
    const id = screen.id
    const timer = window.setTimeout(() => {
      setChecked((c) => new Set(c).add(id))
      replace({ name: 'warning', id })
    }, lessMotion ? 600 : 2000)
    return () => window.clearTimeout(timer)
  }, [screen, lessMotion])

  // New screen: move focus to its title so screen readers hear where they are
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [stack.length, screen.name])

  /* ------------------------------------------------------------ Toasts + sheets */
  const [toast, setToast] = useState<Toast | null>(null)
  const showToast = (text: string, undo?: () => void) => setToast({ text, undo, id: Date.now() })
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 7000)
    return () => window.clearTimeout(timer)
  }, [toast])
  const [sheet, setSheet] = useState<SheetName>(null)

  const moveMail = (id: number, to: 'inbox' | 'scam', message: string) => {
    const before = byId(id).folder
    setMails((ms) => ms.map((m) => (m.id === id ? { ...m, folder: to } : m)))
    showToast(message, () => {
      setMails((ms) => ms.map((m) => (m.id === id ? { ...m, folder: before } : m)))
      setToast(null)
    })
  }
  const moveToScam = (id: number) => {
    moveMail(id, 'scam', t('movedToScam'))
    setStack([{ name: 'inbox' }, { name: 'done', id }])
  }

  // Read the current screen: marked passages first, otherwise everything on it
  const readScreen = () => {
    const main = mainRef.current
    if (!main) return
    const parts = [...main.querySelectorAll<HTMLElement>('[data-read]')].map((n) => n.getAttribute('aria-label') ?? n.innerText)
    speak(parts.length ? parts.join('. ') : main.innerText)
  }

  const callTrusted = (id?: number) => (anna ? go({ name: 'sent', id, mode: 'calling' }) : go({ name: 'settings' }))

  /* ------------------------------------------------------------ Voice */
  const [heard, setHeard] = useState<{ you: string; cat: string } | null>(null)
  const answerVoice = (text: string) => {
    const said = text.toLowerCase()
    const m = lastMail ? byId(lastMail) : null
    const reply = (cat: string) => {
      setHeard({ you: text, cat })
      speak(cat)
    }
    if (/call|phone/.test(said)) return callTrusted(m?.id)
    if (!m) return reply(t('voiceNoEmail'))
    if (/move|folder|bin|delete/.test(said)) return setSheet('confirm')
    if (/what|do\b|should/.test(said)) return go({ name: 'todo', id: m.id })
    if (/read/.test(said)) return reply(m.body.join(' '))
    if (/why/.test(said)) return reply(m.reasons.map((r) => t(r)).join(' '))
    if (/safe|scam|okay|ok\b/.test(said)) return reply(`${m.verdict === 'scam' ? t('voiceNo') : t('voiceYes')} ${t(m.reasons[0])}`)
    reply(t('voiceMissed'))
  }

  /* ------------------------------------------------------------ Shared bits */
  const comfortBar = (
    <nav className="m-comfort" aria-label={t('accessibility')}>
      {speaking ? (
        <div className="m-reading" role="status">
          <span className="m-reading-label">
            <span className="m-wave" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {t('readingAloud')}
          </span>
          <button type="button" className="m-comfort-btn" onClick={toggleSlow} aria-pressed={slow}>
            <Icon name="speaker" />
            <span>{slow ? t('normalSpeed') : t('slower')}</span>
          </button>
          <button type="button" className="m-comfort-btn" onClick={stop}>
            <Icon name="stop" />
            <span>{t('stopReading')}</span>
          </button>
        </div>
      ) : (
        <>
          <button type="button" className="m-comfort-btn" onClick={() => setSheet('size')} aria-haspopup="dialog">
            <Icon name="text" />
            <span>{t('textSize')}</span>
          </button>
          {canSpeak && (
            <button type="button" className="m-comfort-btn" onClick={readScreen}>
              <Icon name="speaker" />
              <span>{t('readAloud')}</span>
            </button>
          )}
          <button type="button" className="m-comfort-btn" onClick={() => setContrast(!highContrast)} aria-pressed={highContrast}>
            <Icon name="contrast" />
            <span>{t('contrast')}</span>
          </button>
          <button type="button" className="m-comfort-btn" onClick={() => setSheet('lang')} aria-haspopup="dialog">
            <Icon name="globe" />
            <span>{langInfo.code === 'en' ? t('language') : langInfo.native}</span>
          </button>
        </>
      )}
    </nav>
  )

  const backBtn = (label = t('back'), onClick = back) => (
    <button type="button" className="m-back" onClick={onClick}>
      <Icon name="back" size={20} className="flip-rtl" />
      {label}
    </button>
  )

  const readBtn = canSpeak ? (
    <button type="button" className="m-link" onClick={speaking ? stop : readScreen}>
      <Icon name={speaking ? 'stop' : 'speaker'} size={20} />
      {speaking ? t('stopReading') : t('readToMe')}
    </button>
  ) : null

  const hour = new Date().getHours()
  const greet = t(hour < 12 ? 'greetMorning' : hour < 18 ? 'greetAfternoon' : 'greetEvening')

  /* ------------------------------------------------------------ Screens */
  function render(): { top?: ReactNode; body: ReactNode; foot?: ReactNode; comfort?: boolean; tone?: 'calm' } {
    switch (screen.name) {
      case 'inbox': {
        const q = query.trim().toLowerCase()
        const results = q ? mails.filter((m) => [m.sender, m.subject, m.preview].some((s) => s.toLowerCase().includes(q))) : []
        const inInbox = mails.filter((m) => m.folder === 'inbox')
        const attention = inInbox.filter((m) => m.verdict === 'scam')
        const others = inInbox.filter((m) => m.verdict === 'safe')
        const scams = mails.filter((m) => m.folder === 'scam')
        return {
          comfort: true,
          top: (
            <>
              <button type="button" className="m-logo" onClick={() => setSheet('check')} aria-label={t('logoLabel')} aria-haspopup="dialog">
                <span className="m-logo-cat">
                  <ScribbleCat mood={attention.length ? 'curious' : 'awake'} />
                </span>
                <span className="m-logo-word" aria-hidden="true">
                  c@t
                </span>
              </button>
              <div className="m-top-actions">
                {voiceButton && (
                  <button type="button" className="m-chip" onClick={() => go({ name: 'voice' })}>
                    <Icon name="mic" size={20} />
                    {t('talk')}
                  </button>
                )}
                <button type="button" className="m-chip" onClick={() => go({ name: 'help' })}>
                  <Icon name="question" size={20} />
                  {t('help')}
                </button>
              </div>
            </>
          ),
          body: (
            <>
              {prefs.name && (
                <p className="m-greet" key={`g-${folder}`}>
                  {greet}, {prefs.name}.
                </p>
              )}
              <Reveal as="h1" className="m-title" key={folder} text={folder === 'inbox' ? t('inbox') : t('scamFolder')} />
              <div className="m-search">
                <Icon name="search" />
                <label className="visually-hidden" htmlFor="m-search">
                  {t('searchMine')}
                </label>
                <input id="m-search" type="search" placeholder={t('searchMine')} value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && (
                  <button type="button" className="m-clear" onClick={() => setQuery('')}>
                    {t('clear')}
                  </button>
                )}
              </div>

              {q ? (
                <section aria-live="polite">
                  <p className="m-count">{results.length === 1 ? t('foundOne') : tf('foundMany', { n: results.length })}</p>
                  {results.length === 0 ? (
                    <p className="m-muted">{t('noResults')}</p>
                  ) : (
                    <ul className="m-list">
                      {results.map((m) => (
                        <li key={m.id}>
                          <MailRow m={m} t={t} onOpen={() => openMail(m)} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : (
                <>
                  <div className="m-switch-folders" role="group" aria-label={t('inbox')}>
                    <button type="button" aria-pressed={folder === 'inbox'} onClick={() => setFolder('inbox')}>
                      {t('inbox')}
                    </button>
                    <button type="button" aria-pressed={folder === 'scam'} onClick={() => setFolder('scam')}>
                      {t('scamFolder')}
                      {scams.length > 0 && <span className="m-num">{scams.length}</span>}
                    </button>
                  </div>

                  {folder === 'inbox' ? (
                    inInbox.length === 0 ? (
                      <Empty mood="sleep" title={t('inboxEmptyTitle')} body={t('inboxEmptyBody')} />
                    ) : (
                      <>
                        {attention.length > 0 && (
                          <section aria-labelledby="h-att" className="m-section">
                            <h2 className="m-eyebrow" id="h-att">
                              {t('needsAttention')}
                            </h2>
                            <ul className="m-list m-list-cards">
                              {attention.map((m) => (
                                <li key={m.id}>
                                  <MailRow m={m} t={t} onOpen={() => openMail(m)} card />
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                        {others.length > 0 && (
                          <section aria-labelledby="h-oth" className="m-section">
                            <h2 className="m-eyebrow" id="h-oth">
                              {t('otherEmails')}
                            </h2>
                            <ul className="m-list">
                              {others.map((m) => (
                                <li key={m.id}>
                                  <MailRow m={m} t={t} onOpen={() => openMail(m)} />
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                      </>
                    )
                  ) : (
                    <>
                      <p className="m-note">
                        <Icon name="lock" size={20} />
                        {autoEmpty ? t('scamFolderNote') : t('scamFolderNoteKeep')}
                      </p>
                      {scams.length === 0 ? (
                        <Empty mood="happy" title={t('scamEmptyTitle')} body={t('scamEmptyBody')} />
                      ) : (
                        <ul className="m-list">
                          {scams.map((m) => (
                            <li key={m.id} className="m-folder-row">
                              <Avatar initials={m.initials} />
                              <span className="m-mail-text">
                                <span className="m-mail-from">{m.sender}</span>
                                <span className="m-mail-subject">{m.subject}</span>
                              </span>
                              <button type="button" className="m-chip" onClick={() => moveMail(m.id, 'inbox', t('movedToInbox'))} aria-label={`${t('bringBack')}: ${m.subject}`}>
                                <Icon name="undo" size={20} className="flip-rtl" />
                                {t('bringBack')}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                  <div className="m-write">
                    <Btn kind="secondary" icon="pen" onClick={() => go({ name: 'write' })}>
                      {t('writeEmail')}
                    </Btn>
                  </div>
                </>
              )}
            </>
          ),
        }
      }

      case 'read': {
        const m = byId(screen.id)
        return {
          comfort: true,
          top: backBtn(t('inbox')),
          body: (
            <>
              <CatCard mood="awake" t={t}>
                <VerdictTag verdict="safe" label={t('looksSafe')} />
                <p className="m-card-text" data-read>
                  {t(m.reasons[0])}
                </p>
                <SimpleWords text={t(m.simple)} label={t('inSimpleWords')} />
              </CatCard>
              <EmailHead m={m} t={t} title />
              <div className="m-body" data-read>
                {m.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="m-actions">
                <Btn icon="pen" onClick={() => go({ name: 'write', replyTo: m.id })}>
                  {t('reply')}
                </Btn>
              </div>
            </>
          ),
        }
      }

      case 'checking': {
        const m = byId(screen.id)
        return {
          top: backBtn(t('inbox')),
          body: (
            <>
              <div className="m-hero" role="status">
                <div className="m-hero-cat m-scanning">
                  <ScribbleCat mood="curious" />
                  <span className="m-scan" aria-hidden="true" />
                </div>
                <Reveal as="h1" className="m-title m-center" text={t('checking')} />
                <After delay={350}>
                  <p className="m-lede m-center">{t('checkingWait')}</p>
                </After>
              </div>
              <div className="m-dim" aria-hidden="true">
                <EmailHead m={m} t={t} />
                <div className="m-hidden-body">
                  <Icon name="lock" />
                  {t('emailHidden')}
                </div>
              </div>
            </>
          ),
        }
      }

      case 'warning': {
        const m = byId(screen.id)
        return {
          top: (
            <>
              {backBtn(t('inbox'))}
              <button type="button" className="m-chip" onClick={() => setSheet('more')} aria-haspopup="dialog">
                {t('more')}
              </button>
            </>
          ),
          body: (
            <>
              <div className="m-verdict-head">
                <span className="m-verdict-cat">
                  <ScribbleCat mood="alert" />
                </span>
                <div>
                  <p className="m-small">{t('checkedThis')}</p>
                  <VerdictTag verdict="scam" label={t('likelyScam')} />
                </div>
              </div>
              <Reveal as="h1" className="m-title" text={t('dontTapYet')} />
              <After delay={420}>
                <p className="m-lede" data-read>
                  {t('letsLook')}
                </p>
              </After>
              <After delay={560} className="m-stack">
                <Btn icon="question" onClick={() => go({ name: 'why', id: m.id })}>
                  {t('whyThink')}
                </Btn>
                <Btn kind="secondary" icon="wind" onClick={() => go({ name: 'breather', id: m.id })}>
                  {t('takeBreath')}
                </Btn>
              </After>
              <After delay={700}>
                <div className="m-mini-mail">
                  <EmailHead m={m} t={t} flagAddress />
                  <button type="button" className="m-link" onClick={() => go({ name: 'anyway', id: m.id })}>
                    {t('showAnyway')}
                  </button>
                </div>
              </After>
            </>
          ),
        }
      }

      case 'anyway': {
        const m = byId(screen.id)
        return {
          comfort: true,
          top: backBtn(),
          body: (
            <>
              <div className="m-strip">
                <VerdictTag verdict="scam" label={`c@t: ${t('likelyScam')}`} size="s" />
                <button type="button" className="m-link" onClick={() => go({ name: 'todo', id: m.id })}>
                  {t('checkWithCat')}
                </button>
              </div>
              <EmailHead m={m} t={t} flagAddress title />
              <div className="m-body" data-read>
                {m.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {m.link &&
                (lockLinks ? (
                  <button type="button" className="m-locked-link" onClick={() => go({ name: 'pause', id: m.id })}>
                    <Icon name="lock" />
                    <span>
                      <span className="m-locked-title">{t('linkBlocked')}</span>
                      <span className="m-locked-sub">
                        <s>{m.link.label}</s> · {t('linkBlockedSub')}
                      </span>
                    </span>
                  </button>
                ) : (
                  <button type="button" className="m-locked-link" onClick={() => go({ name: 'pause', id: m.id })}>
                    <span className="m-locked-title">{m.link.label}</span>
                  </button>
                ))}
            </>
          ),
        }
      }

      case 'breather': {
        return {
          tone: 'calm',
          top: backBtn(),
          body: (
            <div className="m-breathe-wrap">
              <Breath t={t} still={lessMotion} />
              <Reveal as="h1" className="m-title m-center" text={t('breathTitle')} />
              <After delay={500}>
                <p className="m-lede m-center" data-read>
                  {t('breathBody')}
                </p>
                <p className="m-small m-center m-gap">{t('breathNote')}</p>
              </After>
            </div>
          ),
          foot: (
            <>
              <Btn onClick={back}>{t('imReady')}</Btn>
              {anna && (
                <Btn kind="secondary" icon="phone" onClick={() => callTrusted(screen.id)}>
                  {tf('callName', { name: anna })}
                </Btn>
              )}
            </>
          ),
        }
      }

      case 'why': {
        const m = byId(screen.id)
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('whyTitle')} />
              <After delay={380}>
                <ul className="m-signs">
                  {(m.learn?.signs ?? m.reasons.map((r) => ({ icon: 'warning', title: r, text: r, clue: '' }))).map((s, i) => (
                    <li key={i} className="m-sign" data-read aria-label={`${t(s.title)}. ${s.clue ? `${t('inThisEmail')} ${s.clue}` : ''}`}>
                      <span className="m-sign-icon">
                        <Icon name={(s.icon === 'linkoff' ? 'lock' : s.icon in ICON_OK ? s.icon : 'warning') as IconName} />
                      </span>
                      <span>
                        <span className="m-sign-title">{t(s.title)}</span>
                        {s.clue && (
                          <span className="m-quote">
                            <span className="m-quote-label">{t('inThisEmail')}</span> <span lang="en" dir="ltr">{s.clue}</span>
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {readBtn}
              </After>
            </>
          ),
          foot: (
            <>
              <Btn onClick={() => go({ name: 'todo', id: m.id })}>{t('whatToDo')}</Btn>
              <Btn kind="secondary" onClick={() => go({ name: 'questions', id: m.id, step: 0 })}>
                {t('askQuestions')}
              </Btn>
            </>
          ),
        }
      }

      case 'questions': {
        const { id, step } = screen
        const Q = QUESTIONS[step]
        const mine = answers[id] ?? []
        const pick = (a: Answer) => {
          setAnswers((all) => {
            const next = [...(all[id] ?? [])]
            next[step] = a
            return { ...all, [id]: next }
          })
          if (step === 0) go({ name: 'questions', id, step: 1 })
          else go({ name: 'answer', id })
        }
        return {
          top: (
            <>
              {backBtn()}
              <Steps index={step + 1} total={QUESTIONS.length} label={tf('stepOf', { n: step + 1, total: QUESTIONS.length })} />
            </>
          ),
          body: (
            <>
              <Reveal as="h1" className="m-title" key={step} text={t(Q.q)} />
              <After delay={420}>
                <p className="m-lede">{t('noWrong')}</p>
              </After>
              <After delay={560} className="m-stack m-answers">
                {Q.options.map(([a, label]) => (
                  <Btn key={a} kind="secondary" pressed={mine[step] === a} onClick={() => pick(a)}>
                    {t(label)}
                  </Btn>
                ))}
              </After>
            </>
          ),
        }
      }

      case 'answer': {
        const m = byId(screen.id)
        const [expecting, asks] = answers[m.id] ?? []
        const result = expecting === 'yes' && asks === 'no' ? 'q_result_scam_check' : 'q_result_scam'
        return {
          top: backBtn(),
          body: (
            <>
              <div className="m-cat-sm">
                <ScribbleCat mood="awake" />
              </div>
              <Reveal as="h1" className="m-title" text={t('answerTitle')} />
              <After delay={400}>
                <p className="m-lede" data-read>
                  {t(result)}
                </p>
                <dl className="m-answers-list">
                  {QUESTIONS.map((Q, i) => {
                    const a = (answers[m.id] ?? [])[i]
                    const label = Q.options.find(([k]) => k === a)?.[1]
                    return (
                      <div key={i} className="m-answer-row">
                        <dt>{t(Q.q)}</dt>
                        <dd>
                          <span>{label ? t(label) : '—'}</span>
                          <button type="button" className="m-link" onClick={() => go({ name: 'questions', id: m.id, step: i as 0 | 1 })} aria-label={`${t('change')}: ${t(Q.q)}`}>
                            {t('change')}
                          </button>
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </After>
            </>
          ),
          foot: <Btn onClick={() => go({ name: 'todo', id: m.id })}>{t('whatToDo')}</Btn>,
        }
      }

      case 'todo': {
        const m = byId(screen.id)
        const inFolder = m.folder === 'scam'
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('whatToDo')} />
              <After delay={380}>
                <p className="m-lede" data-read>
                  {inFolder ? t('advice_in_folder') : t('advice_scam')}
                </p>
              </After>
              <After delay={520} className="m-stack">
                {inFolder ? (
                  <Btn onClick={home}>{t('backToEmails')}</Btn>
                ) : (
                  <Btn icon="folder" onClick={() => moveToScam(m.id)}>
                    {t('moveToScam')}
                  </Btn>
                )}
              </After>
              <After delay={640}>
                <section aria-labelledby="h-trust" className="m-section">
                  <h2 className="m-eyebrow" id="h-trust">
                    {t('askTrusted')}
                  </h2>
                  {anna ? (
                    <div className="m-rows">
                      <Row icon="phone" label={tf('callName', { name: anna })} onClick={() => callTrusted(m.id)} />
                      <Row icon="send" label={tf('sendSummaryTo', { name: anna })} onClick={() => go({ name: 'ask', id: m.id })} />
                    </div>
                  ) : (
                    <div className="m-rows">
                      <Row icon="phone" label={t('chooseSomeone')} sub={t('noTrustedBody')} onClick={() => go({ name: 'settings' })} />
                    </div>
                  )}
                </section>
                <section aria-labelledby="h-more" className="m-section">
                  <h2 className="m-eyebrow" id="h-more">
                    {t('moreOptions')}
                  </h2>
                  <div className="m-rows">
                    {m.learn && <Row icon="book" label={t('learnScam')} onClick={() => go({ name: 'learn', id: m.id })} />}
                    <Row icon="undo" label={t('notScam')} onClick={() => go({ name: 'wrong', id: m.id })} />
                  </div>
                </section>
              </After>
            </>
          ),
        }
      }

      case 'done': {
        const m = byId(screen.id)
        return {
          tone: 'calm',
          body: (
            <div className="m-centered">
              <div className="m-cat-md">
                <ScribbleCat mood="happy" />
              </div>
              <Reveal as="h1" className="m-title m-center" text={t('doneTitle')} />
              <After delay={420}>
                <p className="m-lede m-center" data-read>
                  {t('doneBody')}
                </p>
              </After>
              {m.tip && (
                <After delay={620}>
                  <div className="m-card m-tip" data-read>
                    <span className="m-eyebrow">{t('goodToKnow')}</span>
                    <p>{t(m.tip)}</p>
                  </div>
                </After>
              )}
            </div>
          ),
          foot: (
            <>
              <Btn onClick={home}>{t('backToEmails')}</Btn>
              {m.learn && (
                <Btn kind="secondary" icon="book" onClick={() => go({ name: 'learn', id: m.id })}>
                  {t('learnScam')}
                </Btn>
              )}
            </>
          ),
        }
      }

      case 'learn': {
        const m = byId(screen.id)
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('learnTitle')} />
              <After delay={380}>
                <ol className="m-steps-list">
                  {m.learn?.signs.map((s, i) => (
                    <li key={i} data-read aria-label={`${t(s.title)}. ${t(s.text)}`}>
                      <span className="m-step-num" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>
                        <span className="m-sign-title">{t(s.title)}</span>
                        <span className="m-sign-text">{t(s.text)}</span>
                        <span className="m-quote">
                          <span className="m-quote-label">{t('inThisEmail')}</span> <span lang="en" dir="ltr">{s.clue}</span>
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                {m.learn && (
                  <div className="m-card m-instead" data-read>
                    <span className="m-eyebrow">{t('doInstead')}</span>
                    <p>{t(m.learn.instead)}</p>
                  </div>
                )}
                {readBtn}
              </After>
            </>
          ),
          foot: <Btn onClick={back}>{t('done')}</Btn>,
        }
      }

      case 'wrong': {
        const m = byId(screen.id)
        const inFolder = m.folder === 'scam'
        return {
          top: backBtn(),
          body: (
            <>
              <div className="m-cat-sm">
                <ScribbleCat mood="awake" />
              </div>
              <Reveal as="h1" className="m-title" text={t('wrongTitle')} />
              <After delay={400}>
                <p className="m-lede" data-read>
                  {inFolder ? t('wrongBody') : t('wrongBodySafe')}
                </p>
                {anna && <p className="m-small m-gap">{tf('wrongNote', { name: anna })}</p>}
              </After>
            </>
          ),
          foot: (
            <>
              <Btn
                onClick={() => {
                  setMails((ms) => ms.map((x) => (x.id === m.id ? { ...x, folder: 'inbox', verdict: 'safe', reasons: ['r_ok_personal'], simple: 'simple_safe' } : x)))
                  showToast(t('markedSafe'), () => {
                    setMails((ms) => ms.map((x) => (x.id === m.id ? m : x)))
                    setToast(null)
                  })
                  home()
                }}
              >
                {inFolder ? t('yesMoveBack') : t('notScam')}
              </Btn>
              {anna && (
                <Btn kind="secondary" onClick={() => go({ name: 'ask', id: m.id })}>
                  {tf('askFirst', { name: anna })}
                </Btn>
              )}
              <Btn kind="quiet" onClick={back}>
                {t('noKeep')}
              </Btn>
            </>
          ),
        }
      }

      case 'ask': {
        const m = byId(screen.id)
        if (!anna)
          return {
            top: backBtn(),
            body: (
              <>
                <Reveal as="h1" className="m-title" text={t('noTrustedTitle')} />
                <After delay={380}>
                  <p className="m-lede">{t('noTrustedBody')}</p>
                </After>
              </>
            ),
            foot: <Btn onClick={() => go({ name: 'settings' })}>{t('chooseSomeone')}</Btn>,
          }
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={tf('askTitle', { name: anna })} />
              <After delay={420}>
                <div className="m-person">
                  <Avatar initials={anna.slice(0, 1).toUpperCase()} size="l" />
                  <span>
                    <span className="m-person-name">{anna}</span>
                    <span className="m-small">{t('yourTrusted')}</span>
                  </span>
                </div>
                <h2 className="m-eyebrow">{tf('whatTheyGet', { name: anna })}</h2>
                <blockquote className="m-letter" data-read>
                  {tf('summaryMsg', { name: anna, sender: m.sender, subject: m.subject })}
                </blockquote>
                <p className="m-note">
                  <Icon name="lock" size={20} />
                  {tf('linksRemoved', { name: anna })}
                </p>
              </After>
            </>
          ),
          foot: (
            <>
              <Btn icon="send" onClick={() => go({ name: 'sent', id: m.id, mode: 'sent' })}>
                {tf('sendSummaryTo', { name: anna })}
              </Btn>
              <Btn kind="secondary" icon="phone" onClick={() => go({ name: 'sent', id: m.id, mode: 'calling' })}>
                {tf('callInstead', { name: anna })}
              </Btn>
            </>
          ),
        }
      }

      case 'sent': {
        const name = anna || t('trustedName')
        if (screen.mode === 'calling')
          return {
            tone: 'calm',
            body: (
              <div className="m-centered" role="status">
                <div className="m-calling">
                  <span className="m-ring" aria-hidden="true" />
                  <Avatar initials={name.slice(0, 1).toUpperCase()} size="l" />
                </div>
                <Reveal as="h1" className="m-title m-center" text={tf('callingName', { name })} />
                {trusted.phone && (
                  <p className="m-lede m-center" dir="ltr">
                    {trusted.phone}
                  </p>
                )}
                <p className="m-small m-center m-gap">{t('prototypeNote')}</p>
              </div>
            ),
            foot: (
              <Btn kind="scam" icon="phone" onClick={back}>
                {t('endCall')}
              </Btn>
            ),
          }
        return {
          tone: 'calm',
          body: (
            <div className="m-centered" role="status">
              <div className="m-cat-md">
                <ScribbleCat mood="happy" />
              </div>
              <Reveal as="h1" className="m-title m-center" text={tf('sentTitle', { name })} />
              <After delay={400}>
                <p className="m-lede m-center">{tf('sentBody', { name })}</p>
                <p className="m-small m-center m-gap">{t('prototypeNote')}</p>
              </After>
            </div>
          ),
          foot: (
            <>
              {screen.id !== undefined && (
                <Btn
                  onClick={() => {
                    stop()
                    backTo(['warning', 'anyway', 'read'])
                  }}
                >
                  {t('backToEmail')}
                </Btn>
              )}
              <Btn kind="secondary" onClick={home}>
                {t('backToEmails')}
              </Btn>
            </>
          ),
        }
      }

      case 'pause': {
        const m = byId(screen.id)
        const claim = m.claim ? t(m.claim) : m.sender
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={tf('pauseTitle', { claim })} />
              <After delay={450}>
                <div className="m-compare" data-read aria-label={`${t('pauseSays')} ${claim}. ${t('pauseGoes')} ${m.link?.domain}.`}>
                  <div>
                    <span className="m-small">{t('pauseSays')}</span>
                    <span className="m-compare-value">{claim.charAt(0).toUpperCase() + claim.slice(1)}</span>
                  </div>
                  <span className="m-compare-arrow" aria-hidden="true">
                    <Icon name="chevron" className="m-rot" />
                  </span>
                  <div>
                    <span className="m-small">{t('pauseGoes')}</span>
                    <span className="m-compare-value m-danger" dir="ltr">
                      <Icon name="warning" size={22} />
                      {m.link?.domain}
                    </span>
                  </div>
                </div>
                <p className="m-lede">{t('pauseCalm')}</p>
              </After>
            </>
          ),
          foot: (
            <>
              <Btn icon="shield" onClick={() => go({ name: 'todo', id: m.id })}>
                {t('keepSafe')}
              </Btn>
              {anna && (
                <Btn kind="secondary" onClick={() => go({ name: 'ask', id: m.id })}>
                  {tf('askFirst', { name: anna })}
                </Btn>
              )}
              <Btn kind="quiet" onClick={() => go({ name: 'help' })}>
                {t('otherChoicesHelp')}
              </Btn>
            </>
          ),
        }
      }

      case 'write':
        return {
          top: backBtn(t('cancel')),
          body: <Compose key={screen.replyTo ?? 'new'} replyTo={screen.replyTo !== undefined ? byId(screen.replyTo) : undefined} t={t} speak={speak} voice={voice} onSent={(to) => (showToast(fill(t('sentToast'), { name: to })), back())} />,
          foot: (
            <Btn type="submit" form="m-compose" icon="send">
              {t('send')}
            </Btn>
          ),
        }

      case 'help':
        return {
          top: backBtn(t('close')),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('helpTitle')} />
              <After delay={350} className="m-rows">
                <Row icon="play" label={t('introAgain')} sub={t('introAgainSub')} onClick={onReplayIntro} />
                <Row icon="shield" label={t('howCheck')} sub={t('howCheckSub')} onClick={() => go({ name: 'how' })} />
                <Row icon="warning" label={t('openedLink')} sub={t('openedLinkSub')} onClick={() => go({ name: 'oops' })} tone="scam" />
                <Row icon="mic" label={t('talkToCat')} sub={t('talkSub')} onClick={() => go({ name: 'voice' })} />
                {anna && <Row icon="phone" label={tf('callName', { name: anna })} onClick={() => callTrusted()} />}
                <Row icon="gear" label={t('settings')} onClick={() => go({ name: 'settings' })} />
              </After>
            </>
          ),
        }

      case 'how':
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('howTitle')} />
              <After delay={380}>
                <ul className="m-signs">
                  {(
                    [
                      ['send', 'how1t', 'how1'],
                      ['lock', 'how2t', 'how2'],
                      ['speaker', 'how3t', 'how3'],
                    ] as [IconName, StringKey, StringKey][]
                  ).map(([icon, title, text]) => (
                    <li key={title} className="m-sign" data-read aria-label={`${t(title)}. ${t(text)}`}>
                      <span className="m-sign-icon m-sign-icon-ink">
                        <Icon name={icon} />
                      </span>
                      <span>
                        <span className="m-sign-title">{t(title)}</span>
                        <span className="m-sign-text">{t(text)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="m-small">{t('howNote')}</p>
                {readBtn}
              </After>
            </>
          ),
        }

      case 'oops':
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('oopsTitle')} />
              <After delay={420}>
                <ol className="m-steps-list">
                  {(['oops1', 'oops2', 'oops3'] as StringKey[]).map((k, i) => (
                    <li key={k} data-read>
                      <span className="m-step-num" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="m-sign-text m-strong">{t(k)}</span>
                    </li>
                  ))}
                  <li data-read>
                    <span className="m-step-num" aria-hidden="true">
                      4
                    </span>
                    <span className="m-sign-text m-strong">{anna ? tf('oops4', { name: anna }) : t('oops4none')}</span>
                  </li>
                </ol>
                {readBtn}
              </After>
            </>
          ),
          foot: anna ? (
            <Btn icon="phone" onClick={() => callTrusted()}>
              {tf('callName', { name: anna })}
            </Btn>
          ) : undefined,
        }

      case 'settings':
        return {
          top: backBtn(),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('settings')} />
              <After delay={300}>
                <section className="m-section" aria-labelledby="s-trust">
                  <h2 className="m-eyebrow" id="s-trust">
                    {t('yourTrusted')}
                  </h2>
                  <TrustedEditor
                    t={t}
                    value={trusted}
                    onSave={(v) => {
                      setTrusted(v)
                      onPrefsChange({ trustedName: v.name, trustedPhone: v.phone })
                    }}
                  />
                </section>
                <section className="m-section" aria-labelledby="s-safe">
                  <h2 className="m-eyebrow" id="s-safe">
                    {t('safety')}
                  </h2>
                  <div className="m-group">
                    <Toggle label={t('lockLinks')} badge={t('recommended')} checked={lockLinks} onChange={setLockLinks} />
                    <Toggle label={t('emptyAfter30')} checked={autoEmpty} onChange={setAutoEmpty} />
                  </div>
                </section>
                <section className="m-section" aria-labelledby="s-comfort">
                  <h2 className="m-eyebrow" id="s-comfort">
                    {t('comfort')}
                  </h2>
                  <div className="m-group">
                    <button type="button" className="m-setting-row" onClick={() => setSheet('size')} aria-haspopup="dialog">
                      <span>{t('textSize')}</span>
                      <span className="m-setting-value">{t((['sizeNormal', 'sizeLarge', 'sizeLargest'] as StringKey[])[sizeIndex])}</span>
                    </button>
                    <button type="button" className="m-setting-row" onClick={() => setSheet('lang')} aria-haspopup="dialog">
                      <span>{t('language')}</span>
                      <span className="m-setting-value">{langInfo.native}</span>
                    </button>
                    <Toggle label={t('contrast')} checked={highContrast} onChange={setContrast} />
                    <Toggle label={t('lessMotion')} checked={lessMotion} onChange={setLessMotion} />
                    <Toggle label={t('voiceSetting')} sub={t('voiceSettingSub')} checked={voiceButton} onChange={setVoiceButton} />
                  </div>
                </section>
              </After>
            </>
          ),
        }

      case 'voice': {
        const m = lastMail ? byId(lastMail) : null
        const suggestions: StringKey[] = ['sayIsSafe', 'sayWhy', 'whatToDo', 'sayRead']
        return {
          top: backBtn(t('close')),
          body: (
            <>
              <Reveal as="h1" className="m-title" text={t('talkToCat')} />
              {m && <p className="m-small">{`${t('about')}: ${m.subject}`}</p>}
              <div className="m-convo" aria-live="polite">
                {heard ? (
                  <>
                    <div className="m-bubble m-bubble-you">
                      <span className="m-small">{t('youSaid')}</span>
                      <span>“{heard.you}”</span>
                    </div>
                    <div className="m-bubble m-bubble-cat">
                      <span className="m-bubble-cat-face">
                        <ScribbleCat mood="awake" />
                      </span>
                      <span>{heard.cat}</span>
                    </div>
                  </>
                ) : (
                  <div className="m-cat-md">
                    <ScribbleCat mood={voice.listening ? 'curious' : 'awake'} />
                  </div>
                )}
              </div>
              <h2 className="m-eyebrow">{t('youCanSay')}</h2>
              <div className="m-chips">
                {suggestions.map((k) => (
                  <button key={k} type="button" className="m-chip" onClick={() => answerVoice(t(k))}>
                    {t(k)}
                  </button>
                ))}
                {anna && (
                  <button type="button" className="m-chip" onClick={() => answerVoice(`call ${anna}`)}>
                    {tf('callName', { name: anna })}
                  </button>
                )}
              </div>
            </>
          ),
          foot: (
            <div className="m-mic-wrap">
              {voice.supported ? (
                <>
                  <button
                    type="button"
                    className="m-mic"
                    data-on={voice.listening ? 'true' : undefined}
                    aria-pressed={voice.listening}
                    onClick={() => (voice.listening ? voice.stop() : voice.listen(answerVoice))}
                  >
                    <Icon name={voice.listening ? 'stop' : 'mic'} size={32} />
                    <span className="visually-hidden">{voice.listening ? t('stopListening') : t('tapToTalk')}</span>
                  </button>
                  <span className="m-mic-label" aria-hidden="true">
                    {voice.listening ? t('listening') : t('tapToTalk')}
                  </span>
                </>
              ) : (
                <p className="m-small m-center">{t('voiceUnsupported')}</p>
              )}
              <p className="m-small m-center">
                <Icon name="lock" size={16} /> {t('neverLinks')}
              </p>
            </div>
          ),
        }
      }
    }
  }

  const view = render()
  const sheetMail = 'id' in screen && screen.id !== undefined ? byId(screen.id) : lastMail ? byId(lastMail) : null
  const inboxScams = mails.filter((m) => m.folder === 'inbox' && m.verdict === 'scam')

  return (
    <div className="m-app" data-tone={view.tone}>
      <div className="m-col">
        <header className="m-top">{view.top}</header>
        <main className="m-main" ref={mainRef} key={stack.length + screen.name + ('step' in screen ? screen.step : '')}>
          {view.body}
        </main>
        {(view.foot || view.comfort) && (
          <footer className="m-foot">
            {view.foot && <div className="m-foot-actions">{view.foot}</div>}
            {view.comfort && comfortBar}
          </footer>
        )}
      </div>

      <div className="m-toast-zone" role="status" aria-live="polite">
        {toast && (
          <div className="m-toast" key={toast.id}>
            <Icon name="check" size={20} />
            <span>{toast.text}</span>
            {toast.undo && (
              <button type="button" onClick={toast.undo}>
                {t('undo')}
              </button>
            )}
          </div>
        )}
      </div>

      <Sheet open={sheet === 'size'} title={t('textSize')} onClose={() => setSheet(null)} closeLabel={t('done')} footer={<Btn onClick={() => setSheet(null)}>{t('done')}</Btn>}>
        <div className="m-choices" role="radiogroup" aria-label={t('textSize')}>
          {(['sizeNormal', 'sizeLarge', 'sizeLargest'] as StringKey[]).map((k, i) => (
            <label key={k} className="m-choice">
              <input type="radio" name="m-size" checked={sizeIndex === i} onChange={() => setSize(i)} />
              <span className="m-choice-sample" style={{ fontSize: `${SIZES[i] * 1.5}px` }} aria-hidden="true">
                Aa
              </span>
              <span className="m-choice-label">{t(k)}</span>
              <Icon name="check" className="m-choice-check" />
            </label>
          ))}
        </div>
        <p className="m-letter" style={{ fontSize: `${SIZES[sizeIndex] * 1.1}px` }}>
          {fill(t('sizePreview'), { name: prefs.name || t('trustedName') })}
        </p>
      </Sheet>

      <Sheet open={sheet === 'lang'} title={t('language')} onClose={() => setSheet(null)} closeLabel={t('done')} footer={<Btn onClick={() => setSheet(null)}>{t('done')}</Btn>}>
        <div className="m-choices m-choices-scroll" role="radiogroup" aria-label={t('language')}>
          {languages.map((l) => (
            <label key={l.code} className="m-choice">
              <input type="radio" name="m-lang" checked={lang === l.code} onChange={() => setLang(l.code)} />
              <span className="m-choice-label" lang={l.code === 'sga' ? 'en' : l.code} dir={l.rtl ? 'rtl' : 'ltr'}>
                {l.native}
              </span>
              <span className="m-small">{l.english}</span>
              <Icon name="check" className="m-choice-check" />
            </label>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'check'} title={t('inboxCheck')} onClose={() => setSheet(null)} closeLabel={t('close')}>
        <div className="m-check-head">
          <span className="m-cat-xs">
            <ScribbleCat mood={inboxScams.length ? 'curious' : 'happy'} />
          </span>
          <p className="m-lede">{inboxScams.length ? t('scamsFound') : t('allSafe')}</p>
        </div>
        <div className="m-rows">
          {inboxScams.map((m) => (
            <Row
              key={m.id}
              icon="warning"
              tone="scam"
              label={m.sender}
              sub={m.subject}
              onClick={() => {
                setSheet(null)
                openMail(m)
              }}
            />
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'more'} title={t('moreOptions')} onClose={() => setSheet(null)} closeLabel={t('close')}>
        {sheetMail && (
          <div className="m-rows">
            {canSpeak && (
              <Row
                icon="speaker"
                label={t('readToMe')}
                onClick={() => {
                  setSheet(null)
                  readScreen()
                }}
              />
            )}
            <Row icon="globe" label={t('language')} onClick={() => setSheet('lang')} />
            {anna && (
              <Row
                icon="send"
                label={tf('askFirst', { name: anna })}
                onClick={() => {
                  setSheet(null)
                  go({ name: 'ask', id: sheetMail.id })
                }}
              />
            )}
            <Row
              icon="folder"
              label={t('moveToScam')}
              onClick={() => {
                setSheet(null)
                moveToScam(sheetMail.id)
              }}
            />
            <Row
              icon="undo"
              label={t('notScam')}
              onClick={() => {
                setSheet(null)
                go({ name: 'wrong', id: sheetMail.id })
              }}
            />
          </div>
        )}
      </Sheet>

      <Sheet
        open={sheet === 'confirm'}
        title={t('confirmMove')}
        onClose={() => setSheet(null)}
        closeLabel={t('no')}
        footer={
          <div className="m-pair">
            <Btn kind="secondary" onClick={() => setSheet(null)}>
              {t('no')}
            </Btn>
            <Btn
              onClick={() => {
                setSheet(null)
                if (lastMail) moveToScam(lastMail)
              }}
            >
              {t('yes')}
            </Btn>
          </div>
        }
      >
        <p className="m-lede">{t('sayYesNo')}</p>
      </Sheet>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

type T = (k: StringKey) => string

function MailRow({ m, t, onOpen, card }: { m: Mail; t: T; onOpen: () => void; card?: boolean }) {
  return (
    <button type="button" className="m-mail" data-card={card ? 'true' : undefined} onClick={onOpen}>
      <Avatar initials={m.initials} />
      <span className="m-mail-text">
        <span className="m-mail-line">
          <span className="m-mail-from">
            {m.unread && (
              <span className="m-dot">
                <span className="visually-hidden">{t('unread')}: </span>
              </span>
            )}
            {m.sender}
          </span>
          <span className="m-mail-time">{m.time}</span>
        </span>
        <span className="m-mail-subject">{m.subject}</span>
        {m.verdict === 'scam' ? (
          <span className="m-mail-tag">
            <VerdictTag verdict="scam" label={t('likelyScam')} size="s" />
          </span>
        ) : (
          <span className="m-mail-preview">{m.preview}</span>
        )}
      </span>
    </button>
  )
}

function EmailHead({ m, t, flagAddress, title }: { m: Mail; t: T; flagAddress?: boolean; title?: boolean }) {
  const Subject = title ? 'h1' : 'h2'
  return (
    <div className="m-head" lang="en" dir="ltr">
      <p className="m-small">
        {t('from')} {m.sender} · {m.time}
      </p>
      <p className="m-address">
        {m.address}
        {flagAddress && m.verdict === 'scam' && (
          <span className="m-flag">
            <Icon name="warning" size={16} />
            {t('oddAddress')}
          </span>
        )}
      </p>
      <Subject className="m-subject" tabIndex={title ? -1 : undefined} data-read>
        {m.subject}
      </Subject>
    </div>
  )
}

function CatCard({ mood, t, children }: { mood: ScribbleMood; t: T; children: ReactNode }) {
  return (
    <section className="m-card m-cat-card" aria-label={t('checkedThis')}>
      <div className="m-cat-card-head">
        <span className="m-cat-xs">
          <ScribbleCat mood={mood} />
        </span>
        <span className="m-small">{t('checkedThis')}</span>
      </div>
      {children}
    </section>
  )
}

function SimpleWords({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" className="m-link" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="chevron" size={18} className={open ? 'm-rot' : 'flip-rtl'} />
        {label}
      </button>
      {open && <p className="m-card-text m-rise">{text}</p>}
    </div>
  )
}

function Empty({ mood, title, body }: { mood: ScribbleMood; title: string; body: string }) {
  return (
    <div className="m-empty">
      <div className="m-cat-md">
        <ScribbleCat mood={mood} />
      </div>
      <p className="m-empty-title">{title}</p>
      <p className="m-muted">{body}</p>
    </div>
  )
}

// A slow breathing circle: 4 seconds in, 4 seconds out
function Breath({ t, still }: { t: T; still: boolean }) {
  const [inhale, setInhale] = useState(true)
  useEffect(() => {
    if (still) return
    const timer = window.setInterval(() => setInhale((v) => !v), 4000)
    return () => window.clearInterval(timer)
  }, [still])
  return (
    <div className="m-breath" aria-hidden="true">
      <span className="m-breath-ring" />
      <span className="m-breath-cat">
        <ScribbleCat mood="sleep" />
      </span>
      {!still && <span className="m-breath-label">{inhale ? t('breathIn') : t('breathOut')}</span>}
    </div>
  )
}

function Compose({
  replyTo,
  t,
  speak,
  voice,
  onSent,
}: {
  replyTo?: Mail
  t: T
  speak: (s: string) => void
  voice: ReturnType<typeof useListen>
  onSent: (to: string) => void
}) {
  const [to, setTo] = useState(replyTo ? replyTo.sender : '')
  const [text, setText] = useState(replyTo ? `Thank you, ${replyTo.sender.split(' ')[0]}. ` : '')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (to.trim()) onSent(to.trim())
  }
  return (
    <form id="m-compose" onSubmit={submit} className="m-compose">
      <Reveal as="h1" className="m-title" text={replyTo ? fill(t('replyTo'), { name: replyTo.sender.split(' ')[0] }) : t('newEmail')} />
      <After delay={300}>
        {replyTo ? (
          <div className="m-to">
            <span className="m-small">{t('toLabel')}</span>
            <span className="m-to-name">{replyTo.sender}</span>
            <VerdictTag verdict="safe" label={t('knownPerson')} size="s" />
          </div>
        ) : (
          <label className="m-field">
            <span className="m-field-label">{t('toLabel')}</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={t('toPlaceholder')} autoComplete="email" required />
          </label>
        )}
        <label className="m-field">
          <span className="m-field-label">{t('yourMessage')}</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} />
        </label>
        <div className="m-pair">
          {voice.supported && (
            <Btn kind="secondary" icon="mic" pressed={voice.listening} onClick={() => (voice.listening ? voice.stop() : voice.listen((s) => setText((v) => `${v}${v && !v.endsWith(' ') ? ' ' : ''}${s}`)))}>
              {voice.listening ? t('listening') : t('speakInstead')}
            </Btn>
          )}
          <Btn kind="secondary" icon="speaker" onClick={() => speak(text)}>
            {t('readBack')}
          </Btn>
        </div>
      </After>
    </form>
  )
}

function TrustedEditor({ t, value, onSave }: { t: T; value: { name: string; phone: string }; onSave: (v: { name: string; phone: string }) => void }) {
  const [editing, setEditing] = useState(!value.name)
  const [name, setName] = useState(value.name)
  const [phone, setPhone] = useState(value.phone)
  if (!editing)
    return (
      <div className="m-person m-card">
        <Avatar initials={value.name.slice(0, 1).toUpperCase()} size="l" />
        <span className="m-person-text">
          <span className="m-person-name">{value.name}</span>
          <span className="m-small" dir="ltr">
            {value.phone || t('yourTrusted')}
          </span>
        </span>
        <button type="button" className="m-chip" onClick={() => setEditing(true)} aria-label={`${t('change')}: ${t('yourTrusted')}`}>
          {t('change')}
        </button>
      </div>
    )
  return (
    <form
      className="m-card m-edit"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave({ name: name.trim(), phone: phone.trim() })
        setEditing(false)
      }}
    >
      <label className="m-field">
        <span className="m-field-label">{t('theirName')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>
      <label className="m-field">
        <span className="m-field-label">{t('theirPhone')}</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="off" dir="ltr" />
      </label>
      <Btn type="submit" disabled={!name.trim()}>
        {t('save')}
      </Btn>
    </form>
  )
}
