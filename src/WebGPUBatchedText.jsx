/**
 * Batched MSDF text with InstancedMesh grouping for identical strings.
 * @author Anderson Mancini
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { MSDFTextGeometry } from 'three-msdf-text-utils'
import { MSDFTextNodeMaterial } from 'three-msdf-text-utils/webgpu'
import {
  DEFAULT_FONT_ATLAS,
  DEFAULT_FONT_DATA,
  loadFontCached,
} from './fontCache'
import { parseAnchor } from './parseAnchor'

/**
 * Renders multiple text labels with instancing for identical strings.
 *
 * Usage:
 * <WebGPUBatchedText
 *   texts={[
 *     { text: "Hello", position: [0, 0, 0], fontSize: 0.5 },
 *     { text: "Hello", position: [2, 0, 0], fontSize: 0.5 },
 *   ]}
 * />
 */
export function WebGPUBatchedText({
  texts = [],
  fontAtlas = DEFAULT_FONT_ATLAS,
  fontData = DEFAULT_FONT_DATA,
  defaultFontSize = 0.02,
  defaultColor = '#ffffff',
  ...props
}) {
  const groupRef = useRef()

  useEffect(() => {
    if (!groupRef.current || texts.length === 0) return

    const group = groupRef.current
    const disposables = []

    const clearMeshes = () => {
      while (group.children.length > 0) {
        const child = group.children[0]
        group.remove(child)
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      }
    }

    clearMeshes()

    let mounted = true

    loadFontCached(fontData, fontAtlas)
      .then(({ font, atlas }) => {
        if (!mounted || !groupRef.current) return

        const textGroups = new Map()

        texts.forEach((textConfig, index) => {
          const {
            text = '',
            fontSize = defaultFontSize,
            color = defaultColor,
            anchorX = 'center',
            anchorY = 'middle',
            textAlign = 'left',
            lineHeight = 1.1,
            letterSpacing = 0,
          } = textConfig

          const key = `${text}|${fontSize}|${color}|${anchorX}|${anchorY}|${textAlign}|${lineHeight}|${letterSpacing}`

          if (!textGroups.has(key)) {
            textGroups.set(key, {
              text,
              fontSize,
              color,
              anchorX,
              anchorY,
              textAlign,
              lineHeight,
              letterSpacing,
              instances: [],
            })
          }

          textGroups.get(key).instances.push({ ...textConfig, index })
        })

        textGroups.forEach((entry) => {
          const {
            text,
            fontSize,
            color,
            anchorX,
            anchorY,
            textAlign,
            lineHeight,
            letterSpacing,
            instances,
          } = entry

          if (!text || instances.length === 0) return

          const fontInfoSize = font.info?.size ?? 42
          const fontScale = fontSize / fontInfoSize
          const absoluteLineHeight = lineHeight * (font.common?.lineHeight ?? 71)
          const absoluteLetterSpacing = letterSpacing * fontInfoSize

          const geometry = new MSDFTextGeometry({
            text,
            font,
            align: textAlign,
            lineHeight: absoluteLineHeight,
            letterSpacing: absoluteLetterSpacing,
            mode: 'pre',
          })

          geometry.computeBoundingBox()
          const bbox = geometry.boundingBox
          const minX = bbox?.min.x ?? 0
          const minY = bbox?.min.y ?? 0
          const maxY = bbox?.max.y ?? 0
          const layoutWidth = bbox ? bbox.max.x - minX : 0

          const anchorXVal = parseAnchor(anchorX, true)
          const anchorYVal = parseAnchor(anchorY, false)
          const offsetX = -(minX + layoutWidth * anchorXVal) * fontScale
          const offsetY = ((1 - anchorYVal) * maxY + anchorYVal * minY) * fontScale

          const material = new MSDFTextNodeMaterial({
            map: atlas,
            color,
            opacity: 1,
            transparent: true,
          })

          material.side = THREE.DoubleSide
          disposables.push(geometry, material)

          if (instances.length > 1) {
            const instancedMesh = new THREE.InstancedMesh(geometry, material, instances.length)
            const matrix = new THREE.Matrix4()
            const position = new THREE.Vector3()
            const quaternion = new THREE.Quaternion()
            const scale = new THREE.Vector3()

            instances.forEach((instance, idx) => {
              const {
                position: pos = [0, 0, 0],
                rotation = [0, 0, 0],
                scale: scl = [1, 1, 1],
              } = instance

              position.set(pos[0] + offsetX, pos[1] + offsetY, pos[2])
              quaternion.setFromEuler(
                new THREE.Euler(rotation[0] + Math.PI, rotation[1], rotation[2]),
              )
              scale.set(fontScale * scl[0], fontScale * scl[1], fontScale * scl[2])
              matrix.compose(position, quaternion, scale)
              instancedMesh.setMatrixAt(idx, matrix)
            })

            instancedMesh.instanceMatrix.needsUpdate = true
            instancedMesh.userData.isTextMesh = true
            instancedMesh.userData.isBatched = true
            instancedMesh.userData.isInstanced = true
            group.add(instancedMesh)
          } else {
            const mesh = new THREE.Mesh(geometry, material)
            const {
              position: pos = [0, 0, 0],
              rotation = [0, 0, 0],
              scale: scl = [1, 1, 1],
            } = instances[0]

            mesh.position.set(pos[0] + offsetX, pos[1] + offsetY, pos[2])
            mesh.rotation.set(rotation[0] + Math.PI, rotation[1], rotation[2])
            mesh.scale.set(fontScale * scl[0], fontScale * scl[1], fontScale * scl[2])
            mesh.userData.isTextMesh = true
            mesh.userData.isBatched = true
            group.add(mesh)
          }
        })
      })
      .catch((err) => {
        console.error('WebGPUBatchedText font load failed:', err)
      })

    return () => {
      mounted = false
      clearMeshes()
    }
  }, [texts, fontAtlas, fontData, defaultFontSize, defaultColor])

  return <group ref={groupRef} {...props} />
}

WebGPUBatchedText.displayName = 'WebGPUBatchedText'
