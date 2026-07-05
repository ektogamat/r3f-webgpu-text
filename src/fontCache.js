/**
 * Shared MSDF font loader with promise-based cache.
 * @author Anderson Mancini
 */

import * as THREE from 'three'

export const DEFAULT_FONT_DATA = '/fonts/Manrope-Medium-msdf.json'
export const DEFAULT_FONT_ATLAS = '/fonts/Manrope-Medium.png'

/** Shared cache for font+atlas to avoid duplicate fetches across text instances */
const fontCache = new Map()

export function loadFontCached(fontData, fontAtlas) {
  const key = `${fontData}|${fontAtlas}`
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      Promise.all([
        fetch(fontData).then((r) => {
          if (!r.ok) throw new Error(`Failed to load font data: ${fontData}`)
          return r.json()
        }),
        new Promise((resolve, reject) => {
          new THREE.TextureLoader().load(fontAtlas, resolve, undefined, reject)
        }),
      ]).then(([font, atlas]) => ({ font, atlas })),
    )
  }
  return fontCache.get(key)
}

export function clearFontCache() {
  fontCache.clear()
}
