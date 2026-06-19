import { useCallback, useEffect, useState } from 'react'

export type RealtimeChatMessage = {
  id: string
  memberId: string
  type: 'text' | 'image' | 'audio'
  text?: string
  src?: string
  createdAt: string
}

const chatKey = 'family-group-chat-messages'
const defaultMessages: RealtimeChatMessage[] = [
  {
    id: 'welcome',
    memberId: 'system',
    type: 'text',
    text: '家庭群聊已开启，今天也要好好说话。',
    createdAt: '2026-06-18T09:00:00.000Z',
  },
]

function readLocalMessages() {
  try {
    const raw = window.localStorage.getItem(chatKey)
    return raw ? (JSON.parse(raw) as RealtimeChatMessage[]) : defaultMessages
  } catch {
    return defaultMessages
  }
}

function writeLocalMessages(messages: RealtimeChatMessage[]) {
  window.localStorage.setItem(chatKey, JSON.stringify(messages))
  window.dispatchEvent(new Event('family-chat-updated'))
}

export function useRealtimeChat() {
  const [messages, setMessages] = useState<RealtimeChatMessage[]>(() => readLocalMessages())
  const [cloudEnabled, setCloudEnabled] = useState(false)

  useEffect(() => {
    const source = new EventSource('/api/chat/stream')

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { messages?: RealtimeChatMessage[] }
        setMessages(data.messages ?? defaultMessages)
        setCloudEnabled(true)
      } catch {
        setCloudEnabled(false)
      }
    }

    source.onerror = () => {
      setCloudEnabled(false)
      source.close()
      setMessages(readLocalMessages())
    }

    return () => source.close()
  }, [])

  useEffect(() => {
    const refresh = () => {
      if (!cloudEnabled) setMessages(readLocalMessages())
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('family-chat-updated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('family-chat-updated', refresh)
    }
  }, [cloudEnabled])

  const sendMessage = useCallback(
    async (message: Omit<RealtimeChatMessage, 'createdAt'>) => {
      const localMessage: RealtimeChatMessage = {
        ...message,
        createdAt: new Date().toISOString(),
      }

      if (!cloudEnabled) {
        const next = [...readLocalMessages(), localMessage]
        writeLocalMessages(next)
        setMessages(next)
      }

      try {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        })
        if (!response.ok) throw new Error('chat api unavailable')
        setCloudEnabled(true)
      } catch {
        setCloudEnabled(false)
      }
    },
    [cloudEnabled],
  )

  return { messages, cloudEnabled, sendMessage }
}
