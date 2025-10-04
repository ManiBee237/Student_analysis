// src/components/LeftTabs.jsx
import React, { useMemo, useState } from 'react'

// Tabs (your existing components)
import Overview from '../pages/Overview.jsx'
import Prediction from '../components/tabs/Prediction.jsx'
import Classification from '../components/tabs/Classification.jsx'
import Clustering from '../components/tabs/Clustering.jsx'
import Insights from '../components/tabs/Insights.jsx'
import Upload from '../components/tabs/upload.jsx'
import Settings from '../components/tabs/settings.jsx'

const panelBorder = 'rgba(255,255,255,0.12)'

export default function LeftTabs() {
  const tabs = useMemo(() => ([
    { key: 'overview',       label: 'Overview',       component: <Overview /> },
    { key: 'prediction',     label: 'Prediction',     component: <Prediction /> },
    { key: 'classification', label: 'Classification', component: <Classification /> },
    { key: 'clustering',     label: 'Clustering',     component: <Clustering /> },
    { key: 'insights',       label: 'Insights',       component: <Insights /> },
    { key: 'upload',         label: 'Upload CSV',     component: <Upload /> },
    { key: 'settings',       label: 'Settings',       component: <Settings /> },
  ]), [])

  const [active, setActive] = useState('overview')
  const curr = tabs.find(t => t.key === active) || tabs[0]

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e9f0ff]">
      <div className="flex">
        {/* ==== LEFT RAIL (title + tabs) ==== */}
        <aside
          className="shrink-0 flex flex-col"
          style={{
            width: 260,
            borderRight: `1px solid ${panelBorder}`,
            background: 'linear-gradient(180deg, rgba(13,21,37,0.80) 0%, rgba(13,21,37,0.60) 100%)',
            backdropFilter: 'blur(10px)',
            minHeight: '100vh'
          }}
        >
          {/* Title + brand lives INSIDE the sidebar now */}
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
                {/* Bigger, impressive title */}
                <div className="text-[18px] font-extrabold tracking-wide">AI Student Analysis</div>
                <div className="text-[12px] opacity-80 text-[#9BE7FF]">Prediction · Classification · Clustering</div>
              </div>
            </div>

            {/* Disclaimer pill under title */}
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

          {/* Tabs list */}
          <nav className="p-3 space-y-1 overflow-auto no-scrollbar" style={{ flex: 1 }}>
            {tabs.map(t => {
              const isActive = active === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors group
                              ${isActive
                                ? 'bg-[rgba(19,70,134,0.38)] text-[#9BE7FF] border'
                                : 'hover:bg-[rgba(255,255,255,0.06)] opacity-90'}`}
                  style={{ borderColor: isActive ? 'rgba(155,179,211,0.25)' : 'transparent' }}
                >
                  <div className="flex items-center gap-2">
                    {/* Small accent dot that glows on hover/active */}
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{
                        background: isActive ? '#9BE7FF' : '#4bd4ff',
                        boxShadow: isActive ? '0 0 10px #9BE7FFaa' : 'none'
                      }}
                    />
                    <span className="text-[15px] font-medium">{t.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-4 py-3 text-[11px] opacity-70 border-t" style={{ borderColor: panelBorder }}>
            © {new Date().getFullYear()} Class AI · v1.0
          </div>
        </aside>

        {/* ==== CONTENT ==== */}
        <main className="flex-1 p-4 sm:p-6">
          {curr.component}
        </main>
      </div>
    </div>
  )
}
