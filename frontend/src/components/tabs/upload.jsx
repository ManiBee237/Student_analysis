import React, { useMemo, useState } from 'react'
import Panel from '../parts/Panel.jsx'
import { useDataset } from '../../context/DatasetContext.jsx'

const panelBorder = 'rgba(255,255,255,0.12)'
const PAGE_SIZE = 12

const ALIASES = {
  id: ['id','studentid','student_id'],
  name: ['name','student','student_name','studentname'],
  attendancePct: ['attendance','attendance%','attendance_pct','attendancerate','attendance_rate'],
  hours: ['studyhours','hours','study_hours','study_hours_per_week','hoursperweek','hours_per_week'],
  prev: ['previousgrade','previous_grade','priorgrade','prev','last_term'],
  final: ['finalgrade','final','grade','score','mark','marks'],
  parent: ['parentalsupport','parental_support','support','parent'],
  online: ['onlineclasses','online','online_recaps','attends_online','e_learning'],
  activities: ['extracurricular','activities','activity_count','clubs']
}

function guessKey(header) {
  const h = String(header).trim().toLowerCase().replaceAll(/\s+/g,'').replaceAll('%','')
  for (const [std, keys] of Object.entries(ALIASES)) {
    if (keys.includes(h)) return std
  }
  return null
}

// very small CSV parser (handles quotes for commas)
function parseCSV(text) {
  const rows = []
  let i = 0, field = '', row = [], inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i+1] === '"') { field += '"'; i += 2; continue }
      inQuotes = !inQuotes; i++; continue
    }
    if (!inQuotes && (ch === ',')) { row.push(field); field=''; i++; continue }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      // finish row
      // skip CRLF
      if (ch === '\r' && text[i+1] === '\n') i++
      row.push(field); rows.push(row); field=''; row=[]; i++; continue
    }
    field += ch; i++
  }
  // last field
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

function toRows(text) {
  const matrix = parseCSV(text).filter(r => r.length && r.some(c => String(c).trim() !== ''))
  if (!matrix.length) return { headers: [], records: [] }
  const headers = matrix[0].map(h => String(h).trim())
  const records = matrix.slice(1).map(r => {
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = r[idx] })
    return obj
  })
  return { headers, records }
}

function normalize(records) {
  // map headers
  if (!records.length) return []
  const cols = Object.keys(records[0])
  const mapped = cols.reduce((acc, h) => { acc[h] = guessKey(h); return acc }, {})

  function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  function bool(v) {
    const s = String(v).toLowerCase().trim()
    return ['1','true','yes','y'].includes(s)
  }

  return records.map((r, idx) => {
    // figure raw vals by mapped keys
    const take = (stdKey) => {
      const src = Object.entries(mapped).find(([,std]) => std === stdKey)?.[0]
      return src ? r[src] : undefined
    }

    const name = (take('name') ?? '').toString().trim() || `Student ${idx+1}`
    const attendanceIn = take('attendancePct')
    // allow 0..1 or 0..100
    let attendance = num(attendanceIn)
    if (attendance > 1) attendance = attendance / 100

    const out = {
      id: (take('id') ?? idx + 1).toString(),
      name,
      attendance: Math.max(0, Math.min(1, attendance || 0)),
      hours: num(take('hours')),
      prev: num(take('prev')),
      final: num(take('final')),
      parent: (take('parent') ?? 'Medium') || 'Medium',
      online: bool(take('online')),
      activities: Number.isFinite(num(take('activities'))) ? num(take('activities')) : undefined
    }

    return out
  })
}

export default function Upload() {
  const { data, loadRows, source } = useDataset()
  const [preview, setPreview] = useState([]) // normalized preview
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(preview.length / PAGE_SIZE))

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const { records } = toRows(text)
    const rows = normalize(records)

    if (!rows.length) {
      alert('No rows detected in this CSV.')
      return
    }
    // load into global store
    loadRows(rows)
    // build preview
    setPreview(rows)
    setPage(1)
  }

  const view = useMemo(() => {
    const start = (page-1) * PAGE_SIZE
    const slice = preview.slice(start, start + PAGE_SIZE)
    // keep only essential columns for neat UI
    return slice.map(r => ({
      id: r.id,
      name: r.name,
      'Attendance %': Math.round((r.attendance||0)*100),
      'Study hours/wk': r.hours,
      'Previous grade': r.prev,
      'Final grade': r.final,
      'Parental support': r.parent,
      'Online?': r.online ? 'Yes' : 'No'
    }))
  }, [preview, page])

  return (
    <div className="space-y-4 mt-2">
      <Panel>
        <h2 className="text-lg font-semibold tracking-wide mb-2">Upload CSV</h2>
        <p className="text-sm opacity-90">
          Accepted headers are flexible (we auto-detect). Examples: <i>Name, Attendance, StudyHours, PreviousGrade, FinalGrade, ParentalSupport, Online</i>.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="block text-sm border-2 border-slate-500 w-49 rounded-xl px-3 py-1.5 cursor-pointer"
            placeholder='choose'
          />
          <span className="text-xs opacity-80">
            Current data source: <b>{source === 'csv' ? 'Your CSV' : 'Sample dataset'}</b>
          </span>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold tracking-wide">Preview (first {PAGE_SIZE} per page)</h3>
          <div className="text-xs opacity-80">Showing essentials only</div>
        </div>

        {preview.length === 0 ? (
          <div className="text-sm opacity-80">No CSV loaded yet. Using the sample dataset across the app.</div>
        ) : (
          <>
            <div className="overflow-auto no-scrollbar" style={{ maxHeight: 360 }}>
              <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {Object.keys(view[0] || {}).map(h => (
                      <th key={h} className="px-3 py-2 text-left sticky top-0"
                          style={{ background:'rgba(19,70,134,0.65)', color:'#e9f0ff', borderBottom:`1px solid ${panelBorder}`, backdropFilter:'blur(6px)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.map((row, idx) => (
                    <tr key={idx} style={{ background: idx%2 ? 'rgba(255,255,255,0.025)' : 'transparent' }}>
                      {Object.values(row).map((v,i)=>(
                        <td key={i} className="px-3 py-2">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs opacity-80">Page {page} / {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={()=>setPage(p=>Math.max(1,p-1))}
                  disabled={page===1}
                  className="px-3 py-1.5 rounded text-sm disabled:opacity-50"
                  style={{ border:`1px solid ${panelBorder}` }}
                >Prev</button>
                <button
                  onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                  disabled={page===totalPages}
                  className="px-3 py-1.5 rounded text-sm disabled:opacity-50"
                  style={{ border:`1px solid ${panelBorder}` }}
                >Next</button>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
