/**
 * r3f-webgpu-text — TypeScript definitions
 * @author Anderson Mancini
 */

import type { ReactNode, Ref } from 'react'
import type { Group } from 'three'

export type AnchorX = 'left' | 'center' | 'right' | number
export type AnchorY =
  | 'top'
  | 'middle'
  | 'bottom'
  | 'top-baseline'
  | 'bottom-baseline'
  | number
export type TextAlign = 'left' | 'center' | 'right'

export interface WebGPUTextProps {
  children: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  fontSize?: number
  color?: string
  opacity?: number
  anchorX?: AnchorX
  anchorY?: AnchorY
  textAlign?: TextAlign
  lineHeight?: number
  letterSpacing?: number
  maxWidth?: number
  renderOrder?: number
  scale?: [number, number, number] | number
  fontAtlas?: string
  fontData?: string
  userData?: Record<string, unknown>
  visible?: boolean
  onClick?: (e: { stopPropagation: () => void }) => void
  onPointerOver?: (e: { stopPropagation: () => void }) => void
  onPointerOut?: (e: { stopPropagation: () => void }) => void
}

export interface BatchedTextItem {
  text: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  fontSize?: number
  color?: string
  anchorX?: AnchorX
  anchorY?: AnchorY
  textAlign?: TextAlign
  lineHeight?: number
  letterSpacing?: number
}

export interface WebGPUBatchedTextProps {
  texts?: BatchedTextItem[]
  fontAtlas?: string
  fontData?: string
  defaultFontSize?: number
  defaultColor?: string
}

export interface InstancedTextItem {
  text: string
  position?: [number, number, number]
  fontSize?: number
  color?: string
  anchorX?: AnchorX
  anchorY?: AnchorY
}

export interface WebGPUInstancedTextProps {
  texts?: InstancedTextItem[]
  fontAtlas?: string
  fontData?: string
  defaultFontSize?: number
  defaultColor?: string
  lookAtCamera?: boolean
  charset?: string
}

export interface BMFontJSON {
  pages: string[]
  chars: Array<{
    id: number
    char: string
    width: number
    height: number
    xoffset: number
    yoffset: number
    xadvance: number
    x: number
    y: number
    page: number
  }>
  info: { size: number; face?: string }
  common: { lineHeight: number; base: number; scaleW: number; scaleH: number }
  distanceField?: { fieldType: string; distanceRange: number }
  kernings?: Array<{ first: number; second: number; amount: number }>
}

export declare const WebGPUText: React.ForwardRefExoticComponent<
  WebGPUTextProps & { ref?: Ref<Group> }
>

export declare function WebGPUBatchedText(
  props: WebGPUBatchedTextProps & Record<string, unknown>,
): ReactNode

export declare function WebGPUInstancedText(
  props: WebGPUInstancedTextProps & Record<string, unknown>,
): ReactNode

export declare function loadFontCached(
  fontData: string,
  fontAtlas: string,
): Promise<{ font: BMFontJSON; atlas: import('three').Texture }>

export declare function clearFontCache(): void

export declare const DEFAULT_FONT_DATA: string
export declare const DEFAULT_FONT_ATLAS: string

export declare function parseAnchor(
  anchor: AnchorX | AnchorY | string,
  isX?: boolean,
): number
