import { createContext, useContext, useState } from 'react'
import { QUALITY_PRESETS } from './constants'

const DemoSettingsContext = createContext(null)

export function DemoSettingsProvider({ children }) {
  const [quality, setQuality] = useState('ultra')
  const preset = QUALITY_PRESETS[quality]

  return (
    <DemoSettingsContext.Provider value={{ quality, setQuality, preset }}>
      {children}
    </DemoSettingsContext.Provider>
  )
}

export function useDemoSettings() {
  const ctx = useContext(DemoSettingsContext)
  if (!ctx) throw new Error('useDemoSettings must be used within DemoSettingsProvider')
  return ctx
}
