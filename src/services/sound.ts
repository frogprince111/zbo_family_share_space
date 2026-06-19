const soundKey = 'family-sound-enabled'
const soundEvent = 'family-sound-updated'

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

export function getSoundEnabled() {
  return window.localStorage.getItem(soundKey) !== 'off'
}

export function setSoundEnabled(enabled: boolean) {
  window.localStorage.setItem(soundKey, enabled ? 'on' : 'off')
  window.dispatchEvent(new Event(soundEvent))
}

export function subscribeSoundSetting(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(soundEvent, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(soundEvent, callback)
  }
}

export function playNotificationSound() {
  try {
    const audioWindow = window as AudioWindow
    const AudioContextClass = window.AudioContext || audioWindow.webkitAudioContext
    if (!AudioContextClass) return
    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.16)
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.24)
    window.setTimeout(() => audioContext.close(), 320)
  } catch {
    // Some mobile browsers block sound until a user gesture; silently ignore.
  }
}
