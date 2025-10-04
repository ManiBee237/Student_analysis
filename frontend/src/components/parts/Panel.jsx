import React from 'react'
const panelBorder = 'rgba(255,255,255,0.12)'
export default function Panel({ children, style={}, className='' }) {
  return (
    <section className={`rounded-xl p-4 shadow-sm ${className}`}
      style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${panelBorder}`, ...style }}>
      {children}
    </section>
  )
}
