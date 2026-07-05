/**
 * WebGPU fluid distortion post-processing for the r3f-webgpu-text demo.
 * @author Anderson Mancini
 */

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { RenderPipeline, StorageTexture } from 'three/webgpu'
import {
  Fn,
  vec2,
  vec4,
  uniform,
  instanceIndex,
  uvec2,
  textureStore,
  textureLoad,
  texture,
  screenUV,
  clamp,
  exp,
  length,
  pass,
} from 'three/tsl'

const SIM_SIZE = 256
const SIM_COUNT = SIM_SIZE * SIM_SIZE
const DISSIPATION = 0.985
const DYE_DISSIPATION = 0.992
const ADVECT_STRENGTH = 0.35

function createSimTexture() {
  const tex = new StorageTexture(SIM_SIZE, SIM_SIZE)
  tex.type = THREE.HalfFloatType
  tex.format = THREE.RGBAFormat
  return tex
}

export function FluidFX() {
  const { gl, scene, camera } = useThree()
  const pipelineRef = useRef(null)
  const computeRef = useRef(null)
  const texturesRef = useRef(null)
  const mouseRef = useRef({
    x: 0.5,
    y: 0.5,
    px: 0.5,
    py: 0.5,
    vx: 0,
    vy: 0,
  })

  useEffect(() => {
    const canvas = gl.domElement

    const onMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const mouse = mouseRef.current

      mouse.vx = (x - mouse.px) * 18
      mouse.vy = (y - mouse.py) * 18
      mouse.px = x
      mouse.py = y
      mouse.x = x
      mouse.y = y
    }

    const onLeave = () => {
      mouseRef.current.vx = 0
      mouseRef.current.vy = 0
    }

    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [gl])

  useLayoutEffect(() => {
    const velocityA = createSimTexture()
    const velocityB = createSimTexture()
    const dyeA = createSimTexture()
    const dyeB = createSimTexture()

    texturesRef.current = { velocityA, velocityB, dyeA, dyeB }

    const simRes = uniform(vec2(SIM_SIZE, SIM_SIZE))
    const mouseUV = uniform(vec2(0.5, 0.5))
    const mouseVel = uniform(vec2(0, 0))
    const splatRadius = uniform(0.045)
    const splatForce = uniform(2.5)
    const distortionStrength = uniform(0.022)
    const chromaticAberration = uniform(0.0035)

    const splatPass = Fn(({ velRead, velWrite, dyeRead, dyeWrite }) => {
      const width = simRes.x
      const height = simRes.y
      const posX = instanceIndex.mod(width)
      const posY = instanceIndex.div(width)
      const coord = uvec2(posX, posY)
      const uv = vec2(posX, posY).add(0.5).div(vec2(width, height))

      const vel = textureLoad(velRead, coord)
      const dye = textureLoad(dyeRead, coord)

      const delta = uv.sub(mouseUV)
      const dist = length(delta)
      const falloff = exp(dist.mul(dist).mul(-1).div(splatRadius.mul(splatRadius)))
      const splat = mouseVel.mul(falloff).mul(splatForce)

      textureStore(velWrite, coord, vel.add(vec4(splat, 0, 0))).toWriteOnly()
      textureStore(dyeWrite, coord, dye.add(vec4(splat.mul(0.65), 0, 0))).toWriteOnly()
    })

    const advectVelocityPass = Fn(({ velRead, velWrite }) => {
      const width = simRes.x
      const height = simRes.y
      const posX = instanceIndex.mod(width)
      const posY = instanceIndex.div(width)
      const coord = uvec2(posX, posY)
      const uv = vec2(posX, posY).add(0.5).div(vec2(width, height))

      const vel = textureLoad(velRead, coord)
      const backUV = clamp(uv.sub(vel.xy.mul(ADVECT_STRENGTH)), vec2(0.001), vec2(0.999))
      const advected = texture(velRead, backUV)

      textureStore(velWrite, coord, advected).toWriteOnly()
    })

    const decayPass = Fn(({ velRead, velWrite }) => {
      const width = simRes.x
      const posX = instanceIndex.mod(width)
      const posY = instanceIndex.div(width)
      const coord = uvec2(posX, posY)

      const vel = textureLoad(velRead, coord)
      textureStore(velWrite, coord, vel.mul(DISSIPATION)).toWriteOnly()
    })

    const advectDyePass = Fn(({ dyeRead, dyeWrite, velRead }) => {
      const width = simRes.x
      const height = simRes.y
      const posX = instanceIndex.mod(width)
      const posY = instanceIndex.div(width)
      const coord = uvec2(posX, posY)
      const uv = vec2(posX, posY).add(0.5).div(vec2(width, height))

      const vel = textureLoad(velRead, coord)
      const backUV = clamp(uv.sub(vel.xy.mul(ADVECT_STRENGTH)), vec2(0.001), vec2(0.999))
      const advected = texture(dyeRead, backUV)

      textureStore(dyeWrite, coord, advected.mul(DYE_DISSIPATION)).toWriteOnly()
    })

    computeRef.current = {
      splat: splatPass({
        velRead: velocityA,
        velWrite: velocityB,
        dyeRead: dyeA,
        dyeWrite: dyeB,
      }).compute(SIM_COUNT),
      advectVelocity: advectVelocityPass({
        velRead: velocityB,
        velWrite: velocityA,
      }).compute(SIM_COUNT),
      decay: decayPass({
        velRead: velocityA,
        velWrite: velocityB,
      }).compute(SIM_COUNT),
      advectDye: advectDyePass({
        dyeRead: dyeB,
        dyeWrite: dyeA,
        velRead: velocityB,
      }).compute(SIM_COUNT),
      uniforms: { mouseUV, mouseVel, distortionStrength, chromaticAberration },
    }

    const scenePass = pass(scene, camera)
    const sceneColor = scenePass.getTextureNode('output')
    const dyeField = texture(dyeA, screenUV)
    const offset = dyeField.rg.mul(distortionStrength)
    const distortedUV = screenUV.add(offset)
    const ca = chromaticAberration.mul(clamp(length(offset).mul(120), 0, 1))

    const r = sceneColor.sample(distortedUV.add(vec2(ca, 0))).r
    const g = sceneColor.sample(distortedUV).g
    const b = sceneColor.sample(distortedUV.sub(vec2(ca, 0))).b
    const a = sceneColor.sample(distortedUV).a

    const pipeline = new RenderPipeline(gl)
    pipeline.outputNode = vec4(r, g, b, a)
    pipelineRef.current = pipeline

    return () => {
      pipelineRef.current = null
      computeRef.current = null
      velocityA.dispose()
      velocityB.dispose()
      dyeA.dispose()
      dyeB.dispose()
      texturesRef.current = null
    }
  }, [gl, scene, camera])

  useFrame(() => {
    const compute = computeRef.current
    const pipeline = pipelineRef.current
    if (!compute || !pipeline) return

    const mouse = mouseRef.current
    mouse.vx *= 0.9
    mouse.vy *= 0.9

    compute.uniforms.mouseUV.value.set(mouse.x, mouse.y)
    compute.uniforms.mouseVel.value.set(mouse.vx, mouse.vy)

    gl.compute(compute.splat)
    gl.compute(compute.advectVelocity)
    gl.compute(compute.decay)
    gl.compute(compute.advectDye)

    pipeline.render()
  }, 1)

  return null
}
