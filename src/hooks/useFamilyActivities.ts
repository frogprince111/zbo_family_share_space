import { useCallback, useEffect, useRef, useState } from 'react'

export type FamilyActivity = {
  id: string
  title: string
  time: string
  location: string
  note?: string
  creatorId: string
  creatorName: string
  participants: Array<{ id: string; name: string }>
  createdAt: string
}

export type ActivityEvent = {
  event: 'sync' | 'created' | 'joined'
  activity: FamilyActivity | null
  activities: FamilyActivity[]
}

const activitiesKey = 'family-activities'

function readLocalActivities() {
  try {
    const raw = window.localStorage.getItem(activitiesKey)
    return raw ? (JSON.parse(raw) as FamilyActivity[]) : []
  } catch {
    return []
  }
}

function writeLocalActivities(activities: FamilyActivity[]) {
  window.localStorage.setItem(activitiesKey, JSON.stringify(activities))
  window.dispatchEvent(new Event('family-activities-updated'))
}

export function useFamilyActivities(onEvent?: (event: ActivityEvent) => void) {
  const [activities, setActivities] = useState<FamilyActivity[]>(() => readLocalActivities())
  const [cloudEnabled, setCloudEnabled] = useState(false)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    const source = new EventSource('/api/activities/stream')

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ActivityEvent
        setActivities(data.activities ?? [])
        setCloudEnabled(true)
        onEventRef.current?.(data)
      } catch {
        setCloudEnabled(false)
      }
    }

    source.onerror = () => {
      setCloudEnabled(false)
      source.close()
      setActivities(readLocalActivities())
    }

    return () => source.close()
  }, [])

  useEffect(() => {
    const refresh = () => {
      if (!cloudEnabled) setActivities(readLocalActivities())
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('family-activities-updated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('family-activities-updated', refresh)
    }
  }, [cloudEnabled])

  const createActivity = useCallback(
    async (activity: Pick<FamilyActivity, 'title' | 'time' | 'location' | 'note' | 'creatorId' | 'creatorName'>) => {
      if (!cloudEnabled) {
        const localActivity: FamilyActivity = {
          ...activity,
          id: crypto.randomUUID(),
          participants: [{ id: activity.creatorId, name: activity.creatorName }],
          createdAt: new Date().toISOString(),
        }
        const next = [localActivity, ...readLocalActivities()]
        writeLocalActivities(next)
        setActivities(next)
      }

      try {
        const response = await fetch('/api/activities/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity),
        })
        if (!response.ok) throw new Error('activity api unavailable')
        setCloudEnabled(true)
      } catch {
        setCloudEnabled(false)
      }
    },
    [cloudEnabled],
  )

  const joinActivity = useCallback(
    async (id: string, participantId: string, participantName: string) => {
      if (!cloudEnabled) {
        const next = readLocalActivities().map((activity) => {
          if (activity.id !== id || activity.participants.some((participant) => participant.id === participantId)) return activity
          return { ...activity, participants: [...activity.participants, { id: participantId, name: participantName }] }
        })
        writeLocalActivities(next)
        setActivities(next)
      }

      try {
        const response = await fetch('/api/activities/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, participantId, participantName }),
        })
        if (!response.ok) throw new Error('activity api unavailable')
        setCloudEnabled(true)
      } catch {
        setCloudEnabled(false)
      }
    },
    [cloudEnabled],
  )

  return { activities, cloudEnabled, createActivity, joinActivity }
}
