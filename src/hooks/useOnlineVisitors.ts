import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ThemeColor } from '../types/member'

export type OnlineVisitor = {
  id: string
  name: string
  device: string
  themeColor: ThemeColor
  avatar?: string
  role?: string
  birthday?: string
  lastSeenAt: string
}

const visitorIdKey = 'family-online-visitor-id'
const visitorNameKey = 'family-online-visitor-name'
const visitorAvatarKey = 'family-online-visitor-avatar'
const visitorRoleKey = 'family-online-visitor-role'
const visitorBirthdayKey = 'family-online-visitor-birthday'
const localVisitorsKey = 'family-online-local-visitors'
const themeColors: ThemeColor[] = ['pink', 'purple', 'blue', 'yellow', 'green', 'orange']

function createVisitorId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readVisitorId() {
  const existing = window.localStorage.getItem(visitorIdKey)
  if (existing) return existing
  const next = createVisitorId()
  window.localStorage.setItem(visitorIdKey, next)
  return next
}

function readVisitorName() {
  const existing = window.localStorage.getItem(visitorNameKey)
  if (existing) return existing
  const fallback = `家人${Math.floor(1000 + Math.random() * 9000)}`
  window.localStorage.setItem(visitorNameKey, fallback)
  return fallback
}

function readVisitorAvatar() {
  return window.localStorage.getItem(visitorAvatarKey) || ''
}

function readVisitorRole() {
  return window.localStorage.getItem(visitorRoleKey) || '家庭成员'
}

function readVisitorBirthday() {
  return window.localStorage.getItem(visitorBirthdayKey) || ''
}

function detectDevice() {
  if (/iPhone|Android|Mobile/i.test(navigator.userAgent)) return '手机端'
  if (/iPad|Tablet/i.test(navigator.userAgent)) return '平板端'
  return '网页端'
}

function pickThemeColor(id: string) {
  const total = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return themeColors[total % themeColors.length]
}

function readLocalVisitors() {
  try {
    const raw = window.localStorage.getItem(localVisitorsKey)
    return raw ? (JSON.parse(raw) as OnlineVisitor[]) : []
  } catch {
    return []
  }
}

function writeLocalVisitor(visitor: OnlineVisitor) {
  const visitors = readLocalVisitors().filter((item) => item.id !== visitor.id)
  window.localStorage.setItem(localVisitorsKey, JSON.stringify([visitor, ...visitors].slice(0, 8)))
  window.dispatchEvent(new Event('family-online-visitors-updated'))
}

function apiRequest(path: string, payload?: unknown) {
  return fetch(path, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
  })
}

export function useOnlineVisitors() {
  const [visitorId] = useState(() => readVisitorId())
  const [visitorName, setVisitorName] = useState(() => readVisitorName())
  const [visitorAvatar, setVisitorAvatar] = useState(() => readVisitorAvatar())
  const [visitorRole, setVisitorRole] = useState(() => readVisitorRole())
  const [visitorBirthday, setVisitorBirthday] = useState(() => readVisitorBirthday())
  const [visitors, setVisitors] = useState<OnlineVisitor[]>([])
  const [cloudEnabled, setCloudEnabled] = useState(false)
  const device = useMemo(() => detectDevice(), [])

  const currentVisitor = useMemo<OnlineVisitor>(
    () => ({
      id: visitorId,
      name: visitorName,
      device,
      themeColor: pickThemeColor(visitorId),
      avatar: visitorAvatar,
      role: visitorRole,
      birthday: visitorBirthday,
      lastSeenAt: new Date().toISOString(),
    }),
    [device, visitorAvatar, visitorBirthday, visitorId, visitorName, visitorRole],
  )

  const syncLocal = useCallback(() => {
    const current = { ...currentVisitor, lastSeenAt: new Date().toISOString() }
    writeLocalVisitor(current)
    setVisitors(readLocalVisitors())
  }, [currentVisitor])

  const sendHeartbeat = useCallback(async () => {
    const payload = {
      id: visitorId,
      name: visitorName,
      device,
      themeColor: pickThemeColor(visitorId),
      avatar: visitorAvatar,
      role: visitorRole,
      birthday: visitorBirthday,
    }
    try {
      const response = await apiRequest('/api/online/heartbeat', payload)
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok || !contentType.includes('application/json')) throw new Error('online api unavailable')
      setCloudEnabled(true)
    } catch {
      setCloudEnabled(false)
      syncLocal()
    }
  }, [device, syncLocal, visitorAvatar, visitorBirthday, visitorId, visitorName, visitorRole])

  useEffect(() => {
    syncLocal()
    sendHeartbeat()
    const timer = window.setInterval(sendHeartbeat, 15_000)
    return () => window.clearInterval(timer)
  }, [sendHeartbeat, syncLocal])

  useEffect(() => {
    const source = new EventSource('/api/online/stream')

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { visitors?: OnlineVisitor[] }
        setVisitors(data.visitors ?? [])
        setCloudEnabled(true)
      } catch {
        setCloudEnabled(false)
      }
    }

    source.onerror = () => {
      setCloudEnabled(false)
      source.close()
      syncLocal()
    }

    return () => source.close()
  }, [syncLocal])

  useEffect(() => {
    const refreshLocal = () => {
      if (!cloudEnabled) setVisitors(readLocalVisitors())
    }
    window.addEventListener('storage', refreshLocal)
    window.addEventListener('family-online-visitors-updated', refreshLocal)
    return () => {
      window.removeEventListener('storage', refreshLocal)
      window.removeEventListener('family-online-visitors-updated', refreshLocal)
    }
  }, [cloudEnabled])

  useEffect(() => {
    const markOffline = () => {
      const payload = JSON.stringify({ id: visitorId })
      navigator.sendBeacon?.('/api/online/offline', new Blob([payload], { type: 'application/json' }))
    }
    window.addEventListener('pagehide', markOffline)
    return () => window.removeEventListener('pagehide', markOffline)
  }, [visitorId])

  const updateVisitorName = useCallback(
    (name: string) => {
      const nextName = name.trim().slice(0, 24)
      if (!nextName) return
      window.localStorage.setItem(visitorNameKey, nextName)
      setVisitorName(nextName)
    },
    [],
  )

  const updateVisitorAvatar = useCallback((avatar: string) => {
    window.localStorage.setItem(visitorAvatarKey, avatar)
    setVisitorAvatar(avatar)
  }, [])

  const updateVisitorRole = useCallback((role: string) => {
    const nextRole = role.trim().slice(0, 16) || '家庭成员'
    window.localStorage.setItem(visitorRoleKey, nextRole)
    setVisitorRole(nextRole)
  }, [])

  const updateVisitorBirthday = useCallback((birthday: string) => {
    window.localStorage.setItem(visitorBirthdayKey, birthday)
    setVisitorBirthday(birthday)
  }, [])

  return {
    visitors,
    currentVisitor,
    currentVisitorId: visitorId,
    visitorName,
    visitorAvatar,
    visitorRole,
    visitorBirthday,
    cloudEnabled,
    updateVisitorName,
    updateVisitorAvatar,
    updateVisitorRole,
    updateVisitorBirthday,
  }
}
