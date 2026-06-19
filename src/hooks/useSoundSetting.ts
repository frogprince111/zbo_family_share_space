import { useEffect, useState } from 'react'
import { getSoundEnabled, setSoundEnabled, subscribeSoundSetting } from '../services/sound'

export function useSoundSetting() {
  const [enabled, setEnabled] = useState(() => getSoundEnabled())

  useEffect(() => {
    return subscribeSoundSetting(() => setEnabled(getSoundEnabled()))
  }, [])

  const toggle = () => {
    const next = !getSoundEnabled()
    setSoundEnabled(next)
    setEnabled(next)
  }

  return { enabled, toggle }
}
