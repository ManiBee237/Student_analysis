// src/components/tabs/Clustering.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Panel from '../parts/Panel.jsx'
import { useDataset } from '../../context/DatasetContext.jsx'
import { predictGrade } from '../../utils/predict.js'
import SearchBox from '../parts/SearchBox.jsx'
import { filterByQuery } from '../../utils/search.js'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ScatterChart, Scatter, ReferenceLine
} from 'recharts'
import { TechDefs, TechTooltip, gridProps, ACCENT, CYAN } from '../charts/TechChartKit.jsx'

const panelBorder = 'rgba(255,255,255,0.12)'
const CLRS = ['#4bd4ff', '#FEB21A', '#ED3F27', '#9BE7FF', '#7EE787', '#F087FF', '#FF9DA4']

/* ---------- helpers ---------- */
function zscore(arr){
  const n = arr.length || 1
  const m = arr.reduce((a,b)=>a+(+b||0),0)/n
  const sd = Math.sqrt(arr.reduce((s,v)=>s+((v-m)**2),0)/(n||1)) || 1
  return arr.map(v => (v-m)/sd)
}
function kmeans(points, k=3, maxIter=50) {
  if (!points.length) return { labels: [], centers: [] }
  const dim = points[0].length, n = points.length
  const picks = Array.from({length:k},(_,i)=>Math.floor((i+0.5)*n/k))
  const centers = picks.map(p => points[p].slice())
  let labels = new Array(n).fill(0)
  for (let it=0; it<maxIter; it++){
    let changed = false
    for (let i=0;i<n;i++){
      let best=0, bestd=Infinity
      for (let c=0;c<k;c++){
        let d=0; for (let j=0;j<dim;j++){ const diff=points[i][j]-centers[c][j]; d += diff*diff }
        if (d<bestd){ bestd=d; best=c }
      }
      if (labels[i]!==best){ labels[i]=best; changed=true }
    }
    const sums = Array.from({length:k},()=>Array(dim).fill(0))
    const counts = Array(k).fill(0)
    for (let i=0;i<n;i++){ const lab=labels[i]; counts[lab]++; for (let j=0;j<dim;j++) sums[lab][j]+=points[i][j] }
    for (let c=0;c<k;c++){ const cnt=counts[c]||1; for (let j=0;j<dim;j++) centers[c][j]=sums[c][j]/cnt }
    if (!changed) break
  }
  return { labels, centers }
}
function usePngExporter(){
  const makeDownload = (ref, name) => () => {
    const wrap = ref.current; if (!wrap) return
    const svg = wrap.querySelector('svg'); if (!svg) return alert('Chart not ready')
    const { width: wCSS, height: hCSS } = svg.getBoundingClientRect()
    const width = Math.max(1, Math.ceil(wCSS)), height = Math.max(1, Math.ceil(hCSS))
    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height))
    if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
    const NS='http://www.w3.org/2000/svg'; const bg = document.createElementNS(NS,'rect')
    bg.setAttribute('x','0'); bg.setAttribute('y','0'); bg.setAttribute('width', String(width)); bg.setAttribute('height', String(height))
    bg.setAttribute('fill','#0b1220'); clone.insertBefore(bg, clone.firstChild)
    const src = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([src], { type:'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob); const img = new Image()
    img.onload = () => {
      const scale = 2; const c = document.createElement('canvas')
      c.width = width*scale; c.height = height*scale
      const ctx = c.getContext('2d'); ctx.fillStyle = '#0b1220'; ctx.fillRect(0,0,c.width,c.height)
      ctx.drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url)
      const a = document.createElement('a'); a.download = `${name}.png`; a.href = c.toDataURL('image/png'); a.click()
    }
    img.onerror = () => { URL.revokeObjectURL(url); alert('Could not render PNG') }
    img.src = url
  }
  return { makeDownload }
}

