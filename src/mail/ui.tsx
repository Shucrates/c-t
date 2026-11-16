import { useEffect, useId, useRef, type ReactNode } from 'react'

/* One stroke icon family on a 24px grid. Icons always sit next to words. */
const ICONS = {
  back: <path d="m15 5-7 7 7 7" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  text: (
    <>
      <path d="M3 18 8 6l5 12M4.6 14h6.8" />
      <path d="M15 18l3.5-8.5L22 18M16 15.2h5" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />,
  contrast: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5Z" />
    </>
  ),
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  warning: (
    <>
      <path d="M12 4.5 3 19.5h18Z" />
      <path d="M12 10v4.2M12 16.8v.2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6.2v5.3c0 4.3 2.9 7.4 7 9 4.1-1.6 7-4.7 7-9V6.2Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  phone: <path d="M6.5 3.5h3l1.5 4.2-2 1.5a11 11 0 0 0 5.8 5.8l1.5-2 4.2 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />,
  send: (
    <>
      <path d="M20.5 3.5 10 14" />
      <path d="m20.5 3.5-6.5 17-4-6.5-6.5-4Z" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <path d="m10 11 4 4M14 11l-4 4" />
    </>
  ),
  undo: (
    <>
      <path d="M9 7 4.5 11.5 9 16" />
      <path d="M5 11.5h9.5a5 5 0 0 1 0 10H12" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9.5" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.5v.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12.5" rx="2.2" />
      <path d="M3 10.5h18M7 15h3.5" />
    </>
  ),
  pen: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" />,
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5Z" />,
  wind: <path d="M3.5 9h11a3 3 0 1 0-3-3M3.5 15h14a3 3 0 1 1-3 3M3.5 12h7" />,
  sparkle: <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5 9 15M15 9l2.5-2.5" />,
}

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 24, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={`m-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  )
}

/* Pill buttons: one black primary per screen, outlined second, underlined text links for the rest */
export function Btn({
  children,
  onClick,
  kind = 'primary',
  icon,
  type = 'button',
  disabled,
  form,
  pressed,
}: {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'secondary' | 'quiet' | 'scam'
  icon?: IconName
  type?: 'button' | 'submit'
  disabled?: boolean
  form?: string
  pressed?: boolean
}) {
  return (
    <button className={`m-btn m-btn-${kind}`} type={type} onClick={onClick} disabled={disabled} form={form} aria-pressed={pressed}>
      {icon && <Icon name={icon} size={22} className="flip-rtl" />}
      <span>{children}</span>
    </button>
  )
}

/* A tappable list row: icon, label, optional subline, chevron */
export function Row({ icon, label, sub, onClick, tone }: { icon: IconName; label: string; sub?: string; onClick: () => void; tone?: 'scam' }) {
  return (
    <button className="m-row" type="button" onClick={onClick} data-tone={tone}>
      <span className="m-row-icon">
        <Icon name={icon} />
      </span>
      <span className="m-row-text">
        <span className="m-row-label">{label}</span>
        {sub && <span className="m-row-sub">{sub}</span>}
      </span>
      <Icon name="chevron" size={20} className="m-row-chev flip-rtl" />
    </button>
  )
}

/* Verdicts are the only colour in the app, and always carry an icon and words too */
export function VerdictTag({ verdict, label, size = 'm' }: { verdict: 'scam' | 'safe'; label: string; size?: 's' | 'm' }) {
  return (
    <span className={`m-tag m-tag-${verdict}`} data-size={size}>
      <Icon name={verdict === 'scam' ? 'warning' : 'shield'} size={size === 's' ? 16 : 20} />
      {label}
    </span>
  )
}

export function Avatar({ initials, size = 'm' }: { initials: string; size?: 'm' | 'l' }) {
  return (
    <span className="m-avatar" data-size={size} aria-hidden="true">
      {initials}
    </span>
  )
}

export function Toggle({ label, sub, checked, onChange, badge }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; badge?: string }) {
  return (
    <label className="m-toggle">
      <span className="m-toggle-text">
        <span className="m-toggle-label">{label}</span>
        {badge && <span className="m-badge">{badge}</span>}
        {sub && <span className="m-row-sub">{sub}</span>}
      </span>
      <input type="checkbox" role="switch" className="m-switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

/* Bottom sheet on a native <dialog>: focus trap, Escape and the backdrop come for free */
export function Sheet({ open, title, onClose, closeLabel, children, footer }: { open: boolean; title: string; onClose: () => void; closeLabel: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="m-sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="m-sheet-inner">
        <span className="m-grabber" aria-hidden="true" />
        <h2 className="m-sheet-title" id={titleId}>
          {title}
        </h2>
        <div className="m-sheet-body">{children}</div>
        {footer ?? <Btn kind="secondary" onClick={onClose}>{closeLabel}</Btn>}
      </div>
    </dialog>
  )
}

/* Step strokes, shared with onboarding's look */
export function Steps({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div className="m-steps" role="img" aria-label={label}>
      <span className="m-steps-label" aria-hidden="true">
        {label}
      </span>
      <span className="m-steps-track" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="m-seg" data-filled={i < index ? 'true' : undefined} />
        ))}
      </span>
    </div>
  )
}
