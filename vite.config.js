import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isLibraryBuild = process.env.BUILD_LIB === 'true'

export default defineConfig({
  plugins: [react()],
  root: isLibraryBuild ? undefined : 'demo',
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    ...(isLibraryBuild ? {} : { dedupe: ['three'] }),
    alias: isLibraryBuild
      ? {}
      : [
          { find: 'r3f-webgpu-text', replacement: resolve(__dirname, 'src') },
          { find: 'three/webgpu', replacement: resolve(__dirname, 'node_modules/three/build/three.webgpu.js') },
          { find: 'three/tsl', replacement: resolve(__dirname, 'node_modules/three/build/three.tsl.js') },
          { find: /^three\/addons\/(.*)/, replacement: resolve(__dirname, 'node_modules/three/examples/jsm/$1') },
        ],
  },
  build: isLibraryBuild
    ? {
        lib: {
          entry: resolve(__dirname, 'src/index.jsx'),
          name: 'R3fWebgpuText',
          formats: ['es', 'cjs'],
          fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
        },
        rollupOptions: {
          external: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            '@react-three/fiber',
            'three',
            'three-msdf-text-utils',
            'three-msdf-text-utils/webgpu',
          ],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              'react-dom/client': 'ReactDOM',
              '@react-three/fiber': 'ReactThreeFiber',
              three: 'THREE',
              'three-msdf-text-utils': 'ThreeMsdfTextUtils',
              'three-msdf-text-utils/webgpu': 'ThreeMsdfTextUtilsWebgpu',
            },
          },
        },
        outDir: 'dist',
        emptyOutDir: true,
      }
    : {
        outDir: resolve(__dirname, 'demo-dist'),
        emptyOutDir: true,
        target: 'esnext',
      },
})
