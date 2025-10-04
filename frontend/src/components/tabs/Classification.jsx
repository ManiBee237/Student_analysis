// src/components/tabs/Classification.jsx
import React, { useEffect, useMemo, useState } from 'react'
import Panel from '../parts/Panel.jsx'
import { useDataset } from '../../context/DatasetContext.jsx'
import { predictGrade } from '../../utils/predict.js'
import SearchBox from '../parts/SearchBox.jsx'
import { filterByQuery } from '../../utils/search.js'

const panelBorder = 'rgba(255,255,255,0.12)'

/** Compute outcome for a row against passMark */
function computeOutcome(row, passMark) {
  const hasFinal = Number.isFinite(+row.final) && +row.final >= 0
  const predicted = hasFinal
    ? +row.final
    : predictGrade({
        attendancePct: Math.round((row.attendance ?? 0) * 100),
        studyHours: +row.hours || 0,
        previousGrade: +row.prev || 0,
        extracurricularCount: typeof row.activities === 'number' ? row.activities : 0,
        parentalSupport: row.parent || 'Medium',
        online: !!row.online
      }).predicted

  const pass = predicted >= passMark
  const gap = predicted - passMark
  let risk = 'Low'
  if (gap < -10) risk = 'High'
  else if (gap < 5) risk = 'Medium'

  return { predicted, pass, risk }
}

