import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

let initialized = false
let lastHomeBackPress = 0

function isNativeApp() {
  return Capacitor.isNativePlatform()
}

function getHashPath() {
  const hash = window.location.hash.replace(/^#/, '')
  return hash.split('?')[0] || '/'
}

function closeTopDialog() {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
  if (!dialog) return false

  const closeButton = dialog.querySelector<HTMLButtonElement>('button[aria-label*="关闭"], button[aria-label*="取消"]')
  if (closeButton) {
    closeButton.click()
  } else {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  }
  return true
}

function showExitHint() {
  const existing = document.querySelector('[data-native-exit-hint]')
  if (existing) existing.remove()

  const hint = document.createElement('div')
  hint.dataset.nativeExitHint = 'true'
  hint.textContent = '再按一次退出应用'
  hint.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:calc(96px + env(safe-area-inset-bottom))',
    'z-index:9999',
    'transform:translateX(-50%)',
    'padding:10px 16px',
    'border-radius:999px',
    'background:rgba(31,36,48,0.9)',
    'color:#fff',
    'font-size:14px',
    'font-weight:700',
    'box-shadow:0 10px 30px rgba(0,0,0,0.16)',
  ].join(';')
  document.body.appendChild(hint)
  window.setTimeout(() => hint.remove(), 1800)
}

export function initNativeApp() {
  if (initialized || !isNativeApp()) return
  initialized = true

  StatusBar.setStyle({ style: Style.Light }).catch(() => undefined)
  StatusBar.setBackgroundColor({ color: '#F8F9FC' }).catch(() => undefined)
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined)
  Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => undefined)

  window.addEventListener('load', () => {
    SplashScreen.hide().catch(() => undefined)
  })

  CapacitorApp.addListener('backButton', async () => {
    if (closeTopDialog()) return

    const path = getHashPath()
    if (path !== '/' && path !== '/home') {
      window.history.back()
      return
    }

    const now = Date.now()
    if (now - lastHomeBackPress < 2000) {
      await CapacitorApp.exitApp()
      return
    }
    lastHomeBackPress = now
    showExitHint()
  }).catch(() => undefined)
}
