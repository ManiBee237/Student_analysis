// src/components/parts/SearchBox.jsx
import React from 'react'

const border = 'rgba(255,255,255,0.12)'

export default function SearchBox({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border rounded pl-9 pr-8 py-2"
        style={{ borderColor: border }}
        // Prevent Enter from submitting any parent <form>
        onKeyDown={(e)=>{ if (e.key === 'Enter') e.preventDefault() }}
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70">🔎</span>
      {value ? (
        <button
          type="button"
          onClick={()=>onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100"
          aria-label="Clear search"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
