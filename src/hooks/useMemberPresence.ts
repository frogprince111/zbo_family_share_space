import { useEffect, useState } from 'react'
import type { FamilyMember } from '../types/member'

export type MemberPresenceMap = Record<string, boolean>

type StoredPresence = Record<string, { online: boolean; lastSeen: string }>

const presenceKey = 'family-member-presence'

function readStoredPresence() {
  try {
    const raw = window.localStorage.getItem(presenceKey)
    return raw ? (JSON.parse(raw) as StoredPresence) : {}
  } catch {
    return {}
  }
}

function writeStoredPresence(presence: StoredPresence) {
  window.localStorage.setItem(presenceKey, JSON.stringify(presence))
  window.dispatchEvent(new Event('family-presence-updated'))
}

function toPresenceMap(members: FamilyMember[], stored: StoredPresence) {
  return members.reduce<MemberPresenceMap>((next, member) => {
    next[member.id] = stored[member.id]?.online ?? false
    return next
  }, {})
}

function normalizeStoredPresence(members: FamilyMember[], stored: StoredPresence) {
  return members.reduce<StoredPresence>((next, member) => {
    next[member.id] = stored[member.id] ?? { online: false, lastSeen: '' }
    return next
  }, {})
}

export function useMemberPresence(members: FamilyMember[], currentMemberId: string) {
  const [presence, setPresence] = useState<MemberPresenceMap>(() => toPresenceMap(members, readStoredPresence()))

  useEffect(() => {
    const stored = normalizeStoredPresence(members, readStoredPresence())
    writeStoredPresence(stored)
    setPresence(toPresenceMap(members, stored))
  }, [members])

  useEffect(() => {
    const refreshPresence = () => setPresence(toPresenceMap(members, readStoredPresence()))
    window.addEventListener('storage', refreshPresence)
    window.addEventListener('family-presence-updated', refreshPresence)
    return () => {
      window.removeEventListener('storage', refreshPresence)
      window.removeEventListener('family-presence-updated', refreshPresence)
    }
  }, [members])

  useEffect(() => {
    if (!currentMemberId) return

    const updateCurrentMember = (online: boolean) => {
      const stored = normalizeStoredPresence(members, readStoredPresence())
      if (!stored[currentMemberId]) return
      stored[currentMemberId] = { online, lastSeen: new Date().toISOString() }
      writeStoredPresence(stored)
      setPresence(toPresenceMap(members, stored))
    }

    const handleVisibilityChange = () => updateCurrentMember(!document.hidden)
    const handleOnline = () => updateCurrentMember(true)
    const handleOffline = () => updateCurrentMember(false)

    updateCurrentMember(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleOnline)
    window.addEventListener('pagehide', handleOffline)
    window.addEventListener('beforeunload', handleOffline)

    return () => {
      handleOffline()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleOnline)
      window.removeEventListener('pagehide', handleOffline)
      window.removeEventListener('beforeunload', handleOffline)
    }
  }, [currentMemberId, members])

  return presence
}
