import React, { useMemo } from 'react'
import Panel from '../parts/Panel.jsx'
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, BarChart, Bar,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import { sampleStudents } from '../../utils/mockData.js'
import { TechDefs, TechTooltip, gridProps, ACCENT, CYAN, RED } from '../charts/TechChartKit.jsx'

export default function Insights() {
  const seq = useMemo(() => sampleStudents.map((s,i)=>({
    idx: i+1,
    attendance: Math.round(s.attendance*100),
    hours: s.hours,
    prev: s.prev,
    final: s.final
  })), [])

  const buckets = useMemo(() => {
    const b = { '<70':0,'70-79':0,'80-89':0,'90+':0 }
    sampleStudents.forEach(s => {
      const a = s.attendance*100
      if (a<70) b['<70']++; else if (a<80) b['70-79']++; else if (a<90) b['80-89']++; else b['90+']++
    })
    return Object.entries(b).map(([range, count]) => ({ range, count }))
  }, [])

  const onlineSplit = useMemo(() => {
    const online = sampleStudents.filter(s=>s.online)
    const offline = sampleStudents.filter(s=>!s.online)
    const avg = (arr,k)=> Math.round(arr.reduce((a,c)=>a+c[k],0)/(arr.length||1))
    return [
      { name: 'Online', value: online.length, avgFinal: avg(online,'final') },
      { name: 'Offline', value: offline.length, avgFinal: avg(offline,'final') },
    ]
  }, [])

  return (
    <div className="grid gap-4 mt-2"
      style={{ gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))' }}>
      {/* Trend: Attendance + Final with neon area/line */}
      <Panel style={{ borderLeft:'4px solid var(--color-accent)' }}>
        <h3 className="font-semibold mb-2 tracking-wide">Trend — Attendance vs Final</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <ComposedChart data={seq} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <TechDefs />
              <CartesianGrid {...gridProps}/>
              <XAxis dataKey="idx" stroke="#9BB3D3" tick={{ fontSize: 12 }}/>
              <YAxis stroke="#9BB3D3" tick={{ fontSize: 12 }}/>
              <TechTooltip labelFormatter={(l)=>`Student #${l}`} />
              <Area type="monotone" dataKey="attendance" fill="url(#fillAccent)" stroke="url(#gradAccent)" strokeWidth={2} />
              <Line type="monotone" dataKey="final" stroke="url(#gradCyan)" strokeWidth={3} dot={false}
                    strokeLinecap="round" style={{ filter:'url(#softGlow)' }}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Distribution: Attendance buckets with rounded neon bars */}
      <Panel style={{ borderLeft:'4px solid #4bd4ff' }}>
        <h3 className="font-semibold mb-2 tracking-wide">Distribution — Attendance (%)</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={buckets} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <TechDefs />
              <CartesianGrid {...gridProps}/>
              <XAxis dataKey="range" stroke="#9BB3D3" tick={{ fontSize: 12 }}/>
              <YAxis stroke="#9BB3D3" tick={{ fontSize: 12 }}/>
              <TechTooltip />
              <Bar dataKey="count" fill="url(#barCyan)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Cohort split: neon pie + legend */}
      <Panel style={{ borderLeft:'4px solid var(--color-secondary)' }}>
        <h3 className="font-semibold mb-2 tracking-wide">Cohort — Online vs Offline</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <TechDefs />
              <Pie data={onlineSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                <Cell fill={CYAN} />
                <Cell fill={RED} />
              </Pie>
              <Legend wrapperStyle={{ color:'#e6e8ee' }} />
              <TechTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs opacity-80 mt-1">
          Avg Final — Online: <b>{onlineSplit[0].avgFinal}</b>, Offline: <b>{onlineSplit[1].avgFinal}</b>
        </div>
      </Panel>
    </div>
  )
}
