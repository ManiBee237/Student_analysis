// src/context/DatasetContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { sampleStudents } from '../utils/mockData.js'

/**
 * Normalized row shape:
 * { id, name, attendance (0..1), hours, prev, final, parent, online, activities? }
 */

const KEY = 'dataset.rows.v1'
const SRC = 'dataset.source.v1' // 'csv' | 'sample'

const DatasetCtx = createContext(null)

export function DatasetProvider({ children }) {
  // Load persisted rows (if any)
  const [rows, setRows] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })
  const [source, setSource] = useState(() => localStorage.getItem(SRC) || 'sample')

  // Persist whenever rows/source change
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(rows)) } catch {}
  }, [rows])
  useEffect(() => {
    try { localStorage.setItem(SRC, source) } catch {}
  }, [source])

  // Allow other tabs/windows to update (optional)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue)
          if (Array.isArray(next)) setRows(next)
        } catch {}
      }
      if (e.key === SRC && e.newValue) setSource(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // API
  const loadRows = (newRows) => {
    if (Array.isArray(newRows) && newRows.length) {
      setRows(newRows)
      setSource('csv')
    } else {
      setRows([])
      setSource('sample')
    }
  }
  const clearDataset = () => {
    setRows([])
    setSource('sample')
  }

  // Data visible to the app (fallback to sample if no CSV)
  const data = rows.length ? rows : sampleStudents

  const value = useMemo(() => ({ data, source, loadRows, clearDataset }), [data, source])

  return <DatasetCtx.Provider value={value}>{children}</DatasetCtx.Provider>
}

export function useDataset() {
  const ctx = useContext(DatasetCtx)
  if (!ctx) throw new Error('useDataset must be used inside <DatasetProvider>')
  return ctx
}
