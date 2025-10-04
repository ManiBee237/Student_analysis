import React, { useEffect, useMemo, useState } from 'react'
import Panel from '../parts/Panel.jsx'
import { predictGrade } from '../../utils/predict.js'

const panelBorder = 'rgba(255,255,255,0.12)'

const get = (k, d) => {
  const v = localStorage.getItem(k)
  const n = v === null ? d : Number(v)
  return Number.isFinite(n) ? n : d
}
const set = (k, v) => localStorage.setItem(k, String(v))

export default function Settings() {
  const [riskLow, setRiskLow] = useState(get('settings.riskLow', 50))
  const [riskMed, setRiskMed] = useState(get('settings.riskMed', 40))
  const [targetAttendance, setTargetAttendance] = useState(get('settings.targetAttendance', 85))
  const [optMinHours, setOptMinHours] = useState(get('settings.optMinHours', 12))
  const [optMaxHours, setOptMaxHours] = useState(get('settings.optMaxHours', 18))

  // persist as user types
  useEffect(()=>set('settings.riskLow', riskLow), [riskLow])
  useEffect(()=>set('settings.riskMed', riskMed), [riskMed])
  useEffect(()=>set('settings.targetAttendance', targetAttendance), [targetAttendance])
  useEffect(()=>set('settings.optMinHours', optMinHours), [optMinHours])
  useEffect(()=>set('settings.optMaxHours', optMaxHours), [optMaxHours])

  // live preview student
  const [preview, setPreview] = useState({
    attendancePct: 78, studyHours: 9, previousGrade: 58, extracurricularCount: 0, parentalSupport: 'Low', online: false
  })
  const pred = useMemo(()=>predictGrade(preview), [preview])
  const band = pred.predicted >= riskLow ? 'Low'
            : pred.predicted >= riskMed ? 'Medium' : 'High'

  const resetDefaults = () => {
    setRiskLow(50); setRiskMed(40); setTargetAttendance(85); setOptMinHours(12); setOptMaxHours(18)
  }

  const applyPreset = (p) => {
    if (p==='atrisk') { setTargetAttendance(85); setOptMinHours(12); setOptMaxHours(18); setRiskMed(45); setRiskLow(60) }
    if (p==='balanced') { setTargetAttendance(90); setOptMinHours(10); setOptMaxHours(16); setRiskMed(40); setRiskLow(55) }
    if (p==='strict') { setTargetAttendance(92); setOptMinHours(14); setOptMaxHours(20); setRiskMed(50); setRiskLow(70) }
  }

  return (
    <div className="grid gap-4 mt-2" style={{ gridTemplateColumns:'1.1fr 1fr' }}>
      {/* Left: Controls */}
      <Panel>
        <h2 className="text-lg font-semibold mb-3 tracking-wide">Global Settings</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm mb-1">Risk Bands — Low Risk cutoff (Predicted ≥)</div>
            <input type="number" min="0" max="100" value={riskLow}
              onChange={(e)=>setRiskLow(+e.target.value || 0)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }} />
            <div className="text-xs opacity-70 mt-1">Students at/above this score are labeled <b>Low</b> risk.</div>
          </div>

          <div>
            <div className="text-sm mb-1">Risk Bands — Medium Risk cutoff (Predicted ≥)</div>
            <input type="number" min="0" max="100" value={riskMed}
              onChange={(e)=>setRiskMed(+e.target.value || 0)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }} />
            <div className="text-xs opacity-70 mt-1">Scores between Medium and Low are <b>Medium</b> risk; below Medium are <b>High</b> risk.</div>
          </div>

          <div>
            <div className="text-sm mb-1">Target Attendance (%)</div>
            <input type="number" min="0" max="100" value={targetAttendance}
              onChange={(e)=>setTargetAttendance(+e.target.value || 0)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm mb-1">Optimal Hours — Min</div>
              <input type="number" min="0" max="40" value={optMinHours}
                onChange={(e)=>setOptMinHours(+e.target.value || 0)}
                className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }} />
            </div>
            <div>
              <div className="text-sm mb-1">Optimal Hours — Max</div>
              <input type="number" min="0" max="60" value={optMaxHours}
                onChange={(e)=>setOptMaxHours(+e.target.value || 0)}
                className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button onClick={resetDefaults} className="px-3 py-2 rounded border"
            style={{ borderColor: panelBorder }}>Reset Defaults</button>

          <select
            className="bg-transparent border rounded px-3 py-2"
            style={{ borderColor: panelBorder }}
            onChange={(e)=> e.target.value && applyPreset(e.target.value)}
            defaultValue=""
          >
            <option value="" className="bg-[#0b1220]">Apply Preset…</option>
            <option value="atrisk" className="bg-[#0b1220]">At-Risk Support</option>
            <option value="balanced" className="bg-[#0b1220]">Balanced</option>
            <option value="strict" className="bg-[#0b1220]">Strict Targets</option>
          </select>
        </div>

        <p className="text-[11px] opacity-70 mt-3">
          These settings are saved in your browser and used by the Prediction page for risk tags and recommendations.
        </p>
      </Panel>

      {/* Right: Live preview */}
      <Panel style={{ borderLeft:'4px solid var(--color-accent)' }}>
        <h3 className="font-semibold mb-2 tracking-wide">Live Preview</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm mb-1">Attendance (%)</div>
            <input type="range" min="0" max="100" value={preview.attendancePct}
              onChange={(e)=>setPreview(p=>({...p, attendancePct:+e.target.value}))} className="w-full" />
            <div className="text-xs opacity-80">{preview.attendancePct}%</div>
          </div>

          <div>
            <div className="text-sm mb-1">Study Hours / Week</div>
            <input type="range" min="0" max="40" value={preview.studyHours}
              onChange={(e)=>setPreview(p=>({...p, studyHours:+e.target.value}))} className="w-full" />
            <div className="text-xs opacity-80">{preview.studyHours} hrs</div>
          </div>

          <div>
            <div className="text-sm mb-1">Previous Grade</div>
            <input type="number" min="0" max="100" value={preview.previousGrade}
              onChange={(e)=>setPreview(p=>({...p, previousGrade:+e.target.value}))}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm mb-1">Extracurricular</div>
              <input type="number" min="0" max="5" value={preview.extracurricularCount}
                onChange={(e)=>setPreview(p=>({...p, extracurricularCount:+e.target.value}))}
                className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }} />
            </div>
            <div>
              <div className="text-sm mb-1">Parental Support</div>
              <select value={preview.parentalSupport}
                onChange={(e)=>setPreview(p=>({...p, parentalSupport:e.target.value}))}
                className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }}>
                <option className="bg-[#0b1220]">High</option>
                <option className="bg-[#0b1220]">Medium</option>
                <option className="bg-[#0b1220]">Low</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 mt-1">
            <input type="checkbox" checked={preview.online}
              onChange={(e)=>setPreview(p=>({...p, online:e.target.checked}))}
              className="w-4 h-4" />
            <span className="text-sm">Attends Online Classes</span>
          </label>
        </div>

        <div className="mt-3 rounded-lg p-3"
          style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${panelBorder}` }}>
          <div className="flex items-center justify-between">
            <div className="opacity-90 text-sm">Predicted Grade</div>
            <div className="text-2xl font-bold" style={{ color:'var(--color-accent)' }}>{pred.predicted}</div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="opacity-90 text-sm">Pass Probability</div>
            <div className="text-base font-semibold" style={{ color:'#9BE7FF' }}>{Math.round(pred.passProb*100)}%</div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="opacity-90 text-sm">Risk Band</div>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
              style={{
                color: band==='High' ? 'var(--color-secondary)' : band==='Medium' ? 'var(--color-accent)' : '#4bd4ff',
                borderColor: band==='High' ? 'var(--color-secondary)' : band==='Medium' ? 'var(--color-accent)' : '#4bd4ff',
                background:'rgba(255,255,255,0.04)'
              }}>{band}</span>
          </div>
          <div className="text-[11px] opacity-70 mt-2">
            Bands: Low ≥ {riskLow}, Medium ≥ {riskMed}. Target attendance {targetAttendance}%. Optimal hours {optMinHours}–{optMaxHours}.
          </div>
        </div>
      </Panel>
    </div>
  )
}
