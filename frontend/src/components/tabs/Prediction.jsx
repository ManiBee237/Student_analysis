// src/components/tabs/Prediction.jsx
import React, { useEffect, useMemo, useState } from 'react'
import Panel from '../parts/Panel.jsx'
import { predictGrade } from '../../utils/predict.js'
import { useDataset } from '../../context/DatasetContext.jsx'

const panelBorder = 'rgba(255,255,255,0.12)'

export default function PredictionForTeachers() {
  // Global dataset (CSV if uploaded, else sample)
  const { data: dataset } = useDataset()

  // Persisted pass mark
  const [passMark, setPassMark] = useState(() => +(localStorage.getItem('pred.passMark') ?? 40))
  useEffect(() => localStorage.setItem('pred.passMark', String(passMark)), [passMark])

  // Selected student id ('' = manual)
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('pred.selectedId') ?? '')
  useEffect(() => localStorage.setItem('pred.selectedId', selectedId), [selectedId])

  // Last form (persist)
  const [f, setF] = useState(() => {
    const saved = localStorage.getItem('pred.lastForm')
    return saved ? JSON.parse(saved) : {
      studentName: '',
      attendancePct: 85,
      studyHours: 10,
      previousGrade: 65,
      extracurricularCount: 1,
      parentalSupport: 'Medium',
      online: true
    }
  })
  useEffect(() => localStorage.setItem('pred.lastForm', JSON.stringify(f)), [f])

  // Hydrate from dataset when a student is selected
  useEffect(() => {
    if (!selectedId) return
    const s = dataset.find(x => String(x.id) === String(selectedId))
    if (!s) return
    setF(prev => ({
      ...prev,
      studentName: s.name || '',
      attendancePct: Math.round((s.attendance ?? 0) * 100),
      studyHours: s.hours ?? prev.studyHours,
      previousGrade: s.prev ?? prev.previousGrade,
      extracurricularCount: typeof s.activities === 'number' ? s.activities : (prev.extracurricularCount ?? 1),
      parentalSupport: s.parent || 'Medium',
      online: !!s.online
    }))
  }, [selectedId, dataset])

  // Prediction
  const pred = useMemo(() => predictGrade({
    attendancePct: f.attendancePct,
    studyHours: f.studyHours,
    previousGrade: f.previousGrade,
    extracurricularCount: f.extracurricularCount,
    parentalSupport: f.parentalSupport,
    online: f.online
  }), [f])

  const passProbPct = Math.round((pred.passProb || 0) * 100)
  const willPass    = (pred.predicted ?? 0) >= passMark
  const riskLabel   = pred.risk || (willPass ? 'Low' : 'High')

  // Actions
  function addToAtRisk() {
    try {
      const key = 'cohort.atRisk'
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      const name = f.studentName || 'Unnamed Student'
      const entry = {
        id: f.studentName ? `name:${f.studentName}` : `custom:${Date.now()}`,
        name,
        passProb: pred.passProb,
        predicted: pred.predicted,
        risk: riskLabel,
        snapshot: { ...f, passMark }
      }
      const exists = list.find(x => x && x.name === name)
      const next = exists ? list.map(x => x.name === name ? entry : x) : [...list, entry]
      localStorage.setItem(key, JSON.stringify(next))
      alert('Saved to At-Risk cohort (local to this browser).')
    } catch {
      alert('Could not save cohort locally.')
    }
  }

  function exportCSV() {
    const rows = [{
      Student: f.studentName || 'Unnamed Student',
      'Predicted Final Grade': pred.predicted,
      'Pass Probability': passProbPct + '%',
      'Risk': riskLabel,
      'Pass Mark': passMark,
      'Attendance %': f.attendancePct,
      'Study Hours / Week': f.studyHours,
      'Previous Grade': f.previousGrade,
      'Extracurricular Count': f.extracurricularCount,
      'Parental Support': f.parentalSupport,
      'Online Classes?': f.online ? 'Yes' : 'No'
    }]
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g,'""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${(f.studentName || 'student')}_prediction.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function copyParentEmail() {
    const body =
`Hello,

Quick update about ${f.studentName || 'your child'}.

• Attendance: ${f.attendancePct}%
• Study hours: ${f.studyHours}/week
• Previous grade: ${f.previousGrade}
• Predicted final grade: ${pred.predicted}
• Chance to pass (today): ${passProbPct}%
• Risk level: ${riskLabel}

Suggested plan for 2 weeks:
• Aim for attendance ≥ 85%
• Add 2–3 focused study hours / week
• Short online recap after each class
• Reduce extracurricular load if it affects study time

(Estimate is AI-assisted guidance. Final outcomes depend on study and support.)
`
    navigator.clipboard?.writeText(body)
      .then(() => alert('Parent email template copied.'))
      .catch(() => alert('Could not copy.'))
  }

  function resetForm() {
    setSelectedId('') // back to manual
    setF({
      studentName: '',
      attendancePct: 85,
      studyHours: 10,
      previousGrade: 65,
      extracurricularCount: 1,
      parentalSupport: 'Medium',
      online: true
    })
  }

  // PRINT: essentials-only (uses CSS in index.css)
  function printEssentials() { window.print() }

  const set = (k) => (e) => setF(s => ({
    ...s,
    [k]: e.target.type === 'checkbox' ? e.target.checked
      : (isNaN(+e.target.value) ? e.target.value : +e.target.value)
  }))

  return (
    <div className="space-y-4 mt-2">
      {/* Header */}
      <Panel className="no-print">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide">Prediction (Teacher View)</h2>
          <div className="text-[11px] px-2 py-1 rounded-full"
            style={{ border:`1px solid ${panelBorder}`, background:'rgba(255,255,255,0.03)' }}>
            NOTE: This is not an ERP — it’s an AI helper.
          </div>
        </div>
        <p className="text-sm opacity-90 mt-2">
          Pick a student from the dataset or choose “Manual entry”. Adjust the sliders if needed — the estimate updates instantly.
        </p>
      </Panel>

      {/* Controls row: Student + Pass mark */}
      <Panel className="no-print">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Student (from dataset)">
            <select
              value={selectedId}
              onChange={(e)=>setSelectedId(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2"
              style={{ borderColor: panelBorder }}
            >
              <option className="bg-[#0b1220]" value="">— Manual entry —</option>
              {dataset.map(s => (
                <option key={s.id} className="bg-[#0b1220]" value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={`Pass mark (final ≥ ${passMark})`}>
            <select
              value={passMark}
              onChange={(e)=>setPassMark(+e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2"
              style={{ borderColor: panelBorder }}
            >
              {[30,35,40,45,50].map(p => (
                <option key={p} className="bg-[#0b1220]" value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>

      {/* Inputs + Outcome */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* Inputs */}
        <Panel className="xl:col-span-2 no-print">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Student name">
              <input
                type="text" value={f.studentName} onChange={set('studentName')}
                className="w-full bg-transparent border rounded px-3 py-2"
                style={{ borderColor: panelBorder }}
                placeholder="e.g., Priya M."
                disabled={!!selectedId}
                title={selectedId ? 'Loaded from dataset' : 'You can edit'}
              />
            </Field>

            <Field label={`Attendance (${f.attendancePct}%)`}>
              <input type="range" min="0" max="100" value={f.attendancePct} onChange={set('attendancePct')} className="w-full" />
            </Field>

            <Field label={`Study Hours / Week (${f.studyHours})`}>
              <input type="range" min="0" max="40" value={f.studyHours} onChange={set('studyHours')} className="w-full" />
            </Field>

            <Field label={`Previous Grade (${f.previousGrade})`}>
              <input type="range" min="0" max="100" value={f.previousGrade} onChange={set('previousGrade')} className="w-full" />
            </Field>

            <Field label={`Extracurricular (count: ${f.extracurricularCount})`}>
              <input type="range" min="0" max="5" value={f.extracurricularCount} onChange={set('extracurricularCount')} className="w-full" />
            </Field>

            <Field label="Parental Support">
              <select
                value={f.parentalSupport} onChange={set('parentalSupport')}
                className="w-full bg-transparent border rounded px-3 py-2"
                style={{ borderColor: panelBorder }}
              >
                {['High','Medium','Low'].map(x => (
                  <option key={x} className="bg-[#0b1220]" value={x}>{x}</option>
                ))}
              </select>
            </Field>

            <Field label="Attends Online Recap?">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.online} onChange={set('online')} />
                <span>Yes</span>
              </label>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={resetForm} className="px-3 py-2 rounded font-medium" style={{ border:`1px solid ${panelBorder}` }}>
              Reset to Manual
            </button>
            <button onClick={addToAtRisk} className="px-3 py-2 rounded font-medium"
              style={{ background:'var(--color-accent)', color:'#1a1f2b' }}>
              Save as At-Risk (if needed)
            </button>
            <button onClick={exportCSV} className="px-3 py-2 rounded font-medium" style={{ border:`1px solid ${panelBorder}` }}>
              Export CSV
            </button>
            <button onClick={printEssentials} className="px-3 py-2 rounded font-medium" style={{ border:`1px solid ${panelBorder}` }}>
              Print Report
            </button>
            <button onClick={copyParentEmail} className="px-3 py-2 rounded font-medium" style={{ border:`1px solid ${panelBorder}` }}>
              Copy Parent Email
            </button>
          </div>
        </Panel>

        {/* Outcome */}
        <Panel className="no-print">
          <h3 className="font-semibold mb-2 tracking-wide">Predicted Outcome</h3>
          <div className="space-y-3">
            <KV label="Predicted Final Grade">
              <span className="text-3xl font-extrabold" style={{ color:'var(--color-accent)' }}>{pred.predicted}</span>
            </KV>
            <KV label="Chance to Pass">
              <div>
                <div className="text-2xl font-bold" style={{ color:'#9BE7FF' }}>{passProbPct}%</div>
                <div className="mt-2 h-2 w-full rounded bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="h-full rounded" style={{ width:`${passProbPct}%`, background:'#9BE7FF' }} />
                </div>
              </div>
            </KV>
            <KV label="Risk level">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
                style={{
                  color: riskLabel === 'High' ? '#ED3F27' : riskLabel === 'Medium' ? 'var(--color-accent)' : '#4bd4ff',
                  borderColor: riskLabel === 'High' ? '#ED3F27' : riskLabel === 'Medium' ? 'var(--color-accent)' : '#4bd4ff',
                  background: 'rgba(255,255,255,0.04)'
                }}>
                {riskLabel}
              </span>
            </KV>
            <div className="pt-3 border-t" style={{ borderColor: panelBorder }}>
              <div className="text-[11px] opacity-70">
                Estimate blends attendance, study hours, prior grade, activities, support, and online recaps.
                Use alongside teacher judgment.
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Teacher action plan (on-screen only) */}
      <Panel className="no-print">
        <h3 className="font-semibold mb-2 tracking-wide">Suggested next steps (2-week plan)</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
          {teacherTips(f).map((t,i)=><li key={i}>{t}</li>)}
        </ul>
        <p className="text-xs opacity-70 mt-2">
          Tip: mark this student as “At-Risk” to include them in your daily follow-up list on the Classification tab.
        </p>
      </Panel>

      {/* ---------- PRINT-ONLY SHEET (essentials on one page) ---------- */}
      <div id="print-sheet" className="print-only">
        <h1>Student Prediction Report</h1>
        <div className="muted">Generated on: {new Date().toLocaleDateString()}</div>

        <div className="section">
          <h2>Student & Policy</h2>
          <div className="kv">
            <div><b>Student name</b></div><div>{f.studentName || '—'}</div>
            <div><b>Pass mark</b></div><div>{passMark}</div>
          </div>
        </div>

        <div className="section">
          <h2>Predicted Outcome</h2>
          <div className="kv">
            <div><b>Predicted final grade</b></div><div>{pred.predicted}</div>
            <div><b>Chance to pass</b></div><div>{passProbPct}%</div>
            <div><b>Risk level</b></div><div>{riskLabel}</div>
          </div>
        </div>

        <div className="section">
          <h2>Today's Inputs (snapshot)</h2>
          <div className="kv">
            <div>Attendance</div><div>{f.attendancePct}%</div>
            <div>Study hours / week</div><div>{f.studyHours}</div>
            <div>Previous grade</div><div>{f.previousGrade}</div>
            <div>Extracurricular count</div><div>{f.extracurricularCount}</div>
            <div>Parental support</div><div>{f.parentalSupport}</div>
            <div>Online recap?</div><div>{f.online ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="section">
          <h2>Suggested Next Steps (2-week plan)</h2>
          <ul>
            {teacherTips(f).map((t,i)=><li key={i}>{t}</li>)}
          </ul>
          <p className="muted" style={{ marginTop: '8pt' }}>
            Note: AI-assisted guidance to support teacher judgment; not a final decision.
          </p>
        </div>

        <div className="sig">
          <div>Teacher Signature</div>
          <div>Parent/Guardian Signature</div>
        </div>
      </div>
    </div>
  )
}

/* -------- helpers & tiny UI bits -------- */
function teacherTips(f) {
  const out = []
  if (f.attendancePct < 80) out.push('Prioritise attendance this week (target ≥ 85%).')
  if (f.studyHours < 10) out.push('Add 2–4 self-study hours (two 1-hour evening blocks).')
  if (f.previousGrade < 60) out.push('Schedule 1:1 basics revision; share topic checklist.')
  if (f.extracurricularCount > 2 && f.studyHours < 10) out.push('Temporarily limit activities until tests are over.')
  if (f.parentalSupport === 'Low') out.push('Send weekly plan to parents; ask for quiet, fixed study time.')
  if (!f.online) out.push('Assign short recap videos (10–15 mins) after class.')
  if (!out.length) out.push('Maintain current habits; set a stretch goal for mock tests.')
  return out
}
function Field({ label, children }) {
  return (
    <div>
      <div className="text-sm mb-1">{label}</div>
      {children}
    </div>
  )
}
function KV({ label, children }) {
  return (
    <div className="flex items-center justify-between">
      <div className="opacity-90">{label}</div>
      <div>{children}</div>
    </div>
  )
}
