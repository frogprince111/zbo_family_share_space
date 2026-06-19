const chatReadKey = 'family-chat-last-read-at'
const chatReadEvent = 'family-chat-read-updated'

export function getLastChatReadAt() {
  return window.localStorage.getItem(chatReadKey) || ''
}

export function markChatReadNow() {
  window.localStorage.setItem(chatReadKey, new Date().toISOString())
  window.dispatchEvent(new Event(chatReadEvent))
}

export function subscribeChatRead(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(chatReadEvent, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(chatReadEvent, callback)
  }
}
