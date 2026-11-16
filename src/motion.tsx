import type { CSSProperties, ReactNode } from 'react'

// Splits a line into words that rise and un-blur one after another
export function Reveal({ text, delay = 0, as: Tag = 'span', className, id }: { text: string; delay?: number; as?: 'span' | 'h1' | 'p'; className?: string; id?: string }) {
  const words = text.split(' ')
  return (
    <Tag className={className} id={id} aria-label={text} tabIndex={Tag === 'h1' ? -1 : undefined}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="ob-w" style={{ '--i': i, '--d': `${delay}ms` } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}

// Fades a block in after the title has landed
export function After({ delay, children, className = '' }: { delay: number; children: ReactNode; className?: string }) {
  return (
    <div className={`ob-after ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  )
}

