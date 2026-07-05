/**
 * Demo scenes for r3f-webgpu-text components.
 * @author Anderson Mancini
 */

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { Environment, OrbitControls } from '@react-three/drei'
import {
  WebGPUText,
  WebGPUBatchedText,
  WebGPUInstancedText,
} from 'r3f-webgpu-text'

const FONT_DATA = '/fonts/Manrope-Medium-msdf.json'
const FONT_ATLAS = '/fonts/Manrope-Medium.png'

function BasicFluidDemo({ text }) {
  return (
    <>
      <WebGPUText
        position={[0, 0.08, 0]}
        fontSize={0.55}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.02}
        side={THREE.DoubleSide}
        fontData={FONT_DATA}
        fontAtlas={FONT_ATLAS}
      >
        {text}
      </WebGPUText>

      <WebGPUText
        position={[0, -0.40, 0]}
        fontSize={0.07}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        side={THREE.DoubleSide}
        fontData={FONT_DATA}
        fontAtlas={FONT_ATLAS}
      >
        MSDF WebGPU Text for React Three Fiber - Created by Anderson Mancini
      </WebGPUText>
    </>
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

export function Scene({ demo = 'basic', basicText }) {
  const isBasic = demo === 'basic'

  return (
    <>
      <color attach="background" args={[isBasic ? '#050508' : '#0a0a0f']} />
      <Environment
        preset="forest"
        background={isBasic}
        backgroundIntensity={0.1}
        environmentIntensity={isBasic ? 0.15 : 0.85}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={isBasic ? 2.5 : 3}
        maxDistance={isBasic ? 12 : 18}
        maxPolarAngle={isBasic ? Math.PI : Math.PI / 2}
        target={[0, isBasic ? 0 : 0.5, 0]}
      />

      {demo === 'basic' && <BasicFluidDemo text={basicText} />}
      {demo === 'batched' && <BatchedTextDemo />}
      {demo === 'instanced' && <InstancedTextDemo />}
    </>
  )
}

export function DemoModeControls({ demo, setDemo }) {
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
        right: 16,
        zIndex: 10,
        display: 'flex',
        flexWrap: 'wrap',
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
            border: demo === id ? '1px solid rgba(255,136,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
            background: demo === id ? 'rgba(255,136,68,0.15)' : 'rgba(0,0,0,0.45)',
            color: demo === id ? '#ff8844' : '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: demo === id ? 600 : 400,
            backdropFilter: 'blur(8px)',
          }}
        >
          {label}
        </button>
      ))}
    </div>)
}
