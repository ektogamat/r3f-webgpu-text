/**
 * Anchor parsing helpers for WebGPUText layout.
 * @author Anderson Mancini
 */

/** Parse anchor value to 0-1 normalized offset */
export function parseAnchor(anchor, isX = true) {
  if (typeof anchor === 'number') return anchor
  if (typeof anchor === 'string' && anchor.includes('%')) {
    return parseFloat(anchor) / 100
  }

  const map = {
    left: 0,
    center: 0.5,
    right: 1,
    top: isX ? 0 : 1,
    middle: 0.5,
    bottom: isX ? 0 : 0,
    'top-baseline': isX ? 0 : 0.8,
    'bottom-baseline': isX ? 0 : 0.2,
  }

  return map[anchor] ?? 0.5
}
