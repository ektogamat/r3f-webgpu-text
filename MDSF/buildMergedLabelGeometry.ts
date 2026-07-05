import * as THREE from "three";
import { MSDFTextGeometry } from "three-msdf-text-utils";
import type { BMFontJSON } from "./fontCache";
import type { LabelItem } from "../../../../utils/processing/components/labelTypes";

export interface BuildMergedLabelGeometryOptions {
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
  z?: number;
  labelVerticalOffsetWorld?: number;
  baseFontSizePx?: number;
}

const DEFAULT_LINE_HEIGHT = 1.2;
const DEFAULT_LETTER_SPACING = -0.05;

export function buildMergedLabelGeometry(
  labels: LabelItem[],
  font: BMFontJSON,
  options: BuildMergedLabelGeometryOptions,
): THREE.BufferGeometry | null {
  if (!labels.length) return null;

  const {
    fontSize,
    lineHeight = DEFAULT_LINE_HEIGHT,
    letterSpacing = DEFAULT_LETTER_SPACING,
    z = 1.8,
    labelVerticalOffsetWorld = 0,
    baseFontSizePx = 24,
  } = options;

  const fontInfoSize = font.info?.size ?? 42;
  const commonLineHeight = font.common?.lineHeight ?? 71;
  const fontScale = fontSize / fontInfoSize;

  const positionChunks: number[] = [];
  const uvChunks: number[] = [];
  const indexChunks: number[] = [];
  let vertexOffset = 0;

  for (const label of labels) {
    if (!label.text || !Number.isFinite(label.x) || !Number.isFinite(label.y)) continue;

    const fontScaleFromLabel = label.fontSizePx ? label.fontSizePx / baseFontSizePx : 1;
    const effectiveFontScale = fontScale * fontScaleFromLabel;
    const absoluteLineHeight = lineHeight * commonLineHeight;
    const absoluteLetterSpacing = letterSpacing * fontInfoSize;

    const tempGeo = new MSDFTextGeometry({
      text: label.text,
      font,
      align: "center",
      lineHeight: absoluteLineHeight,
      letterSpacing: absoluteLetterSpacing,
      mode: "pre",
    });
    tempGeo.computeBoundingBox();

    const bbox = tempGeo.boundingBox;
    const minX = bbox?.min.x ?? 0;
    const minY = bbox?.min.y ?? 0;
    const maxY = bbox?.max.y ?? 0;
    const layoutWidth = bbox ? bbox.max.x - minX : 0;

    const offsetX = -(minX + layoutWidth * 0.5) * effectiveFontScale;
    const offsetY = 0.5 * (maxY + minY) * effectiveFontScale + labelVerticalOffsetWorld;

    const posAttr = tempGeo.getAttribute("position");
    const uvAttr = tempGeo.getAttribute("uv");
    const idxAttr = tempGeo.index;

    if (posAttr && uvAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        const px = posAttr.getX(i);
        const py = posAttr.getY(i);
        positionChunks.push(
          label.x + offsetX + px * effectiveFontScale,
          label.y + offsetY - py * effectiveFontScale,
          z,
        );
        uvChunks.push(uvAttr.getX(i), uvAttr.getY(i));
      }
    }

    if (idxAttr) {
      for (let i = 0; i < idxAttr.count; i++) {
        indexChunks.push(idxAttr.getX(i) + vertexOffset);
      }
    }

    vertexOffset += posAttr?.count ?? 0;
    tempGeo.dispose();
  }

  if (positionChunks.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positionChunks, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvChunks, 2));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indexChunks), 1));
  geometry.computeBoundingSphere();
  return geometry;
}
