import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { pass, vec2 } from 'three/tsl'
import { edgeChromaticAberration } from './EdgeChromaticAberrationNode.js'
import { useDemoSettings } from './DemoSettings'

function buildOutputNode(scenePass, preset) {
  const sceneColor = scenePass.getTextureNode('output')
  let color = sceneColor

  if (preset.chromaticAberration) {
    color = edgeChromaticAberration(
      color,
      preset.caStrength ?? 1.2,
      vec2(0.5, 0.5),
      preset.caScale ?? 1.15,
      preset.caEdgeInner ?? 0.52,
      preset.caEdgeOuter ?? 0.92
    )
  }

  return color
}

export function PostFX() {
  const { gl, scene, camera } = useThree()
  const { preset } = useDemoSettings()
  const pipelineRef = useRef(null)
  const scenePassRef = useRef(null)
  const readyRef = useRef(false)
  const insidePipelineRef = useRef(false)

  useLayoutEffect(() => {
    const scenePass = pass(scene, camera)
    const sceneColor = scenePass.getTextureNode('output')
    const pipeline = new THREE.RenderPipeline(gl, sceneColor)

    scenePassRef.current = scenePass
    pipelineRef.current = pipeline

    const originalRender = gl.__r3fNativeRender || gl.render.bind(gl)
    gl.__r3fNativeRender = originalRender

    gl.render = (object, renderCamera, ...rest) => {
      if (object?.isScene && !insidePipelineRef.current) return
      return originalRender(object, renderCamera, ...rest)
    }

    return () => {
      gl.render = originalRender
      pipeline.dispose()
      pipelineRef.current = null
      scenePassRef.current = null
      readyRef.current = false
      insidePipelineRef.current = false
    }
  }, [gl, scene, camera])

  useLayoutEffect(() => {
    const pipeline = pipelineRef.current
    const scenePass = scenePassRef.current
    if (!pipeline || !scenePass) return

    readyRef.current = false
    pipeline.outputNode = buildOutputNode(scenePass, preset)
    pipeline.outputColorTransform = true
    pipeline.needsUpdate = true

    let cancelled = false

    scenePass.compileAsync(gl).then(() => {
      if (!cancelled) readyRef.current = true
    })

    return () => {
      cancelled = true
      readyRef.current = false
    }
  }, [preset, gl])

  useFrame(() => {
    if (!readyRef.current) return

    const pipeline = pipelineRef.current
    if (!pipeline) return

    insidePipelineRef.current = true
    try {
      pipeline.render()
    } finally {
      insidePipelineRef.current = false
    }
  }, 1)

  return null
}
