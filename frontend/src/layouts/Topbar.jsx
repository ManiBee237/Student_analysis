import React from 'react'

const border = 'rgba(255,255,255,0.08)'

export default function TopbarClassic({ title = 'AI Student Performance Dashboard', right = null }) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        background: 'linear-gradient(90deg, #0b1220 0%, #132f55 50%, #0b1220 100%)',
        borderBottom: `1px solid ${border}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.65)'
      }}
    >
      <div className="h-16 flex items-center gap-4 px-6">
        {/* Brand / Logo */}
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg select-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${border}`
          }}
        >
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4bd4ff 0%, #00a2ff 100%)',
              boxShadow: '0 0 14px #00cfff66'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6" />
              <path d="M12 6v6l4 2" stroke="#FFD84B" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-wide text-white">Student Analysis</div>
            <div className="text-[12px] opacity-80 text-[#9BE7FF]">AI helper for teachers</div>
          </div>
        </div>

        {/* Main Title */}
        <div className="ml-4 text-lg sm:text-xl font-extrabold tracking-wide text-white">
          {title}
        </div>

        <div className="flex-1" />

        {/* Important Pill */}
        <div
          className="hidden md:block px-4 py-1.5 rounded-md text-sm font-semibold"
          style={{
            background: 'linear-gradient(90deg,#ED3F27 0%,#FEB21A 100%)',
            color: '#1a1f2b',
            boxShadow: '0 0 10px #ED3F2766'
          }}
        >
         NOTE : Not ERP — AI Tool
        </div>

        {/* Right Slot (actions / profile) */}
        {right}
      </div>
    </header>
  )
}
