import React from 'react'
import { Tooltip } from 'recharts'

export const ACCENT = '#FEB21A'
export const CYAN = '#4bd4ff'
export const RED  = '#ED3F27'
const GRID = 'rgba(255,255,255,0.10)'

export function TechDefs() {
  return (
    <defs>
      {/* soft glow filter */}
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* neon line gradients */}
      <linearGradient id="gradAccent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={ACCENT} stopOpacity="0.15"/>
        <stop offset="100%" stopColor={ACCENT} stopOpacity="0.85"/>
      </linearGradient>

      <linearGradient id="gradCyan" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={CYAN} stopOpacity="0.15"/>
        <stop offset="100%" stopColor={CYAN} stopOpacity="0.85"/>
      </linearGradient>

      <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={RED} stopOpacity="0.15"/>
        <stop offset="100%" stopColor={RED} stopOpacity="0.85"/>
      </linearGradient>

      {/* area fills */}
      <linearGradient id="fillAccent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={ACCENT} stopOpacity="0.28"/>
        <stop offset="100%" stopColor={ACCENT} stopOpacity="0.04"/>
      </linearGradient>

      <linearGradient id="fillCyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CYAN} stopOpacity="0.28"/>
        <stop offset="100%" stopColor={CYAN} stopOpacity="0.04"/>
      </linearGradient>

      {/* bar gradient */}
      <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CYAN} stopOpacity="0.95"/>
        <stop offset="100%" stopColor={CYAN} stopOpacity="0.45"/>
      </linearGradient>
      <linearGradient id="barAccent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={ACCENT} stopOpacity="0.95"/>
        <stop offset="100%" stopColor={ACCENT} stopOpacity="0.45"/>
      </linearGradient>
    </defs>
  )
}

export function TechGrid() {
  return <rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrid)" />
}

// dashed grid lines via CartesianGrid props: stroke={GRID} strokeDasharray="3 3"
export const gridProps = { stroke: GRID, strokeDasharray: '3 3', opacity: 0.5 }

export function TechTooltip({ labelFormatter }) {
  return (
    <Tooltip
      cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '3 3' }}
      contentStyle={{
        background: 'rgba(12,18,32,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        color: '#e6e8ee',
        backdropFilter: 'blur(6px)',
        fontSize: 12
      }}
      labelFormatter={labelFormatter}
      itemStyle={{ padding: 0 }}
    />
  )
}
