/**
 * Single-label MSDF text for React Three Fiber + WebGPU.
 * @author Anderson Mancini
 */

import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as THREE from 'three'
import { MSDFTextGeometry } from 'three-msdf-text-utils'
import { MSDFTextNodeMaterial } from 'three-msdf-text-utils/webgpu'
import {
  DEFAULT_FONT_ATLAS,
  DEFAULT_FONT_DATA,
  loadFontCached,
} from './fontCache'
import { parseAnchor } from './parseAnchor'

const DEFAULT_FONT_SIZE = 42

function propsAreEqual(prev, next) {
  const skip = ['position', 'rotation', 'scale', 'onClick', 'onPointerOver', 'onPointerOut']
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  for (const key of keys) {
    if (skip.includes(key)) continue
    if (prev[key] !== next[key]) return false
  }
  return true
}

export const WebGPUText = memo(
  forwardRef(function WebGPUText(
    {
      children,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      fontSize = 1,
      color = '#ffffff',
      opacity = 1,
      anchorX = 'center',
      anchorY = 'middle',
      textAlign = 'center',
      lineHeight = 1.1,
      letterSpacing = 0,
      maxWidth,
      renderOrder = 0,
      side = THREE.FrontSide,
      scale: scaleProp,
      fontAtlas = DEFAULT_FONT_ATLAS,
      fontData = DEFAULT_FONT_DATA,
      userData,
      visible = true,
      onClick,
      onPointerOver,
      onPointerOut,
    },
    ref,
  ) {
    const groupRef = useRef(null)
    const [innerMesh, setInnerMesh] = useState(null)

    useImperativeHandle(ref, () => groupRef.current, [])

    useEffect(() => {
      let mounted = true
      let cleanup

      loadFontCached(fontData, fontAtlas).then(({ font: fontJson, atlas }) => {
        if (!mounted || !groupRef.current) return

        try {
          const fontScale = fontSize / (fontJson.info?.size ?? DEFAULT_FONT_SIZE)
          const absoluteLineHeight = lineHeight * (fontJson.common?.lineHeight ?? 71)
          const absoluteLetterSpacing = letterSpacing * (fontJson.info?.size ?? DEFAULT_FONT_SIZE)
          const absoluteMaxWidth = maxWidth != null ? maxWidth / fontScale : undefined

          const geometry = new MSDFTextGeometry({
            text: String(children ?? ''),
            font: fontJson,
            align: textAlign,
            lineHeight: absoluteLineHeight,
            letterSpacing: absoluteLetterSpacing,
            width: absoluteMaxWidth,
            mode: maxWidth ? 'normal' : 'pre',
          })

          const material = new MSDFTextNodeMaterial({
            map: atlas,
            color,
            opacity,
            transparent: true,
          })
          material.side = side

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

          const newMesh = new THREE.Mesh(geometry, material)
          newMesh.position.set(offsetX, offsetY, 0)
          newMesh.rotation.set(rotation[0], rotation[1], rotation[2])
          newMesh.scale.setScalar(fontScale)

          if (scaleProp !== undefined) {
            if (typeof scaleProp === 'number') {
              newMesh.scale.multiplyScalar(scaleProp)
            } else {
              newMesh.scale.x *= scaleProp[0]
              newMesh.scale.y *= scaleProp[1]
              newMesh.scale.z *= scaleProp[2]
            }
          }

          newMesh.renderOrder = renderOrder
          newMesh.visible = visible
          if (userData) newMesh.userData = userData

          newMesh.rotation.x += Math.PI

          groupRef.current.add(newMesh)
          setInnerMesh(newMesh)

          cleanup = () => {
            if (groupRef.current && newMesh.parent) {
              groupRef.current.remove(newMesh)
            }
            geometry.dispose()
            material.dispose()
          }
        } catch (err) {
          console.error('WebGPUText failed to create:', err)
        }
      })

      return () => {
        mounted = false
        cleanup?.()
        setInnerMesh(null)
      }
    }, [
      children,
      fontAtlas,
      fontData,
      fontSize,
      color,
      opacity,
      anchorX,
      anchorY,
      textAlign,
      lineHeight,
      letterSpacing,
      maxWidth,
      renderOrder,
      side,
      visible,
    ])

    useEffect(() => {
      if (!innerMesh) return
      innerMesh.visible = visible ?? true
      innerMesh.renderOrder = renderOrder ?? 0
      innerMesh.material.side = side
      innerMesh.rotation.set(
        (rotation?.[0] ?? 0) + Math.PI,
        rotation?.[1] ?? 0,
        rotation?.[2] ?? 0,
      )
      if (userData) innerMesh.userData = { ...userData }
    }, [innerMesh, visible, renderOrder, side, rotation?.[0], rotation?.[1], rotation?.[2], userData])

    return (
      <group
        ref={groupRef}
        position={position}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        visible={visible}
      />
    )
  }),
  propsAreEqual,
)

WebGPUText.displayName = 'WebGPUText'
