import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setActivePanel } from '../../store/slices/uiSlice'

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

  // Use: X axis = red, Y axis = green, Z axis = blue per user preference
  return [
    ...axis(-1.3, 1.3, 'red', '|+⟩', 1.4, 0, 0),
    ...axis(-1.3, 1.3, 'red', '|−⟩', -1.4, 0, 0),
    ...yaxis(-1.3, 1.3, 'green', '|+i⟩', 0, 1.4, 0),
    ...yaxis(-1.3, 1.3, 'green', '|−i⟩', 0, -1.4, 0),
    ...zaxis(-1.3, 1.3, 'blue', '|0⟩', 0, 0, 1.4),
    ...zaxis(-1, 1.3, 'blue', '|1⟩', 0, 0, -1.4)
  ]
}

const BlochSpherePage: React.FC = () => {
  const plotRef = useRef<HTMLDivElement | null>(null)
  const dispatch = useDispatch()
  const [theta, setTheta] = useState(0)
  const [phi, setPhi] = useState(0)
  const vectorRef = useRef<any>(setQubitVector(0, 0))
  // Gate input states (degrees)
  // keep inputs as strings so users can type (empty placeholder visible)
  const [rxInput, setRxInput] = useState<string>('')
  const [ryInput, setRyInput] = useState<string>('')
  const [rzInput, setRzInput] = useState<string>('')
  
  const [activeGate, setActiveGate] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [helpTagVisible, setHelpTagVisible] = useState(true)

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
          Plotly.update(plotRef.current, { x: [v.x], y: [v.y], z: [v.z] }, {}, [ ((plotRef.current as any).data ? (plotRef.current as any).data.length - 1 : -1) ])
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
  const applyGate = (gate: string, angleRad?: number) => {
    if (!vectorRef.current) vectorRef.current = setQubitVector(theta, phi)
    const a = typeof angleRad === 'number' ? angleRad : Math.PI / 4
    if (gate === 'X') vectorRef.current = rotateVector(vectorRef.current, 'X', Math.PI)
    else if (gate === 'Rx') vectorRef.current = rotateVector(vectorRef.current, 'X', a)
    else if (gate === 'Ry') vectorRef.current = rotateVector(vectorRef.current, 'Y', a)
    else if (gate === 'Rz') vectorRef.current = rotateVector(vectorRef.current, 'Z', a)
    else if (gate === 'Y') vectorRef.current = rotateVector(vectorRef.current, 'Y', Math.PI)
    else if (gate === 'Z') vectorRef.current = rotateVector(vectorRef.current, 'Z', Math.PI)
    else if (gate === 'H') {
      // Hadamard on Bloch sphere: apply Ry(pi/2) then X (π around X)
      vectorRef.current = rotateVector(vectorRef.current, 'Y', Math.PI / 2)
      vectorRef.current = rotateVector(vectorRef.current, 'X', Math.PI)
    }

    const x = vectorRef.current.x[1], y = vectorRef.current.y[1], z = vectorRef.current.z[1]
    const newTheta = Math.acos(Math.max(-1, Math.min(1, z)))
    let newPhi = Math.atan2(y, x); if (newPhi < 0) newPhi += 2 * Math.PI
    setTheta(newTheta)
    setPhi(newPhi)
    updatePlotVector(newTheta, newPhi)
    // set a human-readable message for the gate
    if (gate === 'X' || gate === 'H' || gate === 'Y' || gate === 'Z') {
      const msg = `${gate} gate applied to Qubit`
      setMessages(prev => ({ ...prev, [gate]: msg }))
    } else if (gate === 'Rx' || gate === 'Ry' || gate === 'Rz') {
      const usedA = a
      const deg = Math.round((usedA * 180) / Math.PI)
      const axis = gate === 'Rx' ? 'X' : gate === 'Ry' ? 'Y' : 'Z'
      const msg = `Qubit rotated ${deg}° around ${axis} axis`
      setMessages(prev => ({ ...prev, [gate]: msg }))
    }
  }

  // helper for slider gradient backgrounds (filled portion shows gradient)
  const sliderBackground = (value: number, min: number, max: number): React.CSSProperties => {
    const pct = Math.round(((value - min) / (max - min)) * 100)
    // gradient from baby blue to red; left filled uses gradient, right unfilled is pale
    return {
      width: '85%',
      height: 8,
      WebkitAppearance: 'none',
      borderRadius: 4,
      background: `linear-gradient(90deg, #FFEB3B 0%, #ff6b6b ${pct}%, #FFE082 ${pct}%, #FFE082 100%)`
    } as React.CSSProperties
  }

  // sync slider-driven updates
  useEffect(() => { updatePlotVector(theta, phi) }, [theta, phi])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <style>{`.deg-input{ background: white; color: #013a63; padding:4px 6px; border-radius:6px; border:none; } .deg-input::placeholder{ color: #9aaec0; } .gate-name{ font-style: italic; cursor: pointer; } .gate-btn{ display:inline-block; padding:6px 10px; border-radius:8px; background:#cfefff; color:#013a63; border:none; font-weight:700; cursor:pointer; font-style:italic; } .apply-btn{ font-weight:700; background:#bfe9ff; color:#013a63; border:none; }`}</style>
      <div style={{ width: 320, minWidth: 260, margin: '12px', borderRadius: 12, padding: 8, overflow: 'auto' }}>
        {/* Page title above controls */}
        <div style={{ marginBottom: 12 }}><h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>The Bloch Sphere</h1></div>
        {/* Controls label outside box, orange h3 */}
        <div style={{ marginBottom: 12 }}><h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ff8c00' }}>Controls</h3></div>
        <div style={{ marginTop: 16, borderRadius: 12, padding: 12, background: 'linear-gradient(180deg,#ffb74d,#ff8f00)', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginBottom: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 8 }}><span style={{ fontWeight: '700', marginRight: 10 }}>θ (theta):</span><span id="thetaVal">{radToDeg(theta)}</span>°</div>
            <input id="thetaSlider" value={theta} type="range" min={0} max={3.14159} step={0.01}
              onInput={(e) => setTheta(parseFloat((e.target as HTMLInputElement).value))}
              style={sliderBackground(theta, 0, Math.PI)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 8 }}><span style={{ fontWeight: '700', marginRight: 10 }}>φ (phi):</span><span id="phiVal">{radToDeg(phi)}</span>°</div>
            <input id="phiSlider" value={phi} type="range" min={0} max={6.2832} step={0.01}
              onInput={(e) => setPhi(parseFloat((e.target as HTMLInputElement).value))}
              style={sliderBackground(phi, 0, Math.PI * 2)} />
          </div>
        </div>
        

        {/* spaced area between controls and gates */}
        <div style={{ height: 20 }} />

        {/* Gates box label outside, royal blue h3 */}
        <div style={{ marginTop: 6 }}><h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#4169E1' }}>Gates</h3></div>
        <div style={{ marginTop: 16, borderRadius: 12, padding: 12, background: 'linear-gradient(180deg,#4169E1,#27408B)', color: 'white', boxShadow: '0 8px 18px rgba(0,0,0,0.12)' }}>
          {/* Order: X, Y, Z, H, Rx, Ry, Rz */}

          {/* X */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="gate-btn" onClick={() => setActiveGate(activeGate === 'X' ? null : 'X')}>X</button>
            <div>
              {activeGate === 'X' && (
                <>
                  <button className="apply-btn" onClick={() => { applyGate('X'); setActiveGate(null); }} style={{ padding: '6px 10px', borderRadius: 6 }}>Apply</button>
                </>
              )}
              {messages['X'] && <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{messages['X']}</div>}
            </div>
          </div>

          {/* Y */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="gate-btn" onClick={() => setActiveGate(activeGate === 'Y' ? null : 'Y')}>Y</button>
            <div>
              {activeGate === 'Y' && (
                <>
                  <button className="apply-btn" onClick={() => { applyGate('Y'); setActiveGate(null); }} style={{ padding: '6px 10px', borderRadius: 6 }}>Apply</button>
                </>
              )}
              {messages['Y'] && <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{messages['Y']}</div>}
            </div>
          </div>

          {/* Z */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="gate-btn" onClick={() => setActiveGate(activeGate === 'Z' ? null : 'Z')}>Z</button>
            <div>
              {activeGate === 'Z' && (
                <>
                  <button className="apply-btn" onClick={() => { applyGate('Z'); setActiveGate(null); }} style={{ padding: '6px 10px', borderRadius: 6 }}>Apply</button>
                </>
              )}
              {messages['Z'] && <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{messages['Z']}</div>}
            </div>
          </div>

          {/* H */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="gate-btn" onClick={() => setActiveGate(activeGate === 'H' ? null : 'H')}>H</button>
            <div>
              {activeGate === 'H' && (
                <button className="apply-btn" onClick={() => { applyGate('H'); setActiveGate(null); }} style={{ padding: '6px 10px', borderRadius: 6 }}>Apply</button>
              )}
              {messages['H'] && <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{messages['H']}</div>}
            </div>
          </div>

          {/* Rx */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="gate-btn" onClick={() => setActiveGate(activeGate === 'Rx' ? null : 'Rx')} style={{ background: '#ffd6d6', color: '#7a1212' }}>R<sub>x</sub></button>
            <div>
              {activeGate === 'Rx' && (
                <>
                  <input className="deg-input" placeholder="45°" type="text" value={rxInput} onChange={(e) => setRxInput((e.target as HTMLInputElement).value)} style={{ width: 80, marginRight: 8 }} />
                  <button className="apply-btn" onClick={() => { const deg = parseFloat(rxInput as any); if (isNaN(deg)) applyGate('Rx'); else applyGate('Rx', (deg * Math.PI) / 180); setActiveGate(null); }} style={{ padding: '6px 10px', borderRadius: 6 }}>Apply</button>
                </>
              )}
              {messages['Rx'] && <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{messages['Rx']}</div>}
            </div>
          </div>

          {/* Ry */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="gate-btn" onClick={() => setActiveGate(activeGate === 'Ry' ? null : 'Ry')} style={{ background: '#d8f7d8', color: '#0b5d14' }}>R<sub>y</sub></button>
            <div>
              {activeGate === 'Ry' && (
                <>
                  <input className="deg-input" placeholder="45°" type="text" value={ryInput} onChange={(e) => setRyInput((e.target as HTMLInputElement).value)} style={{ width: 80, marginRight: 8 }} />
                  <button className="apply-btn" onClick={() => { const deg = parseFloat(ryInput as any); if (isNaN(deg)) applyGate('Ry'); else applyGate('Ry', (deg * Math.PI) / 180); setActiveGate(null); }} style={{ padding: '6px 10px', borderRadius: 6 }}>Apply</button>
                </>
              )}
              {messages['Ry'] && <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{messages['Ry']}</div>}
            </div>
          </div>

          {/* Rz */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="gate-btn" onClick={() => setActiveGate(activeGate === 'Rz' ? null : 'Rz')} style={{ background: '#dbe9ff', color: '#0b2f66' }}>R<sub>z</sub></button>
            <div>
              {activeGate === 'Rz' && (
                <>
                  <input className="deg-input" placeholder="45°" type="text" value={rzInput} onChange={(e) => setRzInput((e.target as HTMLInputElement).value)} style={{ width: 80, marginRight: 8 }} />
                  <button className="apply-btn" onClick={() => { const deg = parseFloat(rzInput as any); if (isNaN(deg)) applyGate('Rz'); else applyGate('Rz', (deg * Math.PI) / 180); setActiveGate(null); }} style={{ padding: '6px 10px', borderRadius: 6 }}>Apply</button>
                </>
              )}
              {messages['Rz'] && <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{messages['Rz']}</div>}
            </div>
          </div>
        </div>
        {/* Help card: opens Library -> Bloch Sphere Representation (placed after Controls and Gates) */}
        <div
          onClick={() => {
            dispatch(setActivePanel('library'))
            window.dispatchEvent(new CustomEvent('openLibraryTopic', { detail: { topicId: 'bloch-sphere' } }))
            // hide the tag text after click
            setHelpTagVisible(false)
          }}
          role="button"
          tabIndex={0}
          style={{ marginTop: 12, borderRadius: 12, padding: 12, background: 'linear-gradient(90deg,#ffffff,#f0f9ff)', color: '#013a63', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
            How are Quantum Bits represented on the Bloch Sphere?
            {helpTagVisible && (
              <span style={{ marginLeft: 6, color: '#ff4d4f' }}>Read Here.</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, paddingTop: 40, paddingRight: 12, paddingLeft: 8, boxSizing: 'border-box' }}>
        <div ref={plotRef} id="bloch" style={{ width: '100%', height: '100%' , minHeight: 480}} />
      </div>
    </div>
  )
}

export default BlochSpherePage