/* Heatmap grid (density) */
function HeatmapGrid({ points, xDomain, yDomain, bins=20 }) {
  const [xMin,xMax] = xDomain, [yMin,yMax] = yDomain
  const xw = (xMax - xMin) || 1, yw = (yMax - yMin) || 1
  const grid = Array.from({length:bins},()=>Array(bins).fill(0))
  points.forEach(p=>{
    if (p.x==null || p.y==null) return
    const xi = Math.max(0, Math.min(bins-1, Math.floor((p.x - xMin) / xw * bins)))
    const yi = Math.max(0, Math.min(bins-1, Math.floor((p.y - yMin) / yw * bins)))
    grid[yi][xi] += 1
  })
  const max = grid.flat().reduce((m,v)=>v>m?v:m, 1)
  const cell = 1000 / bins
  const color = (v)=>`rgba(20,180,255,${(0.08 + 0.72*Math.sqrt(v/max)).toFixed(3)})`
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
      {grid.map((row, yi)=> row.map((v, xi)=> (
        v>0 ? <rect key={`${xi}-${yi}`} x={xi*cell} y={(bins-1-yi)*cell} width={cell} height={cell} fill={color(v)} /> : null
      )))}
      <rect x="0" y="0" width="1000" height="1000" fill="none" stroke="rgba(255,255,255,0.12)" />
    </svg>
  )
}

