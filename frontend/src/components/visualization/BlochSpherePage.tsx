import React, { useEffect, useRef, useState } from 'react'

// Lightweight wrapper to load Plotly from CDN when needed
const loadPlotly = () => {
  if ((window as any).Plotly) return Promise.resolve((window as any).Plotly)
  return new Promise<any>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.plot.ly/plotly-latest.min.js'
    s.async = true
    s.onload = () => resolve((window as any).Plotly)
    s.onerror = reject
    document.head.appendChild(s)
  })
}

const radToDeg = (rad: number) => Math.round(rad * 180 / Math.PI)

const setQubitVector = (theta: number, phi: number) => {
  const x = Math.sin(theta) * Math.cos(phi)
  const y = Math.sin(theta) * Math.sin(phi)
  const z = Math.cos(theta)
  return { x: [0, x], y: [0, y], z: [0, z] }
}

const makeSphereData = (resolution = 120) => {
  const sphere: any = { type: 'surface', x: [], y: [], z: [], opacity: 0.2, colorscale: 'Blues', showscale: false, hoverinfo: 'none' }
  for (let i = 0; i <= resolution; i++) {
    const t = Math.PI * i / resolution
    const xr: number[] = []
    const yr: number[] = []
    const zr: number[] = []
    for (let j = 0; j <= resolution; j++) {
      const p = 2 * Math.PI * j / resolution
      xr.push(Math.sin(t) * Math.cos(p))
      yr.push(Math.sin(t) * Math.sin(p))
      zr.push(Math.cos(t))
    }
    sphere.x.push(xr)
    sphere.y.push(yr)
    sphere.z.push(zr)
  }
  return sphere
}

const makeGuideCircles = () => {
  const latitudes = [Math.PI / 5, 2 * Math.PI / 5, 3 * Math.PI / 5, 4 * Math.PI / 5]
  const horizontal = latitudes.map(thetaLat => {
    const xLine: number[] = []
    const yLine: number[] = []
    const zLine: number[] = []
    const longRes = 80
    for (let j = 0; j <= longRes; j++) {
      const phi = 2 * Math.PI * j / longRes
      xLine.push(Math.sin(thetaLat) * Math.cos(phi))
      yLine.push(Math.sin(thetaLat) * Math.sin(phi))
      zLine.push(Math.cos(thetaLat))
    }
    return { type: 'scatter3d', mode: 'lines', x: xLine, y: yLine, z: zLine, line: { color: 'grey', width: 1 }, showlegend: false }
  })

  const verticalAngles = [0, Math.PI / 2]
  const vertical = verticalAngles.map(phiVert => {
    const xLine: number[] = []
    const yLine: number[] = []
    const zLine: number[] = []
    const latRes = 80
    for (let i = 0; i <= latRes; i++) {
      const theta = Math.PI * i / latRes
      xLine.push(Math.sin(theta) * Math.cos(phiVert))
      yLine.push(Math.sin(theta) * Math.sin(phiVert))
      zLine.push(Math.cos(theta))
    }
    return { type: 'scatter3d', mode: 'lines', x: xLine, y: yLine, z: zLine, line: { color: 'grey', width: 1 }, showlegend: false }
  })

  return [...horizontal, ...vertical]
}

