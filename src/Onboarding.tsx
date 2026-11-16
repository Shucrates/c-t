import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { ScribbleCat, type ScribbleMood } from './ScribbleCat'
import { Reveal, After } from './motion'
import { languages, type LangCode } from './i18n'
import './onboarding.css'

export type OnboardingResult = {
  name: string
  sizeIndex: number
  highContrast: boolean
  trustedName: string
  trustedPhone: string
}

// Matches the app's text sizes (App.tsx SIZES)
const SIZES = [16, 19, 22]

const STEPS = ['welcome', 'name', 'answer', 'links', 'reading', 'trusted', 'done'] as const
type Step = (typeof STEPS)[number]
const COUNTED = STEPS.length - 1 // the welcome page is the cover, not a step

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const OUT_MS = 260

export function Onboarding({
  lang,
  onLangChange,
  onDone,
}: {
  lang: LangCode
  onLangChange: (lang: LangCode) => void
  onDone: (result: OnboardingResult) => void
}) {
  const [step, setStep] = useState<Step>('welcome')
  const [leaving, setLeaving] = useState<Step | null>(null)
  const [mood, setMood] = useState<ScribbleMood>('sleep')
  const [name, setName] = useState('')
  const [greeted, setGreeted] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [sizeIndex, setSizeIndex] = useState(0)
  const [highContrast, setHighContrast] = useState(() => window.matchMedia?.('(prefers-contrast: more)').matches ?? false)
  const [trustedName, setTrustedName] = useState('')
  const [trustedPhone, setTrustedPhone] = useState('')
  const timers = useRef<number[]>([])
  const nameRef = useRef<HTMLInputElement>(null)
  const trustRef = useRef<HTMLInputElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reduceMotion() ? 0 : ms))
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const index = STEPS.indexOf(step)
  const trimmed = name.trim()
  const trusted = trustedName.trim()

  // Scene change: the current words drift up and blur out, then the next scene writes itself in
  const go = (next: Step) => {
    if (leaving) return
    setLeaving(next)
    later(() => {
      setStep(next)
      setLeaving(null)
      if (next === 'done') setMood('happy')
      else if (next !== 'welcome') setMood('awake')
    }, OUT_MS)
  }

  // Move focus with the scene so screen readers hear the new question
  useEffect(() => {
    if (step === 'welcome') return
    const target = step === 'name' ? nameRef.current : step === 'trusted' ? trustRef.current : sceneRef.current?.querySelector<HTMLElement>('h1')
    target?.focus({ preventScroll: true })
  }, [step])

  const getStarted = () => {
    if (mood !== 'sleep') return
    setMood('waking')
    later(() => setMood('awake'), 900)
    later(() => go('name'), 1350)
  }

  const submitName = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmed || greeted) return
    nameRef.current?.blur()
    setGreeted(true)
    setMood('happy')
    later(() => go('answer'), 1700)
  }

  const back = () => {
    const prev = STEPS[index - 1]
    if (prev === 'name') setGreeted(false)
    go(prev)
  }

  const finish = () =>
    onDone({ name: trimmed, sizeIndex, highContrast, trustedName: trusted, trustedPhone: trustedPhone.trim() })

  const catSteps: Step[] = ['welcome', 'name', 'done']
  const showCat = catSteps.includes(step)
  const catLeaving = leaving !== null && !catSteps.includes(leaving)
  const catMood: ScribbleMood = step === 'name' && mood === 'awake' && inputFocused ? 'curious' : mood

  const primary: { label: string; onClick?: () => void; form?: string; disabled?: boolean } =
    step === 'welcome'
      ? { label: 'Get Started', onClick: getStarted, disabled: mood !== 'sleep' }
      : step === 'name'
        ? { label: 'Continue', form: 'ob-name-form', disabled: !trimmed || greeted }
        : step === 'trusted'
          ? { label: 'Continue', form: 'ob-trust-form', disabled: !trusted }
          : step === 'done'
            ? { label: 'Go to my emails', onClick: finish }
            : { label: 'Continue', onClick: () => go(STEPS[index + 1]) }

  return (
    <main className="ob" data-step={step} data-contrast={highContrast ? 'high' : undefined}>
      <div className="ob-col">
        <header className="ob-top">
          {step === 'welcome' ? (
            <label className="ob-lang">
              <span className="ob-lang-label">Choose language</span>
              <span className="ob-lang-pill">
                <GlobeIcon />
                <select value={lang} onChange={(e) => onLangChange(e.target.value as LangCode)}>
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native}
                    </option>
                  ))}
                </select>
                <svg className="ob-chev" viewBox="0 0 12 8" aria-hidden="true">
                  <path d="M1.5 1.5 6 6l4.5-4.5" />
                </svg>
              </span>
            </label>
          ) : (
            <div className="ob-nav">
              {step !== 'done' ? (
                <button type="button" className="ob-back" onClick={back} disabled={greeted && step === 'name'}>
                  <svg viewBox="0 0 10 16" aria-hidden="true">
                    <path d="M8 2 2 8l6 6" />
                  </svg>
                  Back
                </button>
              ) : (
                <span />
              )}
              <div className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={COUNTED} aria-valuenow={index} aria-label={`Step ${index} of ${COUNTED}`}>
                <span className="ob-progress-label" aria-hidden="true">
                  {index} of {COUNTED}
                </span>
                <span className="ob-progress-track" aria-hidden="true">
                  {Array.from({ length: COUNTED }, (_, i) => (
                    <span key={i} className="ob-seg" data-filled={i < index ? 'true' : undefined} />
                  ))}
                </span>
              </div>
            </div>
          )}
        </header>

        {showCat && (
          <div className="ob-stage" data-leaving={catLeaving ? 'true' : undefined}>
            <div className="ob-cat">
              <ScribbleCat mood={catMood} />
            </div>
          </div>
        )}

        <div className="ob-scene" ref={sceneRef} data-leaving={leaving ? 'true' : undefined} key={step}>
          {step === 'welcome' && (
            <section className="ob-copy">
              <Reveal as="h1" className="ob-title" text="Hello, I’m c@t." />
              <After delay={420}>
                <p className="ob-body">I read your emails with you. If one looks like a scam, I’ll tell you in plain words.</p>
              </After>
            </section>
          )}

          {step === 'name' && (
            <form className="ob-copy" id="ob-name-form" onSubmit={submitName} noValidate>
              {greeted ? (
                <Reveal as="h1" className="ob-title" key="hi" text={`Nice to meet you, ${trimmed}.`} />
              ) : (
                <Reveal as="h1" className="ob-title" id="ob-name-q" text="What should I call you?" />
              )}
              <After delay={greeted ? 300 : 380} key={greeted ? 'hi-body' : 'ask-body'}>
                <p className="ob-body">{greeted ? 'Let’s go through a few things together.' : 'Your first name is fine.'}</p>
              </After>
              <After delay={520}>
                <DashInput
                  inputRef={nameRef}
                  label="Your first name"
                  value={name}
                  readOnly={greeted}
                  autoComplete="given-name"
                  onChange={setName}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
              </After>
            </form>
          )}

          {step === 'answer' && (
            <section className="ob-copy ob-copy-left">
              <Reveal as="h1" className="ob-title" text="My answer is always at the top." />
              <After delay={400}>
                <p className="ob-body">Every email you open, I check first. Look up here before you read.</p>
              </After>
              <After delay={600} className="ob-art">
                <AnswerArt />
              </After>
            </section>
          )}

          {step === 'links' && (
            <section className="ob-copy ob-copy-left">
              <Reveal as="h1" className="ob-title" text="I lock risky links." />
              <After delay={360}>
                <p className="ob-body">If a link looks dangerous, it stays shut until we’ve looked at it together. Nothing opens by accident.</p>
              </After>
              <After delay={560} className="ob-art">
                <LinkArt />
              </After>
            </section>
          )}

          {step === 'reading' && (
            <section className="ob-copy ob-copy-left">
              <Reveal as="h1" className="ob-title" text="Is this easy to read?" />
              <After delay={360} className="ob-art">
                <div className="ob-letter" style={{ fontSize: `${SIZES[sizeIndex] * 1.15}px` }}>
                  Dear {trimmed || 'Arthur'}, see you on Sunday. Love, Anna
                </div>
              </After>
              <After delay={520}>
                <fieldset className="ob-sizes">
                  <legend className="ob-label">Text size</legend>
                  <div className="ob-seg-control">
                    {SIZES.map((px, i) => (
                      <label key={px} className="ob-size">
                        <input type="radio" name="ob-size" checked={sizeIndex === i} onChange={() => setSizeIndex(i)} />
                        <span style={{ fontSize: `${20 + i * 6}px` }} aria-hidden="true">
                          A
                        </span>
                        <span className="visually-hidden">{['Normal', 'Large', 'Largest'][i]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="ob-switch-row">
                  <span>
                    <span className="ob-switch-title">Strong contrast</span>
                    <span className="ob-switch-note">Darker text and thicker lines</span>
                  </span>
                  <input type="checkbox" role="switch" className="ob-switch" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
                </label>
              </After>
            </section>
          )}

          {step === 'trusted' && (
            <form
              className="ob-copy ob-copy-left"
              id="ob-trust-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                if (trusted) go('done')
              }}
            >
              <Reveal as="h1" className="ob-title" text="Who do you trust to help?" />
              <After delay={380}>
                <p className="ob-body">If an email worries you, I can ask them for you. I’ll only contact them when you say so.</p>
              </After>
              <After delay={540} className="ob-fields">
                <DashInput inputRef={trustRef} label="Their name" value={trustedName} autoComplete="off" onChange={setTrustedName} align="start" small />
                <DashInput label="Their phone number" value={trustedPhone} type="tel" autoComplete="off" onChange={setTrustedPhone} align="start" small />
                <p className="ob-tip">Tip: it’s easiest to set this up together with them.</p>
              </After>
            </form>
          )}

          {step === 'done' && (
            <section className="ob-copy">
              <Reveal as="h1" className="ob-title" text={trimmed ? `You’re all set, ${trimmed}.` : 'You’re all set.'} />
              <After delay={420}>
                <ul className="ob-checks">
                  {['I check every email first', 'Risky links stay locked', ...(trusted ? [`${trusted} is your trusted person`] : []), 'You can change all this in Help'].map((item, i) => (
                    <li key={item} style={{ '--i': i } as CSSProperties}>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path pathLength={1} d="M4 10.5 8.2 14.5 16 5.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </After>
            </section>
          )}
        </div>

        <footer className="ob-foot">
          <button className="ob-button" type={primary.form ? 'submit' : 'button'} form={primary.form} onClick={primary.onClick} disabled={primary.disabled || leaving !== null}>
            {primary.label}
          </button>
          {step === 'trusted' && (
            <button type="button" className="ob-skip" onClick={() => go('done')}>
              Skip for now
            </button>
          )}
        </footer>
      </div>
    </main>
  )
}

// Serif text written straight onto a short dash, like filling in a paper form
function DashInput({
  label,
  value,
  onChange,
  inputRef,
  readOnly,
  type = 'text',
  autoComplete,
  onFocus,
  onBlur,
  align = 'center',
  small,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  inputRef?: React.Ref<HTMLInputElement>
  readOnly?: boolean
  type?: 'text' | 'tel'
  autoComplete?: string
  onFocus?: () => void
  onBlur?: () => void
  align?: 'center' | 'start'
  small?: boolean
}) {
  return (
    <label className="ob-dash" data-align={align} data-small={small ? 'true' : undefined}>
      <span className={align === 'center' ? 'visually-hidden' : 'ob-label'}>{label}</span>
      <input
        ref={inputRef}
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete={autoComplete}
        autoCapitalize={type === 'tel' ? undefined : 'words'}
        enterKeyHint="done"
        maxLength={type === 'tel' ? 20 : 40}
        spellCheck={false}
        value={value}
        readOnly={readOnly}
        style={align === 'center' ? { width: `${Math.max(value.length, 4) + 1.5}ch` } : undefined}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </label>
  )
}

// A small email with c@t's verdict pinned on top; the verdict flips between safe and scam
function AnswerArt() {
  const [scam, setScam] = useState(false)
  useEffect(() => {
    if (reduceMotion()) return
    const t = window.setInterval(() => setScam((s) => !s), 2600)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="ob-card" aria-hidden="true">
      <div className="ob-verdict" key={scam ? 'scam' : 'safe'}>
        <span className="ob-verdict-cat">
          <ScribbleCat mood={scam ? 'curious' : 'awake'} />
        </span>
        <span className="ob-verdict-text">{scam ? 'Likely a scam' : 'Looks safe'}</span>
      </div>
      <div className="ob-mail">
        <span className="ob-mail-from">From: {scam ? 'Your Bank Support' : 'Anna'}</span>
        <span className="ob-line" style={{ width: '92%' }} />
        <span className="ob-line" style={{ width: '78%' }} />
        <span className="ob-line" style={{ width: '64%' }} />
      </div>
    </div>
  )
}

// A suspicious link that gets padlocked and scribbled through
function LinkArt() {
  return (
    <div className="ob-card ob-link-card" aria-hidden="true">
      <span className="ob-mail-from">Your account is on hold. Please</span>
      <div className="ob-risky">
        <span className="ob-risky-text">
          Confirm my identity →
          <svg className="ob-strike" viewBox="0 0 200 20" preserveAspectRatio="none">
            <path pathLength={1} d="M2 12C40 6 70 15 110 9s70 2 88-1" />
          </svg>
        </span>
      </div>
      <div className="ob-locked">
        <svg className="ob-lock" viewBox="0 0 24 24">
          <path className="ob-shackle" d="M8 11V8a4 4 0 0 1 8 0v3" />
          <rect x="5" y="11" width="14" height="10" rx="2.5" />
        </svg>
        Locked by c@t
      </div>
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg className="ob-globe" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M2.75 12h18.5M12 2.75c2.6 2.6 3.8 5.7 3.8 9.25S14.6 18.65 12 21.25M12 2.75C9.4 5.35 8.2 8.45 8.2 12s1.2 6.65 3.8 9.25" />
    </svg>
  )
}
