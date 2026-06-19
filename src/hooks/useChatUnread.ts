import { useEffect, useMemo, useRef, useState } from 'react'
import { getLastChatReadAt, subscribeChatRead } from '../services/chatRead'
import { playNotificationSound } from '../services/sound'
import type { RealtimeChatMessage } from './useRealtimeChat'

type UseChatUnreadOptions = {
  messages: RealtimeChatMessage[]
  currentMemberId: string
  soundEnabled: boolean
  onIncomingMessage?: (message: RealtimeChatMessage) => void
}

export function useChatUnread({ messages, currentMemberId, soundEnabled, onIncomingMessage }: UseChatUnreadOptions) {
  const [lastReadAt, setLastReadAt] = useState(() => getLastChatReadAt())
  const initializedRef = useRef(false)
  const latestIncomingIdRef = useRef('')

  useEffect(() => {
    return subscribeChatRead(() => setLastReadAt(getLastChatReadAt()))
  }, [])

  const unreadMessages = useMemo(() => {
    const lastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : 0
    return messages.filter((message) => {
      if (message.memberId === 'system') return false
      if (message.memberId === currentMemberId) return false
      return new Date(message.createdAt).getTime() > lastReadTime
    })
  }, [currentMemberId, lastReadAt, messages])

  useEffect(() => {
    const latestIncoming = [...messages]
      .filter((message) => message.memberId !== 'system' && message.memberId !== currentMemberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!latestIncoming) {
      initializedRef.current = true
      return
    }

    if (!initializedRef.current) {
      initializedRef.current = true
      latestIncomingIdRef.current = latestIncoming.id
      return
    }

    if (latestIncoming.id === latestIncomingIdRef.current) return
    latestIncomingIdRef.current = latestIncoming.id

    const lastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : 0
    const isUnread = new Date(latestIncoming.createdAt).getTime() > lastReadTime
    if (!isUnread) return

    if (soundEnabled) playNotificationSound()
    onIncomingMessage?.(latestIncoming)
  }, [currentMemberId, lastReadAt, messages, onIncomingMessage, soundEnabled])

  return {
    unreadCount: unreadMessages.length,
    hasUnread: unreadMessages.length > 0,
  }
}