export default function TeacherView() {
  const { data, source } = useDataset()
  const passMark = +(localStorage.getItem('pred.passMark') ?? 40)

  // ---- Controls
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')     // All | High | Medium | Low
  const [statusFilter, setStatusFilter] = useState('All') // All | Pass | Fail
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' }) // key in columns

  // ---- Build normalized rows (stable ids + unique keys)
  const rows = useMemo(() => {
    return data.map((r, i) => {
      const rawId = r.id
      const hasId = rawId !== null && rawId !== undefined && String(rawId).trim() !== ''
      const id = hasId ? String(rawId) : String(i + 1)
      const _key = `${id}#${i}`

      const base = {
        _key,
        id,
        name: r.name ?? `Student ${i + 1}`,
        attendancePct: Math.round((r.attendance ?? 0) * 100),
        hours: +r.hours || 0,
        prev: +r.prev || 0,
        final: Number.isFinite(+r.final) ? +r.final : null,
        parent: r.parent || 'Medium',
        online: !!r.online,
        activities: typeof r.activities === 'number' ? r.activities : 0
      }
      const { predicted, pass, risk } = computeOutcome(base, passMark)
      return { ...base, predicted, pass, risk }
    })
  }, [data, passMark])

  // ---- Filter + search (search by name OR id)
  const filtered = useMemo(() => {
    // free-text search first
    let base = filterByQuery(rows, query, ['name', 'id'])

    // risk filter
    if (riskFilter !== 'All') base = base.filter(r => r.risk === riskFilter)

    // pass/fail filter
    if (statusFilter !== 'All') {
      base = base.filter(r => (statusFilter === 'Pass' ? r.pass : !r.pass))
    }
    return base
  }, [rows, query, riskFilter, statusFilter])

  // ---- Sorting
  const sorted = useMemo(() => {
    const arr = [...filtered]
    const { key, dir } = sortBy
    arr.sort((a, b) => {
      const va = a[key]; const vb = b[key]

      // Booleans (pass)
      if (typeof va === 'boolean' || typeof vb === 'boolean') {
        const na = va ? 1 : 0, nb = vb ? 1 : 0
        return dir === 'asc' ? na - nb : nb - na
      }
      // Strings
      if (typeof va === 'string' || typeof vb === 'string') {
        const res = String(va ?? '').localeCompare(String(vb ?? ''), undefined, { sensitivity: 'base' })
        return dir === 'asc' ? res : -res
      }
      // Numbers
      const na = Number(va ?? 0), nb = Number(vb ?? 0)
      return dir === 'asc' ? na - nb : nb - na
    })
    return arr
  }, [filtered, sortBy])

  // ---- Bulk actions (local only for demo)
  function saveAtRiskCohort() {
    try {
      const list = sorted
        .filter(r => r.risk === 'High' || (!r.pass && r.risk !== 'Low'))
        .map(r => ({ id: r.id, name: r.name, risk: r.risk, predicted: r.predicted }))
      localStorage.setItem('cohort.atRisk', JSON.stringify(list))
      alert(`Saved ${list.length} students to At-Risk cohort (local browser storage).`)
    } catch {
      alert('Could not save cohort locally.')
    }
  }

  function exportCSV() {
    const header = ['id', 'name', 'attendance%', 'hours', 'prev', 'final', 'predicted', 'status', 'risk']
    const lines = [header, ...sorted.map(r => [
      r.id, r.name, r.attendancePct, r.hours, r.prev, (r.final ?? ''), Math.round(r.predicted),
      r.pass ? 'Pass' : 'Fail', r.risk
    ])]
    const csv = lines.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'classification_view.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ---- Table header
  const columns = [
    { key: 'name', label: 'Student' },
    { key: 'attendancePct', label: 'Attendance %' },
    { key: 'hours', label: 'Study hrs/wk' },
    { key: 'prev', label: 'Prev grade' },
    { key: 'final', label: 'Final (if any)' },
    { key: 'predicted', label: 'Predicted' },
    { key: 'pass', label: 'Status' },
    { key: 'risk', label: 'Risk' }
  ]
  const onSort = (key) => setSortBy(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return (
    <div className="space-y-4 mt-2">
      <Panel>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide">Pass/Fail Classification</h2>
          <div className="text-xs opacity-80">
            Data source: <b>{source === 'csv' ? 'Your CSV' : 'Sample dataset'}</b> · Pass mark: <b>{passMark}</b>
          </div>
        </div>
        <p className="text-sm opacity-90 mt-2">
          See who is likely to <b>pass</b> vs who <b>needs support</b>. Sort, search, and filter to plan follow-ups quickly.
        </p>
      </Panel>

      {/* Controls */}
      <Panel>
        <div className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <div className="text-sm mb-1">Search by name or ID</div>
            <SearchBox value={query} onChange={setQuery} placeholder="Type a name or ID…" />
          </div>

          <div>
            <div className="text-sm mb-1">Risk</div>
            <select
              value={riskFilter}
              onChange={(e)=>setRiskFilter(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2"
              style={{ borderColor: panelBorder }}
            >
              {['All','High','Medium','Low'].map(x=>(
                <option key={x} className="bg-[#0b1220]" value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm mb-1">Status</div>
            <select
              value={statusFilter}
              onChange={(e)=>setStatusFilter(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2"
              style={{ borderColor: panelBorder }}
            >
              {['All','Pass','Fail'].map(x=>(
                <option key={x} className="bg-[#0b1220]" value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={()=>{ setQuery(''); setRiskFilter('All'); setStatusFilter('All') }}
              className="px-3 py-2 rounded font-medium w-full"
              style={{ border:`1px solid ${panelBorder}` }}
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={saveAtRiskCohort}
            className="px-3 py-2 rounded font-medium"
            style={{ background:'var(--color-accent)', color:'#1a1f2b' }}
          >
            Save “At-Risk” Cohort
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded font-medium"
            style={{ border:`1px solid ${panelBorder}` }}
          >
            Export CSV
          </button>
        </div>
      </Panel>

      {/* Table */}
      <Panel>
        <div className="overflow-auto no-scrollbar" style={{ maxHeight: 520 }}>
          <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={()=>onSort(col.key)}
                    className="px-3 py-2 text-left sticky top-0 cursor-pointer select-none"
                    style={{ background:'rgba(19,70,134,0.65)', color:'#e9f0ff', borderBottom:`1px solid ${panelBorder}`, backdropFilter:'blur(6px)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{col.label}</span>
                      {sortBy.key === col.key && (
                        <span className="text-[10px] opacity-90">{sortBy.dir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx) => (
                <tr
                  key={r._key}
                  className="hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                  style={{ background: idx%2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                >
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{r.attendancePct}%</td>
                  <td className="px-3 py-2">{r.hours}</td>
                  <td className="px-3 py-2">{r.prev}</td>
                  <td className="px-3 py-2">{r.final ?? '—'}</td>
                  <td className="px-3 py-2">{Math.round(r.predicted)}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
                      style={{
                        color: r.pass ? '#4bd4ff' : '#ED3F27',
                        borderColor: r.pass ? '#4bd4ff' : '#ED3F27',
                        background: 'rgba(255,255,255,0.04)'
                      }}>
                      {r.pass ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
                      style={{
                        color: r.risk === 'High' ? '#ED3F27' : r.risk === 'Medium' ? 'var(--color-accent)' : '#4bd4ff',
                        borderColor: r.risk === 'High' ? '#ED3F27' : r.risk === 'Medium' ? 'var(--color-accent)' : '#4bd4ff',
                        background: 'rgba(255,255,255,0.04)'
                      }}>
                      {r.risk}
                    </span>
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center opacity-80" colSpan={columns.length}>
                    No students match the current search/filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* How this helps (plain English) */}
        <div className="mt-3 p-3 rounded-lg"
             style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${panelBorder}` }}>
          <p className="text-sm opacity-90">
            <b>How to use:</b> Sort by <i>Predicted</i> or filter to <i>High risk</i>. Start your day by checking the first
            few high-risk students, confirm attendance plans, and assign a short study block. Use “Save At-Risk Cohort”
            to keep a local follow-up list (stored only in this browser).
          </p>
        </div>
      </Panel>
    </div>
  )
}
