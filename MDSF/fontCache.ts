import * as THREE from "three";

/** BMFont JSON structure from msdf-bmfont-xml output */
export interface BMFontJSON {
  pages: string[];
  chars: Array<{
    id: number;
    char: string;
    width: number;
    height: number;
    xoffset: number;
    yoffset: number;
    xadvance: number;
    x: number;
    y: number;
    page: number;
  }>;
  info: { size: number; face?: string };
  common: { lineHeight: number; base: number; scaleW: number; scaleH: number };
  distanceField?: { fieldType: string; distanceRange: number };
  kernings?: Array<{ first: number; second: number; amount: number }>;
}

export const DEFAULT_FONT_DATA = "/fonts/Manrope-Bold-msdf.json";
export const DEFAULT_FONT_ATLAS = "/fonts/Manrope-Bold.png";

/** Shared cache for font+atlas to avoid duplicate fetches across MSDF text instances */
const fontCache = new Map<string, Promise<{ font: BMFontJSON; atlas: THREE.Texture }>>();

export function loadFontCached(
  fontData: string,
  fontAtlas: string,
): Promise<{ font: BMFontJSON; atlas: THREE.Texture }> {
  const key = `${fontData}|${fontAtlas}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      Promise.all([
        fetch(fontData).then((r) => r.json()) as Promise<BMFontJSON>,
        new Promise<THREE.Texture>((resolve, reject) => {
          new THREE.TextureLoader().load(fontAtlas, resolve, undefined, reject);
        }),
      ]).then(([font, atlas]) => ({ font, atlas })),
    );
  }
  return fontCache.get(key)!;
}