/* ---------- component ---------- */
export default function ClusteringTab(){
  const { data, source } = useDataset()
  const passMark = +(localStorage.getItem('pred.passMark') ?? 40)

  // Controls
  const [k, setK] = useState(3)
  const [weights, setWeights] = useState({ attendance:1, hours:1, prev:1, activities:0.8, parent:0.8, online:0.5 })
  const [sortBy, setSortBy] = useState({ key: 'cluster', dir: 'asc' })
  const [filterCluster, setFilterCluster] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('') // highlight student

  // Auto-reset group filter when k changes (prevents empty table)
  useEffect(()=>{ setFilterCluster('All') }, [k])

  // Map controls
  const AXIS = [
    { key:'attendancePct', label:'Attendance %' },
    { key:'hours', label:'Study hours / week' },
    { key:'prev', label:'Previous grade' },
    { key:'finalOrPred', label:'Final (or Predicted)' },
  ]
  const [xKey, setXKey] = useState('attendancePct')
  const [yKey, setYKey] = useState('finalOrPred')
  const [renderMode, setRenderMode] = useState('Auto') // Auto | Scatter | Heatmap
  const [binCount, setBinCount] = useState(24)
  const SCATTER_SAMPLE = 400

  // Build rows (safe ids + unique keys)
  const rows = useMemo(()=> data.map((r,i)=>{
    const rawId = r.id
    const hasId = rawId !== null && rawId !== undefined && String(rawId).trim() !== ''
    const safeId = hasId ? String(rawId) : String(i+1)
    return {
      _key: `${safeId}#${i}`,
      id: safeId,
      name: r.name ?? `Student ${i+1}`,
      attendancePct: Math.round((r.attendance ?? 0) * 100),
      hours: +r.hours || 0,
      prev: +r.prev || 0,
      final: Number.isFinite(+r.final) ? +r.final : null,
      parent: r.parent || 'Medium',
      online: !!r.online,
      activities: typeof r.activities === 'number' ? r.activities : 0
    }
  }), [data])

  // Feature matrix (z-scored, weighted)
  const feats = useMemo(()=>{
    const att = zscore(rows.map(r=>r.attendancePct))
    const hrs = zscore(rows.map(r=>r.hours))
    const prv = zscore(rows.map(r=>r.prev))
    const act = zscore(rows.map(r=>r.activities))
    const par = rows.map(r => r.parent==='High'?2 : r.parent==='Medium'?1 : 0)
    const parN = zscore(par)
    const onl = rows.map(r => r.online ? 1 : 0)
    const onlN = zscore(onl)
    return rows.map((_,i)=>[
      att[i]*(+weights.attendance||0),
      hrs[i]*(+weights.hours||0),
      prv[i]*(+weights.prev||0),
      act[i]*(+weights.activities||0),
      parN[i]*(+weights.parent||0),
      onlN[i]*(+weights.online||0),
    ])
  }, [rows, weights])

  // k-means + enriched rows
  const km = useMemo(()=> kmeans(feats, Math.max(1, Math.min(7, +k || 1))), [feats, k])
  const enriched = useMemo(()=>{
    const lab = km.labels || []
    return rows.map((r, i) => ({ ...r, cluster: (lab[i] ?? 0) }))
  }, [rows, km])

  // with predicted final when missing
  const withPred = useMemo(()=>{
    return enriched.map(r=>{
      let finalOrPred = r.final
      if (!Number.isFinite(finalOrPred)) {
        finalOrPred = predictGrade({
          attendancePct: r.attendancePct,
          studyHours: r.hours,
          previousGrade: r.prev,
          extracurricularCount: r.activities || 0,
          parentalSupport: r.parent,
          online: r.online
        }).predicted
      }
      return { ...r, finalOrPred }
    })
  }, [enriched])

  // Search affects charts as well (name + id)
  const baseRowsForChart = useMemo(()=>{
    return filterByQuery(withPred, query, ['name','id'])
  }, [withPred, query])

  // Map points (all)
  const allPoints = useMemo(()=>{
    return baseRowsForChart.map(r => ({
      id: r.id, name: r.name, cluster: r.cluster,
      x: r[xKey], y: r[yKey]
    })).filter(p => p.x!=null && p.y!=null)
  }, [baseRowsForChart, xKey, yKey])

  // Overall domains with 5% pad
  const baseX = useMemo(()=>{
    const vals = allPoints.map(p=>p.x)
    const min = Math.min(...vals, 0), max = Math.max(...vals, 1)
    const span = max - min || 1
    return [min - 0.05*span, max + 0.05*span]
  }, [allPoints])
  const baseY = useMemo(()=>{
    const vals = allPoints.map(p=>p.y)
    const min = Math.min(...vals, 0), max = Math.max(...vals, 1)
    const span = max - min || 1
    return [min - 0.05*span, max + 0.05*span]
  }, [allPoints])

  // Zoom ranges
  const [xRange, setXRange] = useState([0, 100])
  const [yRange, setYRange] = useState([0, 100])

  useEffect(()=>{ setXRange([round1(baseX[0]), round1(baseX[1])]) }, [xKey, baseX[0], baseX[1]])
  useEffect(()=>{ setYRange([round1(baseY[0]), round1(baseY[1])]) }, [yKey, baseY[0], baseY[1]])

  const xDomainView = xRange
  const yDomainView = yRange

  // Mode + sampling
  const big = allPoints.length > 600
  const mode = renderMode === 'Auto' ? (big ? 'Heatmap' : 'Scatter') : renderMode
  const [showAllScatter, setShowAllScatter] = useState(false)

  // Filter points to zoom window
  const inView = (p)=> p.x>=xDomainView[0] && p.x<=xDomainView[1] && p.y>=yDomainView[0] && p.y<=yDomainView[1]
  const viewPointsAll = allPoints.filter(inView)

  const samplePoints = useMemo(()=>{
    if (mode !== 'Scatter') return viewPointsAll
    if (showAllScatter) return viewPointsAll
    return viewPointsAll.slice(0, 400)
  }, [viewPointsAll, mode, showAllScatter])

  // Cluster summaries (for bar)
  const clusterStats = useMemo(()=>{
    const s = {}
    enriched.forEach(r=>{
      const c=r.cluster
      if (!s[c]) s[c] = { count:0, att:0, hrs:0, prev:0, final:0, finalCnt:0 }
      s[c].count++; s[c].att+=r.attendancePct; s[c].hrs+=r.hours; s[c].prev+=r.prev
      if (Number.isFinite(r.final)) { s[c].final+=r.final; s[c].finalCnt++ }
    })
    return Object.entries(s).map(([cid,v])=>({
      cid:+cid, size:v.count,
      avgAttend: Math.round(v.att/v.count),
      avgHours: Math.round(v.hrs/v.count),
      avgPrev: Math.round(v.prev/v.count),
      avgFinal: v.finalCnt? Math.round(v.final/v.finalCnt) : '—'
    })).sort((a,b)=>a.cid-b.cid)
  }, [enriched])

  // Filters/search/sort for table
  const columns = [
    { key:'cluster', label:'Group' },
    { key:'name', label:'Student' },
    { key:'attendancePct', label:'Attendance %' },
    { key:'hours', label:'Study hrs/wk' },
    { key:'prev', label:'Prev grade' },
    { key:'final', label:'Final (if any)' },
    { key:'parent', label:'Parental' },
    { key:'online', label:'Online?' },
    { key:'activities', label:'Activities' },
  ]
  const onSort = (key) => setSortBy(s => (s.key===key ? {key, dir: s.dir==='asc'?'desc':'asc'} : {key, dir:'asc'}))

  const filtered = useMemo(()=>{
    // text search first (name, id)
    let base = filterByQuery(enriched, query, ['name','id'])
    // cluster filter next
    if (filterCluster !== 'All') base = base.filter(r => r.cluster === +filterCluster)
    return base
  }, [enriched, query, filterCluster])

  const sorted = useMemo(()=>{
    const arr=[...filtered]; const {key,dir}=sortBy
    arr.sort((a,b)=>{
      const va=a[key], vb=b[key]
      if (typeof va === 'string' || typeof vb === 'string') {
        const res = String(va??'').localeCompare(String(vb??''), undefined, { sensitivity:'base' })
        return dir==='asc'? res : -res
      }
      const na = Number(va ?? 0), nb = Number(vb ?? 0)
      return dir==='asc' ? na - nb : nb - na
    })
    return arr
  }, [filtered, sortBy])

  // Export CSV
  function exportCSV(){
    const header=['id','name','cluster','attendance%','hours','prev','final','parent','online','activities']
    const lines=[header, ...enriched.map(r=>[
      r.id,r.name,r.cluster,r.attendancePct,r.hours,r.prev,(r.final??''),r.parent,(r.online?'Yes':'No'),r.activities
    ])]
    const csv=lines.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download='clusters.csv'; a.click(); URL.revokeObjectURL(url)
  }

  // PNG refs
  const { makeDownload } = usePngExporter()
  const refSizes = useRef(null)
  const refScatter = useRef(null)

  useEffect(()=>{ if (selectedId && !rows.find(r=>String(r.id)===String(selectedId))) setSelectedId('') }, [rows, selectedId])

  // --- UI ---
  return (
    <div className="space-y-4 mt-2">
      <Panel>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide">Student Clustering (Learning Profiles)</h2>
          <div className="text-xs opacity-80">
            Data source: <b>{source === 'csv' ? 'Your CSV' : 'Sample dataset'}</b>
          </div>
        </div>
        <p className="text-sm opacity-90 mt-2">
          Use <b>Zoom ranges</b> to focus on specific bands (e.g., Attendance 50–80%). Auto mode switches to Heatmap for very large classes.
        </p>
      </Panel>

      {/* Controls */}
      <Panel>
        <div className="grid xl:grid-cols-4 gap-4">
          <Field label="Number of groups">
            <select value={k} onChange={(e)=>setK(+e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }}>
              {[2,3,4,5,6,7].map(n=><option key={n} className="bg-[#0b1220]" value={n}>{n}</option>)}
            </select>
          </Field>

          <Field label="Filter by group">
            <select value={filterCluster} onChange={(e)=>setFilterCluster(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }}>
              <option className="bg-[#0b1220]" value="All">All</option>
              {Array.from({length:k},(_,i)=><option key={i} className="bg-[#0b1220]" value={i}>Group {i+1}</option>)}
            </select>
          </Field>

          <Field label="Search by name or ID">
            <SearchBox value={query} onChange={setQuery} placeholder="Type a name or ID…" />
          </Field>

          <Field label="Highlight a student">
            <select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }}>
              <option className="bg-[#0b1220]" value="">— None —</option>
              {rows.map(r=>(
                <option key={r._key} className="bg-[#0b1220]" value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Feature weights */}
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <Weight label="Attendance" value={weights.attendance} onChange={v=>setWeights(s=>({...s, attendance:v}))} />
          <Weight label="Study hours" value={weights.hours} onChange={v=>setWeights(s=>({...s, hours:v}))} />
          <Weight label="Previous grade" value={weights.prev} onChange={v=>setWeights(s=>({...s, prev:v}))} />
          <Weight label="Activities" value={weights.activities} onChange={v=>setWeights(s=>({...s, activities:v}))} />
          <Weight label="Parental support" value={weights.parent} onChange={v=>setWeights(s=>({...s, parent:v}))} />
          <Weight label="Online recaps" value={weights.online} onChange={v=>setWeights(s=>({...s, online:v}))} />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={()=>{ setQuery(''); setFilterCluster('All') }}
            className="px-3 py-2 rounded font-medium"
            style={{ border:`1px solid ${panelBorder}` }}
          >
            Reset filters
          </button>
          <button onClick={exportCSV} className="px-3 py-2 rounded font-medium" style={{ border:`1px solid ${panelBorder}` }}>
            Export clusters CSV
          </button>
        </div>
      </Panel>

      {/* Charts with Zoom Panel */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cluster sizes */}
        <Panel style={{ borderLeft:'4px solid var(--color-accent)' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold tracking-wide">Group sizes</h3>
            <button onClick={makeDownload(refSizes,'cluster_sizes')}
              className="px-3 py-1.5 rounded font-medium" style={{ background:'var(--color-accent)', color:'#1a1f2b' }}>
              Download PNG
            </button>
          </div>
          <p className="text-sm opacity-90 mb-2">How many students are in each group.</p>
          <div ref={refSizes} style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={clusterStats} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <TechDefs />
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="cid" stroke="#9BB3D3" tickFormatter={(v)=>`G${v+1}`} />
                <YAxis stroke="#9BB3D3" allowDecimals={false} />
                <TechTooltip />
                <Bar dataKey="size" radius={[6,6,0,0]} fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Zoom controls */}
        <Panel>
          <h3 className="font-semibold tracking-wide mb-2">Zoom ranges</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">{AXIS.find(a=>a.key===xKey)?.label} (X)</div>
              <div className="flex items-center gap-2">
                <NumBox value={xDomainView[0]} onChange={(v)=>setXRange([clamp(v, baseX[0], xDomainView[1]), xDomainView[1]])} />
                <span className="opacity-60">to</span>
                <NumBox value={xDomainView[1]} onChange={(v)=>setXRange([xDomainView[0], clamp(v, xDomainView[0], baseX[1])])} />
              </div>
            </div>
            <div>
              <div className="text-sm mb-1">{AXIS.find(a=>a.key===yKey)?.label} (Y)</div>
              <div className="flex items-center gap-2">
                <NumBox value={yDomainView[0]} onChange={(v)=>setYRange([clamp(v, baseY[0], yDomainView[1]), yDomainView[1]])} />
                <span className="opacity-60">to</span>
                <NumBox value={yDomainView[1]} onChange={(v)=>setYRange([yDomainView[0], clamp(v, yDomainView[0], baseY[1])])} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={()=>{ setXRange([round1(baseX[0]), round1(baseX[1])]); setYRange([round1(baseY[0]), round1(baseY[1])]) }}
              className="px-3 py-2 rounded font-medium"
              style={{ border:`1px solid ${panelBorder}` }}
            >
              Reset Zoom
            </button>
          </div>
          <p className="text-xs opacity-70 mt-2">Tip: narrow the ranges to de-clutter dense regions.</p>
        </Panel>
      </div>

      {/* Map panel (Scatter / Heatmap) */}
      <Panel style={{ borderLeft:'4px solid var(--color-accent)' }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold tracking-wide">Learning pattern map</h3>
          <button onClick={makeDownload(refScatter, mode==='Heatmap'?'cluster_heatmap':'cluster_scatter')}
            className="px-3 py-1.5 rounded font-medium" style={{ background:'var(--color-accent)', color:'#1a1f2b' }}>
            Download PNG
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-2">
          <Field label="Render mode">
            <select value={renderMode} onChange={(e)=>setRenderMode(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }}>
              {['Auto','Scatter','Heatmap'].map(m=><option key={m} className="bg-[#0b1220]" value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="X axis">
            <select value={xKey} onChange={(e)=>setXKey(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }}>
              {AXIS.map(a=> <option key={a.key} className="bg-[#0b1220]" value={a.key}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Y axis">
            <select value={yKey} onChange={(e)=>setYKey(e.target.value)}
              className="w-full bg-transparent border rounded px-3 py-2" style={{ borderColor: panelBorder }}>
              {AXIS.map(a=> <option key={a.key} className="bg-[#0b1220]" value={a.key}>{a.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="text-xs opacity-80 mb-1">
          Showing points where <b>{AXIS.find(a=>a.key===xKey)?.label}</b> ∈ [{xDomainView[0]}, {xDomainView[1]}] and <b>{AXIS.find(a=>a.key===yKey)?.label}</b> ∈ [{yDomainView[0]}, {yDomainView[1]}].
        </div>

        <div ref={refScatter} style={{ height: 320 }}>
          {mode === 'Heatmap' ? (
            <div style={{ position:'relative', height:'100%' }}>
              <div className="absolute right-2 top-2 text-xs opacity-80 bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded border"
                   style={{ borderColor: panelBorder }}>
                Heatmap bins:
                <select value={binCount} onChange={(e)=>setBinCount(+e.target.value)} className="ml-2 bg-transparent">
                  {[16,20,24,28,32].map(b=><option key={b} className="bg-[#0b1220]" value={b}>{b}×{b}</option>)}
                </select>
              </div>
              <div className="absolute left-0 right-0 top-0 bottom-0">
                <ResponsiveContainer>
                  <BarChart data={[{x:0}]} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <TechDefs />
                    <CartesianGrid {...gridProps} />
                    <XAxis stroke="#9BB3D3" domain={xDomainView} type="number" dataKey="x" />
                    <YAxis stroke="#9BB3D3" domain={yDomainView} type="number" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute left-10 right-10 top-8 bottom-20">
                <HeatmapGrid points={viewPointsAll} xDomain={xDomainView} yDomain={yDomainView} bins={binCount} />
              </div>
              {yKey==='finalOrPred' && (
                <div className="absolute left-10 right-10 top-8 bottom-20 pointer-events-none">
                  <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                    {(() => {
                      const [y0,y1]=yDomainView
                      const t = (passMark - y0) / ((y1-y0)||1)
                      const y = 1000 - (t*1000)
                      return <line x1="0" x2="1000" y1={y} y2={y} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 3" />
                    })()}
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs opacity-80 mb-1">
                {viewPointsAll.length > SCATTER_SAMPLE && (
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={showAllScatter} onChange={e=>setShowAllScatter(e.target.checked)} />
                    <span>Show all points ({viewPointsAll.length})</span>
                  </label>
                )}
                {!showAllScatter && viewPointsAll.length > SCATTER_SAMPLE && (
                  <span>(showing {SCATTER_SAMPLE})</span>
                )}
              </div>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <TechDefs />
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="x" stroke="#9BB3D3" domain={xDomainView} type="number" />
                  <YAxis dataKey="y" stroke="#9BB3D3" domain={yDomainView} type="number" />
                  <RTooltip cursor={{ strokeDasharray: '3 3' }} />
                  {Array.from({length:k},(_,ci)=>{
                    const dataCi = samplePoints.filter(p=>p.cluster===ci)
                    const isSel = (p)=> String(p.id)===String(selectedId)
                    return (
                      <Scatter key={ci} data={dataCi} fill={CLRS[ci % CLRS.length]}
                        shape={(props)=>{
                          const { cx, cy, payload } = props
                          const selected = isSel(payload)
                          return (
                            <g>
                              {selected && (
                                <>
                                  <circle cx={cx} cy={cy} r={8} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
                                  <circle cx={cx} cy={cy} r={5} fill={CYAN} />
                                </>
                              )}
                              {!selected && <circle cx={cx} cy={cy} r={3.5} fill={CLRS[ci % CLRS.length]} />}
                            </g>
                          )
                        }}
                      />
                    )
                  })}
                  {/* pseudo-centroids */}
                  {Array.from({length:k},(_,ci)=>{
                    const pts = viewPointsAll.filter(p=>p.cluster===ci)
                    if (!pts.length) return null
                    const mid = pts[Math.floor(pts.length/2)]
                    return (
                      <ReferenceLine
                        key={`cent-${ci}`}
                        x={mid.x}
                        y={mid.y}
                        ifOverflow="discard"
                        stroke={CLRS[ci % CLRS.length]}
                        strokeDasharray="6 4"
                      />
                    )
                  })}
                  {yKey==='finalOrPred' && <ReferenceLine y={passMark} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 3" />}
                </ScatterChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </Panel>

      {/* Group summaries */}
      <Panel>
        <h3 className="font-semibold mb-2 tracking-wide">Group summaries</h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {clusterStats.map(stat=>(
            <div key={stat.cid} className="rounded-lg p-3"
                 style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${panelBorder}` }}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ background: CLRS[stat.cid % CLRS.length] }} />
                  Group {stat.cid+1}
                </div>
                <div className="text-xs opacity-80">{stat.size} students</div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                <KV label="Avg attendance">{stat.avgAttend}%</KV>
                <KV label="Avg study hrs">{stat.avgHours}</KV>
                <KV label="Avg previous">{stat.avgPrev}</KV>
                <KV label="Avg final">{stat.avgFinal}</KV>
              </div>
            </div>
          ))}
          {clusterStats.length === 0 && <div className="text-sm opacity-80">No data to summarize.</div>}
        </div>
      </Panel>

      {/* Table */}
      <Panel>
        <div className="overflow-auto no-scrollbar" style={{ maxHeight: 520 }}>
          <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                {columns.map(col=>(
                  <th key={col.key} onClick={()=>onSort(col.key)}
                      className="px-3 py-2 text-left sticky top-0 cursor-pointer select-none"
                      style={{ background:'rgba(19,70,134,0.65)', color:'#e9f0ff', borderBottom:`1px solid ${panelBorder}`, backdropFilter:'blur(6px)' }}>
                    <div className="flex items-center gap-2">
                      <span>{col.label}</span>
                      {sortBy.key===col.key && <span className="text-[10px] opacity-90">{sortBy.dir==='asc'?'▲':'▼'}</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx)=>(
                <tr key={r._key}
                    className={`transition-colors ${String(r.id)===String(selectedId) ? 'ring-1' : ''}`}
                    style={{
                      background: idx%2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      outline: String(r.id)===String(selectedId) ? `2px solid ${CLRS[r.cluster % CLRS.length]}` : 'none'
                    }}>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${panelBorder}`, color: CLRS[r.cluster % CLRS.length] }}>
                      G{r.cluster+1}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{r.attendancePct}%</td>
                  <td className="px-3 py-2">{r.hours}</td>
                  <td className="px-3 py-2">{r.prev}</td>
                  <td className="px-3 py-2">{r.final ?? '—'}</td>
                  <td className="px-3 py-2">{r.parent}</td>
                  <td className="px-3 py-2">{r.online ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{r.activities}</td>
                </tr>
              ))}

              {sorted.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center opacity-80" colSpan={columns.length}>
                    No students match the current search or group filter.
                    <button
                      onClick={()=>{ setQuery(''); setFilterCluster('All') }}
                      className="ml-3 px-2 py-1 rounded text-sm"
                      style={{ border:`1px solid ${panelBorder}` }}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 p-3 rounded-lg"
             style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${panelBorder}` }}>
          <p className="text-sm opacity-90">
            <b>Tips:</b> Use <b>Zoom ranges</b> to focus on specific regions. Heatmap is best for very large classes;
            Scatter is best for small/medium. The horizontal line shows the pass mark when Y is Final/Predicted.
          </p>
        </div>
      </Panel>
    </div>
  )
}

/* ---------- tiny UI helpers ---------- */
function Weight({ label, value, onChange }){
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="opacity-80">{value.toFixed(1)}</span>
      </div>
      <input type="range" min="0" max="2" step="0.1" value={value}
             onChange={(e)=>onChange(parseFloat(e.target.value))}
             className="w-full" />
    </div>
  )
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
    <div className="flex items-center justify-between text-sm">
      <div className="opacity-90">{label}</div>
      <div>{children}</div>
    </div>
  )
}
function NumBox({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e)=>onChange(parseFloat(e.target.value))}
      className="w-full bg-transparent border rounded px-3 py-2"
      style={{ borderColor: panelBorder }}
    />
  )
}
function clamp(v, min, max){ const n=Number.isFinite(+v)?+v:min; return Math.min(max, Math.max(min, n)) }
function round1(v){ return Math.round((+v||0)*10)/10 }