const makeAxes = () => {
  const axis = (x1: number, x2: number, color: string, label: string, lx: number, ly: number, lz: number) => [
    { type: 'scatter3d', mode: 'lines', x: [x1, x2], y: [0, 0], z: [0, 0], line: { color, width: 4 }, showlegend: false },
    { type: 'scatter3d', mode: 'text', x: [lx], y: [ly], z: [lz], text: [label], textposition: 'top center', showlegend: false, textfont: { size: 16 } }
  ]
  const yaxis = (y1: number, y2: number, color: string, label: string, lx: number, ly: number, lz: number) => [
    { type: 'scatter3d', mode: 'lines', x: [0, 0], y: [y1, y2], z: [0, 0], line: { color, width: 4 }, showlegend: false },
    { type: 'scatter3d', mode: 'text', x: [lx], y: [ly], z: [lz], text: [label], textposition: 'top center', showlegend: false, textfont: { size: 16 } }
  ]
  const zaxis = (z1: number, z2: number, color: string, label: string, lx: number, ly: number, lz: number) => [
    { type: 'scatter3d', mode: 'lines', x: [0, 0], y: [0, 0], z: [z1, z2], line: { color, width: 4 }, showlegend: false },
    { type: 'scatter3d', mode: 'text', x: [lx], y: [ly], z: [lz], text: [label], textposition: 'top center', showlegend: false, textfont: { size: 16 } }
  ]

  return [
    ...axis(-1.3, 1.3, 'red', '|+⟩', 1.4, 0, 0),
    ...axis(-1.3, 1.3, 'red', '|−⟩', -1.4, 0, 0),
    ...yaxis(-1.3, 1.3, 'blue', '|+i⟩', 0, 1.4, 0),
    ...yaxis(-1.3, 1.3, 'blue', '|−i⟩', 0, -1.4, 0),
    ...zaxis(-1.3, 1.3, 'green', '|0⟩', 0, 0, 1.4),
    ...zaxis(-1, 1.3, 'green', '|1⟩', 0, 0, -1.4)
  ]
}

