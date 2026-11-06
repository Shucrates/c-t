import { useEffect, useState, type ReactNode } from 'react'

type Mail = {
  id: number
  sender: string
  initials: string
  subject: string
  preview: string
  time: string
  unread?: boolean
  flagged?: boolean
  color: string
}

const mails: Mail[] = [
  {
    id: 1,
    sender: 'Security Centre',
    initials: 'SC',
    subject: 'Action required: Unusual sign-in',
    preview: 'We detected an unusual sign-in. Confirm your identity within 24 hours…',
    time: '10:42',
    unread: true,
    color: 'bg-violet-100 text-violet-700',
  },
  {
    id: 2,
    sender: 'Maya Chen',
    initials: 'MC',
    subject: 'Notes from today',
    preview: 'Here are the notes and next steps from our catch-up this morning.',
    time: '09:18',
    unread: true,
    color: 'bg-teal-100 text-teal-700',
  },
  {
    id: 3,
    sender: 'Parcel Track',
    initials: 'PT',
    subject: 'Your package is on hold',
    preview: 'A small customs charge is required before we can deliver your parcel.',
    time: 'Yesterday',
    flagged: true,
    color: 'bg-amber-100 text-amber-700',
  },
  {
    id: 4,
    sender: 'Figma',
    initials: 'FI',
    subject: 'Anika mentioned you',
    preview: 'Anika left a comment in “Mobile explorations”.',
    time: 'Yesterday',
    color: 'bg-pink-100 text-pink-700',
  },
  {
    id: 5,
    sender: 'Sam R.',
    initials: 'SR',
    subject: 'Dinner on Friday?',
    preview: 'There is a new place near the station I think you would like.',
    time: 'Mon',
    color: 'bg-sky-100 text-sky-700',
  },
]

const navItems = [
  ['inbox', 'Inbox', '4'],
  ['star', 'Starred', ''],
  ['clock', 'Snoozed', ''],
  ['send', 'Sent', ''],
  ['file', 'Drafts', '2'],
]

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    compose: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    inbox: <><path d="M4 4h16v16H4z" /><path d="M4 13h4l2 3h4l2-3h4" /></>,
    star: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    send: <><path d="m21 3-7 18-4-7-7-4Z" /><path d="m10 14 4-4" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h4" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    archive: <><path d="M4 7h16v14H4zM3 3h18v4H3zM9 12h6" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    back: <><path d="m15 18-6-6 6-6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6Z" /><path d="m9 12 2 2 4-4" /></>,
    warning: <><path d="M12 4 3 20h18Z" /><path d="M12 9v5M12 17h.01" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 5h11l-2 4 2 4H5" /></>,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function Cat({ awake = false, scanning = false }: { awake?: boolean; scanning?: boolean }) {
  return (
    <svg className={`cat-art ${awake ? 'cat-awake' : ''} ${scanning ? 'cat-scanning' : ''}`} viewBox="0 0 150 130" role="img" aria-label={awake ? 'c@t is awake' : 'c@t is sleeping'}>
      <path className="cat-fill" d="M42 104c-19-5-24-26-14-39 5-7 13-10 22-11-3-8-2-18 3-27l13 10c7-3 17-3 24 0l13-10c5 9 6 19 3 27 12 2 21 8 25 18 6 15-2 29-13 35-15 9-57 3-76-3Z" />
      <path d="M50 55c-4-9-2-19 3-28l13 10M90 37l13-10c5 9 7 19 3 28M38 63c-14 4-21 17-17 28 3 9 13 14 24 13" />
      {awake ? (
        <>
          <path d="m61 55 5 2-5 2M91 55l-5 2 5 2" />
          <path d="M74 65h5l-2.5 3Z" className="nose" />
          <path d="M76.5 68c0 5-5 6-8 3M76.5 68c0 5 5 6 8 3M56 66l-15-3M56 70l-16 3M97 66l15-3M97 70l16 3" />
        </>
      ) : (
        <>
          <path d="M59 57c3 3 6 3 9 0M86 57c3 3 6 3 9 0M76 64h4l-2 3Z" className="nose" />
          <text x="111" y="39" className="sleep-z">z</text>
          <text x="124" y="25" className="sleep-z sleep-z-big">z</text>
        </>
      )}
      <path className="tie" d="m71 78 6-5 6 5-3 7 7 17-10 7-10-7 7-17Z" />
      <path d="M50 107c9-10 8-22 3-29M104 108c-7-9-6-22-3-30M24 91c-10 7-3 19 9 16" />
      {scanning && <path className="scan-line" d="M31 47h92" />}
    </svg>
  )
}

