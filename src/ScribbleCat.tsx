import { useEffect, useId, useRef } from 'react'

export type ScribbleMood = 'sleep' | 'waking' | 'awake' | 'curious' | 'happy' | 'alert'

// The onboarding c@t: one black, slightly lumpy blob whose white inner line draws the ears
// and curls round like the inside of an "@", with the tail as the @'s last flick.
// "Line boil": the whole drawing is pushed through a displacement filter whose noise seed
// changes a few times a second, so the outline wobbles like a hand-drawn animation frame.
export function ScribbleCat({ mood, className = '' }: { mood: ScribbleMood; className?: string }) {
  const id = useId().replace(/:/g, '')
  const boilRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const el = boilRef.current
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'
    if (reduce) return
    // Waking is the energetic moment: the line boils faster and harder
    const fast = mood === 'waking' || mood === 'happy'
    let frame = 0
    const timer = window.setInterval(() => {
      frame = (frame + 1) % 3
      el.setAttribute('filter', `url(#${id}-${fast ? 'loud' : 'soft'}-${frame})`)
    }, fast ? 90 : 150)
    return () => window.clearInterval(timer)
  }, [mood, id])

  const eyes =
    mood === 'sleep' ? (
      <g className="sc-eyes-closed">
        <path d="M91 122q9.5 7.5 19 0" />
        <path d="M130 118q9.5 7.5 19 0" />
      </g>
    ) : mood === 'happy' ? (
      <g className="sc-eyes-closed sc-draw" key="happy">
        <path pathLength={1} d="M91 125q9.5-10 19 0" />
        <path pathLength={1} d="M130 121q9.5-10 19 0" />
      </g>
    ) : (
      <g className="sc-eyes-open" key="open">
        <g className="sc-eye">
          <ellipse cx="100.5" cy="121" rx="8" ry="10" />
          <ellipse className="sc-pupil" cx="102" cy="122" rx="3.6" ry="6.2" />
        </g>
        <g className="sc-eye">
          <ellipse cx="139.5" cy="117" rx="8" ry="10" />
          <ellipse className="sc-pupil" cx="141" cy="118" rx="3.6" ry="6.2" />
        </g>
      </g>
    )

  return (
    <svg className={`sc sc-${mood} ${className}`} viewBox="-10 -44 260 240" aria-hidden="true">
      <defs>
        {[0, 1, 2].map((n) => (
          <filter key={`s${n}`} id={`${id}-soft-${n}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={n * 7 + 1} />
            <feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
        {[0, 1, 2].map((n) => (
          <filter key={`l${n}`} id={`${id}-loud-${n}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={n * 11 + 3} />
            <feDisplacementMap in="SourceGraphic" scale="6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>

      <g ref={boilRef} filter={`url(#${id}-soft-0)`}>
        <g className="sc-pose">
          <path className="sc-tail" d="M194 170c5-10 24-12 32-3 6 7 1 18-12 19-13 1-24-7-20-16Z" />
          <g className="sc-breathe">
            <path className="sc-body" d="M42 110C34 60 92 24 148 26c56 2 86 46 76 92-8 40-52 60-100 58-48-2-74-24-82-66Z" />
            <path className="sc-line" d="M74 122 84 70q2-8 8-3l20 21q12-4 24-2l16-22q5-6 9 1c15 27 25 53 19 77-3 12-10 20-20 26" />
            {eyes}
            {mood === 'waking' ? (
              <ellipse className="sc-mouth-o" cx="121" cy="142" rx="4.5" ry="5.5" />
            ) : (
              <path className="sc-mouth" d={mood === 'happy' ? 'M112 138q9 10 18 0' : 'M115 140q6 5 12 0'} />
            )}
          </g>
        </g>

        {/* Zzz: each one is drawn on, then drifts up and away */}
        {mood === 'sleep' && (
          <g className="sc-zs">
            {[0, 1, 2].map((n) => (
              <g key={n} className="sc-z" style={{ animationDelay: `${n * 1.15}s` }}>
                <path pathLength={1} d="M0 0h12L0 14h12" style={{ animationDelay: `${n * 1.15}s` }} />
              </g>
            ))}
          </g>
        )}

        {/* Waking: scribbled "startle" marks pop out round the head */}
        {mood === 'waking' && (
          <g className="sc-marks sc-draw">
            <path pathLength={1} d="M70 40 54 22" />
            <path pathLength={1} d="M118 14 117-8" />
            <path pathLength={1} d="M176 30 192 12" />
            <path pathLength={1} d="M210 70l20-6" />
          </g>
        )}
      </g>
    </svg>
  )
}
