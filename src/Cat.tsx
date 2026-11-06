export type CatMood = 'idle' | 'thinking' | 'alert' | 'happy' | 'sleep'

// The c@t mascot: a round, minimal cat with a collar tag shaped like "@".
// Colours come from CSS variables (--cat-body, --cat-ink, --cat-eye, --cat-accent)
// so the same drawing works on the dark island and on light screens.
export function Cat({ mood = 'idle', size = 64, label }: { mood?: CatMood; size?: number; label?: string }) {
  const eyesOpen = mood !== 'happy' && mood !== 'sleep'
  return (
    <svg
      className={`cat cat-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path className="cat-tail" d="M70 86c14 2 22-6 21-17-1-8-8-11-12-7" />
      <ellipse className="cat-body" cx="50" cy="84" rx="25" ry="15" />
      <g className="cat-head">
        <path className="cat-ear cat-ear-l" d="M22 40 25 13c.3-2.6 3-3.6 4.8-1.8L44 25Z" />
        <path className="cat-ear cat-ear-r" d="M78 40 75 13c-.3-2.6-3-3.6-4.8-1.8L56 25Z" />
        <ellipse className="cat-body" cx="50" cy="47" rx="31" ry="27" />
        <path className="cat-ear-inner" d="M27.5 31 29 18l8.5 8.2ZM72.5 31 71 18l-8.5 8.2Z" />
        {eyesOpen ? (
          <g className="cat-eyes">
            <g className="cat-eye-l">
              <ellipse className="cat-eye" cx="38" cy="47" rx={mood === 'alert' ? 6.2 : 5.2} ry={mood === 'alert' ? 7.4 : 6.6} />
              <circle className="cat-glint" cx="40" cy="44.5" r="1.7" />
            </g>
            <g className="cat-eye-r">
              <ellipse className="cat-eye" cx="62" cy="47" rx={mood === 'alert' ? 6.2 : 5.2} ry={mood === 'alert' ? 7.4 : 6.6} />
              <circle className="cat-glint" cx="64" cy="44.5" r="1.7" />
            </g>
          </g>
        ) : (
          <path
            className="cat-line"
            d={mood === 'happy' ? 'M32 49c2-5 10-5 12 0M56 49c2-5 10-5 12 0' : 'M32 48c3 3 9 3 12 0M56 48c3 3 9 3 12 0'}
          />
        )}
        <path className="cat-nose" d="M47 56.5h6l-3 3.2Z" />
        <path className="cat-line" d={mood === 'alert' ? 'M46 64.5c2.6-2 5.4-2 8 0' : 'M50 59.7c0 3-4.4 4-6 1.6M50 59.7c0 3 4.4 4 6 1.6'} />
        {mood === 'happy' && (
          <g className="cat-blush">
            <ellipse cx="31" cy="58" rx="5" ry="3" />
            <ellipse cx="69" cy="58" rx="5" ry="3" />
          </g>
        )}
      </g>
      <path className="cat-collar" d="M33 70c11 4.5 23 4.5 34 0" />
      <circle className="cat-tag" cx="50" cy="76.5" r="5.2" />
      <text className="cat-tag-at" x="50" y="79.2" textAnchor="middle">@</text>
      {mood === 'sleep' && (
        <g className="cat-zz">
          <text x="80" y="22">z</text>
          <text x="89" y="11">z</text>
        </g>
      )}
      {mood === 'thinking' && <rect className="cat-scan" x="17" y="36" width="66" height="2.4" rx="1.2" />}
    </svg>
  )
}

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true">
        <Cat mood="idle" size={36} />
      </span>
      <span className="logo-word">c@t</span>
    </span>
  )
}
