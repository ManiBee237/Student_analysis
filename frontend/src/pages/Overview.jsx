// src/pages/Overview.jsx
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Panel from '../components/parts/Panel.jsx'
import { useDataset } from '../context/DatasetContext.jsx'

const panelBorder = 'rgba(255,255,255,0.12)'

function mean(xs){ const n=xs.length||1; return xs.reduce((a,b)=>a+(+b||0),0)/n }
function median(xs){ const a=[...xs].sort((x,y)=>x-y); const n=a.length; if(!n) return 0; const m=Math.floor(n/2); return n%2?a[m]:(a[m-1]+a[m])/2 }

export default function Overview(){
  const { data, source } = useDataset()
  const passMark = +(localStorage.getItem('pred.passMark') ?? 40)

  // Only treat data as valid when it comes from an uploaded CSV
  const hasData = source === 'csv' && Array.isArray(data) && data.length > 0

  // Prepare rows only if we truly have uploaded data
  const rows = useMemo(() => {
    if (!hasData) return []
    return data.map(s => ({
      name: s.name,
      final: +s.final,
      hours: +s.hours,
      attendancePct: Math.round((s.attendance ?? 0)*100),
      prev: +s.prev,
      parent: s.parent || 'Medium',
      online: !!s.online
    }))
  }, [hasData, data])

  const finals = rows.map(r=>r.final).filter(v=>Number.isFinite(v))
  const passRate = rows.length ? rows.filter(r=> Number.isFinite(r.final) && r.final >= passMark).length / rows.length : 0
  const avgFinal = finals.length ? mean(finals) : 0
  const medAttend = rows.length ? median(rows.map(r=>r.attendancePct)) : 0
  const borderline = rows.filter(r => Number.isFinite(r.final) && Math.abs(r.final - passMark) <= 5).length

  return (
    <div className="space-y-4 mt-2">
      <Panel>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide">Overview</h2>
          <div className="text-xs opacity-80">
            Data source: <b>{hasData ? 'Your CSV' : '— none —'}</b>
          </div>
        </div>
        <p className="text-sm opacity-90 mt-2">
          This page stays empty until you upload your class data.
        </p>
      </Panel>

      {!hasData ? (
        // ---------- Empty state ----------
        <Panel>
          <div className="text-center py-14">
            <div
              className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${panelBorder}` }}
            >
              <span className="text-2xl" aria-hidden>📄</span>
            </div>
            <h3 className="text-base font-semibold">No data yet</h3>
            <p className="text-sm opacity-90 mt-1">
              Go to <b>Upload CSV</b> and add your student list to unlock the overview and insights.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Link
                to="/upload"
                className="px-3 py-2 rounded font-medium"
                style={{ background:'var(--color-accent)', color:'#1a1f2b' }}
              >
                Go to Upload CSV
              </Link>
              <span className="text-xs opacity-70">Accepted: .csv (UTF-8)</span>
            </div>
            <ul className="text-xs opacity-80 mt-5 space-y-1 max-w-xl mx-auto text-left">
              <li>• Required columns: <b>name, attendance, hours, prev</b> (optional: <b>final, parent, online, activities</b>).</li>
              <li>• Attendance should be a fraction (e.g., 0.86). We convert it to % automatically.</li>
              <li>• You can adjust the pass mark later in the <b>Prediction</b> tab.</li>
            </ul>
          </div>
        </Panel>
      ) : (
        // ---------- KPIs & guidance (only when CSV uploaded) ----------
        <>
          <Panel>
            <div className="grid sm:grid-cols-4 gap-3">
              <KPI label="Students" value={rows.length} fmt="int" />
              <KPI label="Pass rate" value={passRate} fmt="pct" />
              <KPI label="Average final" value={avgFinal} />
              <KPI label="Median attendance" value={medAttend/100} fmt="pct" />
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <KPI label={`Pass mark (≥ ${passMark})`} value={passMark} fmt="int" />
              <KPI label="Borderline (±5 marks)" value={borderline} fmt="int" color="#FEB21A" />
              <KPI label="Online recap users" value={rows.filter(r=>r.online).length} fmt="int" color="#9BE7FF" />
            </div>
          </Panel>

          <Panel>
            <h3 className="font-semibold mb-1">How to use this</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
              <li>Upload your CSV to switch the data source to your class.</li>
              <li>Set your <b>Pass mark</b> in <b>Prediction</b>; Overview & Insights follow that setting.</li>
              <li>Use <b>Borderline</b> to plan quick interventions this week.</li>
            </ul>
          </Panel>
        </>
      )}
    </div>
  )
}

function KPI({ label, value, fmt='dec', color='#9BE7FF' }) {
  let text = ''
  if (fmt==='pct') text = `${Math.round((value||0)*100)}%`
  else if (fmt==='int') text = `${value||0}`
  else text = (value||0).toFixed(2)
  return (
    <div className="rounded-lg p-3"
      style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${panelBorder}` }}>
      <div className="text-[11px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{text}</div>
    </div>
  )
}
