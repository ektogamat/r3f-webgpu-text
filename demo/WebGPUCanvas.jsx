/**
 * WebGPU canvas setup for the r3f-webgpu-text demo.
 * @author Anderson Mancini
 */

import * as THREE from 'three/webgpu'
import { Canvas, extend } from '@react-three/fiber'

extend(THREE)

export function WebGPUCanvas({ children }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...props,
          antialias: false,
          powerPreference: 'high-performance',
        })
        await renderer.init()
        renderer.__r3fNativeRender = renderer.render.bind(renderer)
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.0
        return renderer
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </Canvas>
  )
}
