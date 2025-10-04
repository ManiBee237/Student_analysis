// src/components/LeftTabs.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'

const panelBorder = 'rgba(255,255,255,0.12)'

const tabs = [
  { key: 'overview',       label: 'Overview',       to: 'overview' },       // if you have a route
  { key: 'prediction',     label: 'Prediction',     to: 'prediction' },
  { key: 'classification', label: 'Classification', to: 'classification' },
  { key: 'clustering',     label: 'Clustering',     to: 'clustering' },
  { key: 'insights',       label: 'Insights',       to: 'insights' },
  { key: 'upload',         label: 'Upload CSV',     to: 'upload' },
  { key: 'settings',       label: 'Settings',       to: 'settings' },       // if you have a route
]

const linkClass = ({ isActive }) =>
  `w-full text-left px-3 py-2.5 rounded-md transition-colors group flex items-center gap-2
   ${isActive
     ? 'bg-[rgba(19,70,134,0.38)] text-[#9BE7FF] border'
     : 'hover:bg-[rgba(255,255,255,0.06)] opacity-90'}`
  
export default function LeftTabs() {
  return (
    // sticky, full-height, its own scroll if too tall
    <aside
      className="shrink-0 flex flex-col sticky top-0 h-screen"
      style={{
        width: 260,
        borderRight: `1px solid ${panelBorder}`,
        background: 'linear-gradient(180deg, rgba(13,21,37,0.80) 0%, rgba(13,21,37,0.60) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header (also sticky within the sticky aside) */}
      <div
        className="px-4 pt-4 pb-3 sticky top-0 z-10"
        style={{ borderBottom: `1px solid ${panelBorder}`, background: 'rgba(13,21,37,0.72)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4bd4ff 0%, #00a2ff 100%)',
              boxShadow: '0 0 14px #00cfff66'
            }}
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8" />
              <path d="M12 6v6l4 2" stroke="#FFD84B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-[18px] font-extrabold tracking-wide">AI Student Analysis</div>
            <div className="text-[12px] opacity-80 text-[#9BE7FF]">Prediction · Classification · Clustering</div>
          </div>
        </div>

        <div
          className="mt-3 inline-block px-3 py-1 rounded-md text-[11px] font-semibold"
          style={{
            background: 'linear-gradient(90deg,#ED3F27 0%,#FEB21A 100%)',
            color: '#1a1f2b',
            boxShadow: '0 0 8px #ED3F2755'
          }}
        >
          NOTE : Not ERP — AI Tool
        </div>
      </div>

      {/* Tabs list (scrolls independently if needed) */}
      <nav className="p-3 space-y-1 overflow-y-auto no-scrollbar" style={{ flex: 1 }}>
        {tabs.map((t, i) => (
          <NavLink key={`${t.key}-${i}`} to={t.to} className={linkClass} end={t.to === 'overview'}>
            {/* accent dot */}
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4bd4ff] group-[.active]:bg-[#9BE7FF]" />
            <span className="text-[15px] font-medium">{t.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 text-[11px] opacity-70 border-t" style={{ borderColor: panelBorder }}>
        © {new Date().getFullYear()} Class AI · v1.0
      </div>
    </aside>
  )
}
