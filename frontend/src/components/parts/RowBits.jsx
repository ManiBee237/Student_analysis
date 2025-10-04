import React from 'react'

const panelBorder = 'rgba(255,255,255,0.12)'

export function Avatar({ name }) {
  const initials = String(name || '?')
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0,2)
    .toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
      style={{
        background: 'linear-gradient(135deg, #134686 0%, #0b1220 100%)',
        border: `1px solid ${panelBorder}`,
        color: '#cfe7ff'
      }}
      aria-hidden
    >
      {initials}
    </div>
  )
}

export function StatBar({ value=0, max=100, label, color='#4bd4ff' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] opacity-80 mb-1">
        <span>{label}</span><span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full rounded bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66 inset` }}
        />
      </div>
    </div>
  )
}

export function Pill({ children, tone='info' }) {
  const tones = {
    info:    { c:'#9BE7FF', b:'#9BE7FF' },
    warn:    { c:'#FEB21A', b:'#FEB21A' },
    danger:  { c:'#ED3F27', b:'#ED3F27' },
    accent:  { c:'var(--color-accent)', b:'var(--color-accent)' },
    soft:    { c:'#C9D7EE', b:'rgba(255,255,255,0.25)' }
  }
  const t = tones[tone] || tones.info
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium border"
      style={{
        color: t.c, borderColor: t.b, background:'rgba(255,255,255,0.03)',
      }}
    >
      {children}
    </span>
  )
}
