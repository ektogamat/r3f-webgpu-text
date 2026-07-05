import { useEffect, useState } from 'react'
import { WebGPUCanvas } from './WebGPUCanvas'
import { Scene, DemoControls } from './Scene'

function WebGPUCheck({ children }) {
  const [supported, setSupported] = useState(null)

  useEffect(() => {
    if (!navigator.gpu) {
      setSupported(false)
      return
    }
    setSupported(true)
  }, [])

  if (supported === null) {
    return (
      <div style={overlayStyle}>
        <p>Checking WebGPU support...</p>
      </div>
    )
  }

  if (!supported) {
    return (
      <div style={overlayStyle}>
        <h1>WebGPU not available</h1>
        <p>This demo requires a browser with WebGPU enabled (Chrome 113+, Edge 113+, or Firefox Nightly).</p>
      </div>
    )
  }

  return children
}

function DemoCredits() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 10,
        maxWidth: 280,
        padding: '14px 18px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'right',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
        Interactive demo
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>r3f-webgpu-text</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.4 }}>
        MSDF WebGPU text for React Three Fiber
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 14,
          fontWeight: 500,
          color: '#ff8844',
        }}
      >
        Created by Anderson Mancini
      </div>
      <a
        href="https://www.npmjs.com/package/r3f-webgpu-text"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-block',
          marginTop: 10,
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
          textDecoration: 'none',
        }}
      >
        npmjs.com/package/r3f-webgpu-text
      </a>
      <a
        href="https://github.com/ektogamat/r3f-webgpu-text"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-block',
          marginTop: 6,
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
          textDecoration: 'none',
        }}
      >
        github.com/ektogamat/r3f-webgpu-text
      </a>
    </div>
  )
}

const overlayStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0a0f',
  color: '#fff',
  fontFamily: 'system-ui, sans-serif',
  padding: 24,
  textAlign: 'center',
}

export default function App() {
  const [demo, setDemo] = useState('basic')

  return (
    <WebGPUCheck>
      <DemoControls demo={demo} setDemo={setDemo} />
      <DemoCredits />
      <WebGPUCanvas>
        <Scene demo={demo} />
      </WebGPUCanvas>
    </WebGPUCheck>
  )
}
