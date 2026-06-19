import { useEffect, useMemo, useState } from 'react'
import { clearNotifications, getNotifications, markAllNotificationsRead, subscribeNotifications } from '../services/notifications'

export function useNotifications() {
  const [notifications, setNotifications] = useState(() => getNotifications())

  useEffect(() => {
    return subscribeNotifications(() => setNotifications(getNotifications()))
  }, [])

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications])

  return {
    notifications,
    unreadCount,
    markAllRead: markAllNotificationsRead,
    clearAll: clearNotifications,
  }
}