function Assistant({ mail, onClose, onFlag }: { mail: Mail; onClose: () => void; onFlag: () => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [scanning, setScanning] = useState(false)

  const questions = [
    { eyebrow: 'First things first', text: 'Were you expecting this email?', yes: 'Yes, I was', no: 'No, I wasn’t' },
    { eyebrow: 'Good to know', text: `Do you know or recognize “${mail.sender}”?`, yes: 'Yes, I know them', no: 'No, I don’t' },
    { eyebrow: 'One last check', text: 'Would you like me to scan it for suspicious links and content?', yes: 'Scan this email', no: 'Not right now' },
  ]

  const answer = (value: boolean) => {
    const next = [...answers, value]
    setAnswers(next)
    if (step === 2 && value) {
      setScanning(true)
      window.setTimeout(() => {
        setScanning(false)
        setStep(3)
      }, 1800)
    } else if (step === 2) {
      setStep(4)
    } else {
      setStep(step + 1)
    }
  }

  const reset = () => {
    setStep(0)
    setAnswers([])
    setScanning(false)
  }

  const riskScore = mail.id === 1 ? 86 : answers[0] && answers[1] ? 18 : 64
  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 31 ? 'medium' : 'low'
  const riskLabel = riskLevel === 'high' ? 'High risk' : riskLevel === 'medium' ? 'Likely scam' : 'Low risk'
  const riskTitle = riskLevel === 'high' ? 'This email looks dangerous.' : riskLevel === 'medium' ? 'This email may be a scam.' : 'This email looks safer.'
  const riskAdvice = riskLevel === 'low'
    ? 'I did not find strong scam signals, but always check before sharing personal information.'
    : 'Do not click the link or reply to this email.'
  const goBack = () => {
    if (step > 0 && step < 3) {
      setStep(step - 1)
      setAnswers(answers.slice(0, -1))
    }
  }

  return (
    <aside className="assistant-bubbles" aria-live="polite">
      <div className="bubble-card">
        <div className="bubble-header">
          <div className="assistant-title">
            <span className="online-dot" />
            <span>c@t is here to help</span>
          </div>
          <button className="icon-button bubble-close" onClick={onClose} aria-label="Close c@t assistant"><Icon name="close" size={20} /></button>
        </div>

        {scanning ? (
          <div className="assistant-copy scan-copy">
            <span className="eyebrow">Checking carefully</span>
            <h2>Scanning this email…</h2>
            <p>I’m checking the sender, links, spelling and any language that tries to rush you.</p>
            <div className="scan-progress"><span /></div>
          </div>
        ) : step < 3 ? (
          <div className="assistant-copy" key={step}>
            <div className="question-count">Question {step + 1} of 3</div>
            <h2>{questions[step].text}</h2>
            <p>Choose the answer that feels right. There are no wrong answers.</p>
            <div className="choice-bubbles">
              <button className="choice-bubble yes" onClick={() => answer(true)}>
                <span className="choice-icon"><Icon name="check" size={23} /></span>
                <span>{questions[step].yes}</span>
              </button>
              <button className="choice-bubble no" onClick={() => answer(false)}>
                <span className="choice-icon"><Icon name="close" size={23} /></span>
                <span>{questions[step].no}</span>
              </button>
            </div>
            {step > 0 && <button className="back-answer" onClick={goBack}><Icon name="back" size={20} /> Go back and change my answer</button>}
          </div>
        ) : step === 3 ? (
          <div className="assistant-copy verdict">
            <span className={`risk-badge ${riskLevel}`}><Icon name={riskLevel === 'low' ? 'check' : 'warning'} size={17} /> {riskLabel}</span>
            <h2>{riskTitle}</h2>
            <p className={`clear-advice ${riskLevel}`}>{riskAdvice}</p>
            <div className={`score-card ${riskLevel}`}>
              <div className="score-ring"><strong>{riskScore}</strong><span>/100</span></div>
              <div><strong>{riskLabel}</strong><span>Risk score: {riskScore} out of 100</span></div>
            </div>

            <details className="analysis-details">
              <summary>
                <span><Icon name="search" size={20} /> View why I think this</span>
                <Icon name="chevron" size={20} />
              </summary>
              <div className="analysis-list">
                {riskLevel === 'low' ? (
                  <>
                    <div className="analysis-item good">
                      <span className="analysis-status"><Icon name="check" size={18} /></span>
                      <div><strong>Sender looks familiar</strong><p>The sender details match the person or organization shown.</p></div>
                    </div>
                    <div className="analysis-item good">
                      <span className="analysis-status"><Icon name="check" size={18} /></span>
                      <div><strong>No suspicious links found</strong><p>Any links appear to use the sender’s expected website address.</p></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="analysis-item bad">
                      <span className="analysis-status"><Icon name="warning" size={18} /></span>
                      <div><strong>Suspicious link</strong><p>The button goes to <b>secure-check.info</b>, not the company’s official website.</p></div>
                    </div>
                    <div className="analysis-item bad">
                      <span className="analysis-status"><Icon name="warning" size={18} /></span>
                      <div><strong>Sender does not match</strong><p>The display name says “Security Centre”, but the email address is from a different domain.</p></div>
                    </div>
                    <div className="analysis-item bad">
                      <span className="analysis-status"><Icon name="warning" size={18} /></span>
                      <div><strong>Tries to rush you</strong><p>It threatens to suspend your account within 24 hours. Scammers often create urgency.</p></div>
                    </div>
                  </>
                )}
                <div className="analysis-item good">
                  <span className="analysis-status"><Icon name="check" size={18} /></span>
                  <div><strong>No obvious spelling mistakes</strong><p>The spelling looks normal, but a well-written email can still be a scam.</p></div>
                </div>
              </div>
            </details>

            <button className={`answer flag-action ${riskLevel}`} onClick={onFlag}><Icon name="flag" size={20} /><span>Flag this email as suspicious</span></button>
            <button className="text-button" onClick={reset}>Check another way</button>
          </div>
        ) : (
          <div className="assistant-copy verdict">
            <span className="safe-badge"><Icon name="check" size={16} /> Check skipped</span>
            <h2>That’s okay. I’m still here.</h2>
            <p>If something feels wrong, do not click a link. You can ask me to check again at any time.</p>
            <button className="answer primary" onClick={reset}><span>Check this email now</span><Icon name="arrow" size={20} /></button>
          </div>
        )}
      </div>

      <div className="awake-cat">
        <Cat awake scanning={scanning} />
      </div>
    </aside>
  )
}

export default function App() {
  const [selectedId, setSelectedId] = useState(1)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [mobileMailOpen, setMobileMailOpen] = useState(false)
  const [mailView, setMailView] = useState<'primary' | 'flagged'>('primary')
  const [flaggedIds, setFlaggedIds] = useState<number[]>([3])
  const [translated, setTranslated] = useState(false)
  const mail = mails.find((item) => item.id === selectedId) ?? mails[0]
  const visibleMails = mailView === 'flagged' ? mails.filter((item) => flaggedIds.includes(item.id)) : mails
  const isFlagged = flaggedIds.includes(mail.id)

  useEffect(() => {
    setAssistantOpen(false)
    setTranslated(false)
  }, [selectedId])

  const showFlagged = () => {
    setMailView('flagged')
    if (flaggedIds.length > 0) setSelectedId(flaggedIds[0])
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <button className="icon-button menu-button" aria-label="Open menu"><Icon name="menu" /></button>
          <div className="brand-mark"><Icon name="send" size={18} /></div>
          <span>Postbird</span>
        </div>
        <label className="search">
          <Icon name="search" size={19} />
          <input placeholder="Search mail" aria-label="Search mail" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="profile">
          <button className="icon-button" aria-label="Settings"><Icon name="more" /></button>
          <span className="avatar">AR</span>
        </div>
      </header>

      <div className="workspace">
        <nav className="sidebar" aria-label="Mailbox navigation">
          <button className="compose"><Icon name="compose" size={19} /><span>Compose</span></button>
          <div className="nav-list">
            {navItems.map(([icon, label, count], index) => (
              <button className={`nav-item ${index === 0 && mailView === 'primary' ? 'selected' : ''}`} key={label} onClick={() => index === 0 && setMailView('primary')}>
                <Icon name={icon} size={18} /><span>{label}</span>{count && <em>{count}</em>}
              </button>
            ))}
            <button className={`nav-item flagged-nav ${mailView === 'flagged' ? 'selected' : ''}`} onClick={showFlagged}>
              <Icon name="flag" size={18} /><span>Flagged</span><em>{flaggedIds.length}</em>
            </button>
          </div>
          <div className="labels">
            <span>Labels</span><button aria-label="Add label">+</button>
          </div>
          <button className="nav-item"><span className="label-dot work" /><span>Work</span></button>
          <button className="nav-item"><span className="label-dot personal" /><span>Personal</span></button>
          <div className="storage">
            <div><span>Storage</span><span>4.2 / 15 GB</span></div>
            <div className="storage-bar"><span /></div>
          </div>
        </nav>

        <section className={`mail-list ${mobileMailOpen ? 'mobile-hidden' : ''}`}>
          <div className="list-heading">
            <div><h1>{mailView === 'flagged' ? 'Flagged emails' : 'Inbox'}</h1><span>{mailView === 'flagged' ? `${flaggedIds.length} need your attention` : '4 unread'}</span></div>
            <button className="icon-button"><Icon name="more" /></button>
          </div>
          <div className="filter-row">
            <button className={mailView === 'primary' ? 'active' : ''} onClick={() => setMailView('primary')}>Primary</button>
            <button className={mailView === 'flagged' ? 'active flagged-filter' : 'flagged-filter'} onClick={showFlagged}><Icon name="flag" size={14} /> Flagged ({flaggedIds.length})</button>
          </div>
          <div className="mail-items">
            {visibleMails.map((item) => (
              <button
                key={item.id}
                className={`mail-row ${selectedId === item.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(item.id); setMobileMailOpen(true) }}
              >
                <span className={`sender-avatar ${item.color}`}>{item.initials}</span>
                <span className="mail-summary">
                  <span className="mail-meta"><strong>{item.sender}</strong><small>{item.time}</small></span>
                  <span className="mail-subject">{item.subject}</span>
                  <span className="mail-preview">{item.preview}</span>
                  {flaggedIds.includes(item.id) && <span className="flagged-label"><Icon name="flag" size={12} /> Flagged as suspicious</span>}
                </span>
                {item.unread && <span className="unread-dot" />}
              </button>
            ))}
          </div>
        </section>

        <section className={`reader ${mobileMailOpen ? 'mobile-open' : ''}`}>
          <div className="reader-toolbar">
            <div>
              <button className="icon-button mobile-back" onClick={() => setMobileMailOpen(false)} aria-label="Back to inbox"><Icon name="back" /></button>
              <button className="icon-button" aria-label="Archive"><Icon name="archive" /></button>
              <button className="icon-button" aria-label="Delete"><Icon name="trash" /></button>
            </div>
            <button className="translate-button" onClick={() => setTranslated(!translated)}><Icon name="language" size={17} /> {translated ? 'Show original' : 'Translate'}</button>
          </div>
          <article className="message">
            <div className="subject-row">
              <div>
                <span className="message-label">Inbox</span>
                {isFlagged && <span className="message-flag"><Icon name="flag" size={13} /> Flagged</span>}
                <h2>{mail.subject}</h2>
              </div>
              <button className="icon-button" aria-label="Star message"><Icon name="star" /></button>
            </div>
            <div className="sender-row">
              <span className={`sender-avatar large ${mail.color}`}>{mail.initials}</span>
              <div><strong>{mail.sender}</strong><span>&lt;account@secure-check.info&gt;</span></div>
              <span className="sent-time">10:42 AM</span>
              <button className="icon-button"><Icon name="more" /></button>
            </div>
            <div className="message-body">
              {translated ? (
                <>
                  <div className="translation-note"><Icon name="language" size={16} /> Translated into plain English</div>
                  <p>Hello,</p>
                  <p>This email says someone signed into your account on a device it does not recognize. It says your account has been limited.</p>
                  <p>It asks you to confirm who you are within <strong>24 hours</strong>, or your account may be suspended.</p>
                </>
              ) : (
                <>
                  <p>Hello,</p>
                  <p>We detected a new sign-in to your account from an unrecognized device. For your security, access to your account has been temporarily limited.</p>
                  <p>Please confirm your identity within <strong>24 hours</strong> to prevent your account from being permanently suspended.</p>
                </>
              )}
              <button className="email-cta protected" onClick={() => setAssistantOpen(true)}>
                <Icon name="shield" size={17} />
                Check this link with c@t before opening
              </button>
              <p>If you do not recognize this activity, verify immediately using the button above.</p>
              <p>Regards,<br />Account Security Team</p>
              <div className="external-note"><Icon name="warning" size={16} /><span>This message was sent from outside your organization.</span></div>
            </div>
          </article>

          {!assistantOpen && (
            <button className="sleeping-cat" onClick={() => setAssistantOpen(true)} aria-label="Wake c@t to check this email">
              <span className="wake-hint">Click to check this email</span>
              <Cat />
            </button>
          )}
        </section>

        {assistantOpen && <Assistant mail={mail} onClose={() => setAssistantOpen(false)} onFlag={() => setFlaggedIds((ids) => ids.includes(mail.id) ? ids : [...ids, mail.id])} />}
      </div>
    </main>
  )
}