const BlochSpherePage: React.FC = () => {
  const plotRef = useRef<HTMLDivElement | null>(null)
  const [theta, setTheta] = useState(0)
  const [phi, setPhi] = useState(0)
  const vectorRef = useRef<any>(setQubitVector(0, 0))

  useEffect(() => {
    let mounted = true
    loadPlotly().then(Plotly => {
      if (!mounted || !plotRef.current) return

      const sphere = makeSphereData()
      const guides = makeGuideCircles()
      const axes = makeAxes()
      const vector = vectorRef.current

      const vectorTrace = {
        type: 'scatter3d', mode: 'lines+markers', x: vector.x, y: vector.y, z: vector.z,
        line: { color: 'orange', width: 8 }, marker: { size: 7, color: 'orange', symbol: 'triangle-right' }, hoverinfo: 'none'
      }

      const data = [sphere, ...guides, ...axes, vectorTrace]
      const layout = {
        scene: { aspectmode: 'cube', xaxis: { visible: false, showgrid: false }, yaxis: { visible: false, showgrid: false }, zaxis: { visible: false, showgrid: false } },
        paper_bgcolor: 'white', margin: { l: 0, r: 0, b: 0, t: 60 }, scene_camera: { eye: { x: 1.7, y: 1.7, z: 1.7 } }, showlegend: false
      }

      Plotly.newPlot(plotRef.current, data, layout)
    }).catch(err => console.error('Failed to load Plotly', err))
    return () => { mounted = false }
  }, [])

  // update the vector on slider change or gates
  const updatePlotVector = (t: number, p: number) => {
    loadPlotly().then(Plotly => {
      const v = setQubitVector(t, p)
      vectorRef.current = v
      if (plotRef.current) {
        // Attempt to update the last trace (vector) - Plotly expects arrays per-trace
        try {
          Plotly.update(plotRef.current, { x: [v.x], y: [v.y], z: [v.z] }, {}, [ (plotRef.current.data ? plotRef.current.data.length - 1 : -1) ])
        } catch (e) {
          // fallback: redraw entire plot
          const sphere = makeSphereData()
          const guides = makeGuideCircles()
          const axes = makeAxes()
          const vectorTrace = { type: 'scatter3d', mode: 'lines+markers', x: v.x, y: v.y, z: v.z, line: { color: 'orange', width: 8 }, marker: { size: 7, color: 'orange', symbol: 'triangle-right' }, hoverinfo: 'none' }
          Plotly.react(plotRef.current, [sphere, ...guides, ...axes, vectorTrace], (plotRef.current as any).layout)
        }
        const thetaEl = document.getElementById('thetaVal')
        const phiEl = document.getElementById('phiVal')
        if (thetaEl) thetaEl.innerText = String(radToDeg(t))
        if (phiEl) phiEl.innerText = String(radToDeg(p))
      }
    })
  }

  const rotateVector = (v: any, axis: 'X' | 'Y' | 'Z', angle: number) => {
    const [x, y, z] = [v.x[1], v.y[1], v.z[1]]
    let newX = x, newY = y, newZ = z
    const c = Math.cos(angle), s = Math.sin(angle)
    if (axis === 'X') { newY = y * c - z * s; newZ = y * s + z * c }
    else if (axis === 'Y') { newX = x * c + z * s; newZ = -x * s + z * c }
    else if (axis === 'Z') { newX = x * c - y * s; newY = x * s + y * c }
    return { x: [0, newX], y: [0, newY], z: [0, newZ] }
  }

  const applyGate = (gate: string) => {
    let angle = Math.PI / 4
    if (!vectorRef.current) vectorRef.current = setQubitVector(theta, phi)
    if (gate === 'X') vectorRef.current = rotateVector(vectorRef.current, 'X', Math.PI)
    else if (gate === 'Rx') vectorRef.current = rotateVector(vectorRef.current, 'X', angle)
    else if (gate === 'Ry') vectorRef.current = rotateVector(vectorRef.current, 'Y', angle)
    else if (gate === 'Rz') vectorRef.current = rotateVector(vectorRef.current, 'Z', angle)

    const x = vectorRef.current.x[1], y = vectorRef.current.y[1], z = vectorRef.current.z[1]
    const newTheta = Math.acos(z)
    let newPhi = Math.atan2(y, x); if (newPhi < 0) newPhi += 2 * Math.PI
    setTheta(newTheta)
    setPhi(newPhi)
    updatePlotVector(newTheta, newPhi)
    const thetaSlider = document.getElementById('thetaSlider') as HTMLInputElement | null
    const phiSlider = document.getElementById('phiSlider') as HTMLInputElement | null
    if (thetaSlider) thetaSlider.value = String(newTheta)
    if (phiSlider) phiSlider.value = String(newPhi)
  }

  // sync slider-driven updates
  useEffect(() => { updatePlotVector(theta, phi) }, [theta, phi])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: 320, minWidth: 260, margin: '12px', borderRadius: 12, padding: 16, background: 'linear-gradient(180deg,#0044aa,#002b6b)', color: 'white', overflow: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: 0, marginBottom: 12 }}>Controls</h3>
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: '700', marginRight: 10 }}>θ (theta):</span><span id="thetaVal">{radToDeg(theta)}</span>°</div>
          <input id="thetaSlider" value={theta} type="range" min={0} max={3.14159} step={0.01}
            onInput={(e) => setTheta(parseFloat((e.target as HTMLInputElement).value))}
            style={{ width: '85%', height: 8, WebkitAppearance: 'none', background: '#cce0ff', borderRadius: 4 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: '700', marginRight: 10 }}>φ (phi):</span><span id="phiVal">{radToDeg(phi)}</span>°</div>
          <input id="phiSlider" value={phi} type="range" min={0} max={6.2832} step={0.01}
            onInput={(e) => setPhi(parseFloat((e.target as HTMLInputElement).value))}
            style={{ width: '85%', height: 8, WebkitAppearance: 'none', background: '#cce0ff', borderRadius: 4 }} />
        </div>
        <div id="gates" style={{ textAlign: 'center', paddingTop: 8 }}>
          <button onClick={() => applyGate('X')} style={{ margin: 5, padding: '6px 12px', borderRadius: 6 }}>X</button>
          <button onClick={() => applyGate('Rx')} style={{ margin: 5, padding: '6px 12px', borderRadius: 6 }}>Rx(π/4)</button>
          <button onClick={() => applyGate('Ry')} style={{ margin: 5, padding: '6px 12px', borderRadius: 6 }}>Ry(π/4)</button>
          <button onClick={() => applyGate('Rz')} style={{ margin: 5, padding: '6px 12px', borderRadius: 6 }}>Rz(π/4)</button>
        </div>
      </div>

      <div style={{ flex: 1, paddingTop: 40, paddingRight: 12, paddingLeft: 8, boxSizing: 'border-box' }}>
        <div ref={plotRef} id="bloch" style={{ width: '100%', height: '100%' , minHeight: 480}} />
      </div>
    </div>
  )
}

export default BlochSpherePage
