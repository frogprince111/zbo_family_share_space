export type NotificationModule = '主页' | '日程' | '待办' | '相册' | '理财'

export type AppNotification = {
  id: string
  module: NotificationModule
  message: string
  read: boolean
  createdAt: string
}

const notificationKey = 'family-app-notifications'
const notificationEvent = 'family-notifications-updated'

function readNotifications() {
  try {
    const raw = window.localStorage.getItem(notificationKey)
    return raw ? (JSON.parse(raw) as AppNotification[]) : []
  } catch {
    return []
  }
}

function writeNotifications(notifications: AppNotification[]) {
  window.localStorage.setItem(notificationKey, JSON.stringify(notifications.slice(0, 80)))
  window.dispatchEvent(new Event(notificationEvent))
}

export function getNotifications() {
  return readNotifications()
}

export function addNotification(module: NotificationModule, message: string) {
  const notification: AppNotification = {
    id: crypto.randomUUID(),
    module,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  }
  writeNotifications([notification, ...readNotifications()])
}

export function markAllNotificationsRead() {
  writeNotifications(readNotifications().map((notification) => ({ ...notification, read: true })))
}

export function clearNotifications() {
  writeNotifications([])
}

export function subscribeNotifications(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(notificationEvent, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(notificationEvent, callback)
  }
}
