/**
 * Character-level instanced MSDF text renderer for large label counts.
 * @author Anderson Mancini
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { MSDFTextGeometry } from 'three-msdf-text-utils'
import { MSDFTextNodeMaterial } from 'three-msdf-text-utils/webgpu'
import {
  DEFAULT_FONT_ATLAS,
  DEFAULT_FONT_DATA,
  loadFontCached,
} from './fontCache'
import { parseAnchor } from './parseAnchor'

const dummy = new THREE.Object3D()

function createTextMaterial(atlas, color) {
  const material = new MSDFTextNodeMaterial({
    map: atlas,
    color,
    opacity: 1,
    transparent: true,
  })
  material.side = THREE.DoubleSide
  return material
}

/**
 * Character-level instanced text renderer.
 * Reuses one InstancedMesh per unique character for maximum batching.
 */
export function WebGPUInstancedText({
  texts = [],
  fontAtlas = DEFAULT_FONT_ATLAS,
  fontData = DEFAULT_FONT_DATA,
  defaultFontSize = 0.02,
  defaultColor = '#ffffff',
  lookAtCamera = false,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?:;-_()[]{}',
  ...props
}) {
  const groupRef = useRef()
  const characterMeshesRef = useRef(new Map())

  useEffect(() => {
    if (!groupRef.current || texts.length === 0) return

    const group = groupRef.current
    let mounted = true

    const clearMeshes = () => {
      while (group.children.length > 0) {
        const child = group.children[0]
        group.remove(child)
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      }
    }

    clearMeshes()

    loadFontCached(fontData, fontAtlas)
      .then(({ font, atlas }) => {
        if (!mounted || !groupRef.current) return

        const charCounts = new Map()
        const instances = []

        texts.forEach((textConfig) => {
          const {
            text = '',
            position = [0, 0, 0],
            fontSize = defaultFontSize,
            color = defaultColor,
            anchorX = 'center',
            anchorY = 'middle',
          } = textConfig

          if (!text) return

          const chars = text.split('').filter((char) => charset.includes(char))
          if (chars.length === 0) return

          chars.forEach((char) => {
            charCounts.set(char, (charCounts.get(char) || 0) + 1)
          })

          instances.push({
            position,
            fontSize,
            color,
            anchorX,
            anchorY,
            chars,
          })
        })

        if (charCounts.size === 0) return

        const charMeshes = new Map()
        const fontInfoSize = font.info?.size ?? 42

        charCounts.forEach((count, char) => {
          const geometry = new MSDFTextGeometry({ text: char, font })
          geometry.computeBoundingBox()

          const bbox = geometry.boundingBox
          const minX = bbox?.min.x ?? 0
          const minY = bbox?.min.y ?? 0
          const maxY = bbox?.max.y ?? 0
          const width = bbox ? bbox.max.x - minX : 0.01
          const material = createTextMaterial(atlas, defaultColor)

          const instancedMesh = new THREE.InstancedMesh(geometry, material, count)
          instancedMesh.userData.char = char
          instancedMesh.userData.minX = minX
          instancedMesh.userData.minY = minY
          instancedMesh.userData.maxY = maxY
          instancedMesh.userData.width = width || 0.01
          instancedMesh.userData.currentInstance = 0

          charMeshes.set(char, instancedMesh)
        })

        const matrix = new THREE.Matrix4()
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()

        instances.forEach((instance) => {
          const { position: textPos, fontSize, anchorX, anchorY, chars } = instance
          const fontScale = fontSize / fontInfoSize

          let textWidth = 0
          let textMinY = Infinity
          let textMaxY = -Infinity

          chars.forEach((char) => {
            const charMesh = charMeshes.get(char)
            if (!charMesh) return
            textWidth += charMesh.userData.width * fontScale
            textMinY = Math.min(textMinY, charMesh.userData.minY)
            textMaxY = Math.max(textMaxY, charMesh.userData.maxY)
          })

          if (!Number.isFinite(textMinY)) textMinY = 0
          if (!Number.isFinite(textMaxY)) textMaxY = 0

          const anchorXVal = parseAnchor(anchorX, true)
          const anchorYVal = parseAnchor(anchorY, false)
          const anchorOffsetX = -(textWidth * anchorXVal)
          const anchorOffsetY =
            ((1 - anchorYVal) * textMaxY + anchorYVal * textMinY) * fontScale

          let xOffset = 0
          chars.forEach((char) => {
            const charMesh = charMeshes.get(char)
            if (!charMesh) return

            const { minX, width } = charMesh.userData
            const charWidth = width * fontScale
            const instanceIdx = charMesh.userData.currentInstance
            const localOffsetX = -(minX + width * 0.5) * fontScale

            position.set(
              textPos[0] + anchorOffsetX + xOffset + localOffsetX + charWidth / 2,
              textPos[1] + anchorOffsetY,
              textPos[2],
            )
            quaternion.setFromEuler(new THREE.Euler(Math.PI, 0, 0))
            scale.set(fontScale, fontScale, fontScale)
            matrix.compose(position, quaternion, scale)
            charMesh.setMatrixAt(instanceIdx, matrix)

            xOffset += charWidth
            charMesh.userData.currentInstance++
          })
        })

        charMeshes.forEach((mesh) => {
          mesh.instanceMatrix.needsUpdate = true
          group.add(mesh)
        })

        characterMeshesRef.current = charMeshes
      })
      .catch((err) => {
        console.error('WebGPUInstancedText font load failed:', err)
      })

    return () => {
      mounted = false
      characterMeshesRef.current = new Map()
      clearMeshes()
    }
  }, [texts, fontAtlas, fontData, defaultFontSize, defaultColor, charset])

  const { camera } = useThree()

  useFrame(() => {
    if (!lookAtCamera || characterMeshesRef.current.size === 0) return

    characterMeshesRef.current.forEach((charMesh) => {
      for (let i = 0; i < charMesh.count; i++) {
        charMesh.getMatrixAt(i, dummy.matrix)
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
        dummy.lookAt(camera.position)
        dummy.rotateX(Math.PI)
        dummy.updateMatrix()
        charMesh.setMatrixAt(i, dummy.matrix)
      }

      charMesh.instanceMatrix.needsUpdate = true
    })
  })

  return <group ref={groupRef} {...props} />
}

WebGPUInstancedText.displayName = 'WebGPUInstancedText'
