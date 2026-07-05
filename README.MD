# r3f-webgpu-text

**Created by [Anderson Mancini](https://github.com/ektogamat)**

MSDF WebGPU text components for [React Three Fiber](https://docs.pmnd.rs/react-three-fiber). Render crisp, scalable 3D text in WebGPU scenes with an API inspired by Drei's `<Text />`.

Built on top of [`three-msdf-text-utils`](https://www.npmjs.com/package/three-msdf-text-utils), which provides MSDF geometry and WebGPU materials for vanilla Three.js. This package brings the same capabilities to R3F as ready-to-use React components.

## Features

- **WebGPU-first** — uses `MSDFTextNodeMaterial` from `three-msdf-text-utils/webgpu`
- **Drei-like API** — familiar props: `fontSize`, `anchorX`, `anchorY`, `maxWidth`, `lineHeight`, etc.
- **Font caching** — shared loader avoids duplicate fetches across instances
- **Performance modes** — single text, batched instancing, and character-level instancing
- **TypeScript** — full type definitions included

## Requirements

- React 18+
- React Three Fiber 8+
- Three.js 0.172+ with WebGPU support
- A browser with WebGPU enabled
- MSDF font atlas files (`.json` + `.png`)

## Installation

```bash
npm install r3f-webgpu-text three-msdf-text-utils
```

You also need peer dependencies if not already installed:

```bash
npm install three @react-three/fiber react react-dom
```

## Quick start

```jsx
import * as THREE from 'three/webgpu'
import { Canvas, extend } from '@react-three/fiber'
import { WebGPUText } from 'r3f-webgpu-text'

extend(THREE)

function Scene() {
  return (
    <WebGPUText
      position={[0, 1, 0]}
      fontSize={0.5}
      color="#ffffff"
      fontData="/fonts/MyFont-msdf.json"
      fontAtlas="/fonts/MyFont.png"
    >
      Hello WebGPU
    </WebGPUText>
  )
}

export default function App() {
  return (
    <Canvas
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer(props)
        await renderer.init()
        return renderer
      }}
    >
      <Scene />
    </Canvas>
  )
}
```

Place your MSDF font files in your app's `public/fonts/` folder (or any URL-accessible path).

## Components

### `<WebGPUText />`

Renders a single text label. Best for individual labels, titles, and UI elements.

```jsx
<WebGPUText
  position={[0, 1, 0]}
  fontSize={0.5}
  color="#ffffff"
  anchorX="center"
  anchorY="middle"
  textAlign="center"
  lineHeight={1.1}
  letterSpacing={0}
  maxWidth={5}
  fontData="/fonts/Manrope-Medium-msdf.json"
  fontAtlas="/fonts/Manrope-Medium.png"
>
  Hello World
</WebGPUText>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string` | — | Text content |
| `position` | `[x, y, z]` | `[0, 0, 0]` | World position |
| `rotation` | `[x, y, z]` | `[0, 0, 0]` | Rotation in radians |
| `fontSize` | `number` | `1` | Text size in world units |
| `color` | `string` | `"#ffffff"` | Text color |
| `opacity` | `number` | `1` | Text opacity |
| `anchorX` | `"left" \| "center" \| "right" \| number` | `"center"` | Horizontal anchor |
| `anchorY` | `"top" \| "middle" \| "bottom" \| ... \| number` | `"middle"` | Vertical anchor |
| `textAlign` | `"left" \| "center" \| "right"` | `"center"` | Text alignment |
| `lineHeight` | `number` | `1.1` | Line height multiplier |
| `letterSpacing` | `number` | `0` | Letter spacing |
| `maxWidth` | `number` | — | Max width before wrapping |
| `fontData` | `string` | — | Path/URL to BMFont JSON |
| `fontAtlas` | `string` | — | Path/URL to MSDF atlas PNG |
| `renderOrder` | `number` | `0` | Render order |
| `visible` | `boolean` | `true` | Visibility |

### `<WebGPUBatchedText />`

Renders many text labels efficiently. Identical strings (same text, size, color, anchors) are grouped into a single `InstancedMesh` — one draw call per group.

```jsx
<WebGPUBatchedText
  texts={[
    { text: "Hello", position: [0, 0, 0], fontSize: 0.5 },
    { text: "Hello", position: [2, 0, 0], fontSize: 0.5 },
    { text: "World", position: [4, 0, 0], fontSize: 0.5, color: "#ff6600" },
  ]}
  fontData="/fonts/Manrope-Medium-msdf.json"
  fontAtlas="/fonts/Manrope-Medium.png"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `texts` | `BatchedTextItem[]` | `[]` | Array of text configs |
| `fontData` | `string` | — | Path/URL to BMFont JSON |
| `fontAtlas` | `string` | — | Path/URL to MSDF atlas PNG |
| `defaultFontSize` | `number` | `0.02` | Default font size for items |
| `defaultColor` | `string` | `"#ffffff"` | Default color for items |

Each item in `texts` supports: `text`, `position`, `rotation`, `scale`, `fontSize`, `color`, `anchorX`, `anchorY`, `textAlign`, `lineHeight`, `letterSpacing`.

### `<WebGPUInstancedText />`

Character-level instancing. Creates one `InstancedMesh` per unique character — roughly ~70 draw calls regardless of how many different text strings you render. Ideal for large numbers of labels (maps, dashboards, debug overlays).

```jsx
<WebGPUInstancedText
  texts={[
    { text: "HELLO", position: [0, 0, 0] },
    { text: "WORLD", position: [1, 0, 0] },
  ]}
  lookAtCamera={true}
  fontData="/fonts/Manrope-Medium-msdf.json"
  fontAtlas="/fonts/Manrope-Medium.png"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `texts` | `InstancedTextItem[]` | `[]` | Array of text configs |
| `lookAtCamera` | `boolean` | `false` | Billboard effect — text faces camera |
| `charset` | `string` | alphanumeric + punctuation | Allowed characters |
| `fontData` | `string` | — | Path/URL to BMFont JSON |
| `fontAtlas` | `string` | — | Path/URL to MSDF atlas PNG |
| `defaultFontSize` | `number` | `0.02` | Default font size |
| `defaultColor` | `string` | `"#ffffff"` | Default color |

## Performance guide

| Scenario | Component | Draw calls |
|----------|-----------|------------|
| 1–20 labels | `<WebGPUText />` | 1 per label |
| Many identical strings | `<WebGPUBatchedText />` | 1 per unique string group |
| Hundreds/thousands of different labels | `<WebGPUInstancedText />` | ~1 per unique character |

**Tips:**
- Use `<WebGPUText />` for simple scenes and interactive labels
- Use `<WebGPUBatchedText />` when many texts share the same content and styling
- Use `<WebGPUInstancedText />` for dense label clouds (maps, data viz, debug text)
- Always host font files locally — avoid loading fonts from remote URLs in production

## Generating MSDF fonts

You need a BMFont JSON file and a matching PNG atlas generated as MSDF. Use [msdf-bmfont-xml](https://github.com/soimy/msdf-bmfont-xml):

```bash
npx msdf-bmfont-xml -f json -m 512,512 -s 42 -o public/fonts/MyFont MyFont.ttf
```

This produces:
- `MyFont-msdf.json` — glyph metrics and kerning
- `MyFont.png` — MSDF texture atlas

Pass the paths to `fontData` and `fontAtlas` props.

## Utilities

```jsx
import {
  loadFontCached,
  clearFontCache,
  parseAnchor,
  DEFAULT_FONT_DATA,
  DEFAULT_FONT_ATLAS,
} from 'r3f-webgpu-text'

// Preload a font
await loadFontCached('/fonts/MyFont-msdf.json', '/fonts/MyFont.png')

// Clear cache (e.g. on route change)
clearFontCache()
```

## Demo

Run the included demo locally:

```bash
git clone https://github.com/ektogamat/r3f-webgpu-text.git
cd r3f-webgpu-text
npm install
npm run dev
```

Open the URL shown in the terminal (requires WebGPU).

Build the demo for deployment:

```bash
npm run build:demo
```

## Development

```bash
# Run demo dev server
npm run dev

# Build library to dist/
npm run build

# Build demo to demo-dist/
npm run build:demo
```

## Author

Created by **[Anderson Mancini](https://github.com/ektogamat)**.

## License

MIT © Anderson Mancini
