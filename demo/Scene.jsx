/**
 * Demo scenes for r3f-webgpu-text components.
 * @author Anderson Mancini
 */

import { useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import {
  WebGPUText,
  WebGPUBatchedText,
  WebGPUInstancedText,
} from 'r3f-webgpu-text'

const FONT_DATA = '/fonts/Manrope-Medium-msdf.json'
const FONT_ATLAS = '/fonts/Manrope-Medium.png'

function BasicTextDemo() {
  return (
    <group>
      <WebGPUText
        position={[0, 2.55, 0]}
        fontSize={0.045}
        color="#ff8844"
        anchorX="center"
        anchorY="middle"
        fontData={FONT_DATA}
        fontAtlas={FONT_ATLAS}
      >
        Created by Anderson Mancini
      </WebGPUText>

      <WebGPUText
        position={[0, 2.2, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontData={FONT_DATA}
        fontAtlas={FONT_ATLAS}
      >
        WebGPUText
      </WebGPUText>

      <WebGPUText
        position={[-2.5, 1.2, 0]}
        fontSize={0.05}
        color="#ff6600"
        anchorX="left"
        anchorY="middle"
        fontData={FONT_DATA}
        fontAtlas={FONT_ATLAS}
      >
        Left anchor
      </WebGPUText>

      <WebGPUText
        position={[2.5, 1.2, 0]}
        fontSize={0.05}
        color="#66ccff"
        anchorX="right"
        anchorY="middle"
        textAlign="right"
        fontData={FONT_DATA}
        fontAtlas={FONT_ATLAS}
      >
        Right anchor
      </WebGPUText>

      <WebGPUText
        position={[0, 0.4, 0]}
        fontSize={0.035}
        color="#cccccc"
        maxWidth={3}
        textAlign="center"
        lineHeight={1.2}
        fontData={FONT_DATA}
        fontAtlas={FONT_ATLAS}
      >
        Multi-line wrapped text with maxWidth for WebGPU MSDF rendering in React Three Fiber.
      </WebGPUText>
    </group>
  )
}

function BatchedTextDemo() {
  const texts = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        text: i % 3 === 0 ? 'BATCH' : `Label ${i}`,
        position: [
          Math.cos((i / 12) * Math.PI * 2) * 2.5,
          0.2,
          Math.sin((i / 12) * Math.PI * 2) * 2.5,
        ],
        fontSize: 0.04,
        color: i % 3 === 0 ? '#00ff88' : '#ffffff',
        anchorX: 'center',
        anchorY: 'middle',
      })),
    [],
  )

  return (
    <WebGPUBatchedText
      texts={texts}
      fontData={FONT_DATA}
      fontAtlas={FONT_ATLAS}
    />
  )
}

function InstancedTextDemo() {
  const texts = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => {
        const angle = (i / 80) * Math.PI * 2
        const radius = 1.5 + (i % 5) * 0.4
        return {
          text: `T${i % 10}`,
          position: [
            Math.cos(angle) * radius,
            0.4 + (i % 8) * 0.15,
            Math.sin(angle) * radius,
          ],
          fontSize: 0.05,
          anchorX: 'center',
          anchorY: 'middle',
        }
      }),
    [],
  )

  return (
    <WebGPUInstancedText
      texts={texts}
      lookAtCamera
      fontData={FONT_DATA}
      fontAtlas={FONT_ATLAS}
    />
  )
}

export function Scene({ demo = 'basic' }) {
  return (
    <>
      <color attach="background" args={['#0a0a0f']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#151520" />
      </mesh>

      {demo !== 'basic' && (
        <WebGPUText
          position={[0, 2.6, 0]}
          fontSize={0.04}
          color="#ff8844"
          anchorX="center"
          anchorY="middle"
          fontData={FONT_DATA}
          fontAtlas={FONT_ATLAS}
        >
          Created by Anderson Mancini
        </WebGPUText>
      )}

      {demo === 'basic' && <BasicTextDemo />}
      {demo === 'batched' && <BatchedTextDemo />}
      {demo === 'instanced' && <InstancedTextDemo />}

      <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2} />
    </>
  )
}

export function DemoControls({ demo, setDemo }) {
  const options = [
    { id: 'basic', label: 'WebGPUText' },
    { id: 'batched', label: 'WebGPUBatchedText' },
    { id: 'instanced', label: 'WebGPUInstancedText' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setDemo(id)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: demo === id ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
