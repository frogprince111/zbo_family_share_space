import { ArrowLeft, ImagePlus, Mic, SendHorizontal, Square, UsersRound } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MemberAvatar } from '../components/MemberAvatar'
import { PageContainer } from '../components/PageContainer'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { MemberPresenceMap } from '../hooks/useMemberPresence'
import type { FamilyMember, FamilyProfile } from '../types/member'
import { fileToBase64 } from '../utils/avatar'

type ChatPageProps = {
  members: FamilyMember[]
  memberPresence: MemberPresenceMap
  familyProfile: FamilyProfile
}

type ChatMessage = {
  id: string
  memberId: string
  type: 'text' | 'image' | 'audio'
  text?: string
  src?: string
  createdAt: string
}

const defaultMessages: ChatMessage[] = [
  {
    id: 'welcome',
    memberId: 'system',
    type: 'text',
    text: '家庭群聊已开启，今天也要好好说话。',
    createdAt: '2026-06-18T09:00:00.000Z',
  },
]

function formatMessageTime(value: string) {
  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function ChatPage({ members, memberPresence, familyProfile }: ChatPageProps) {
  const navigate = useNavigate()
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('family-group-chat-messages', defaultMessages)
  const [draft, setDraft] = useState('')
  const [recording, setRecording] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const currentMember = useMemo(() => {
    return members.find((member) => member.id === familyProfile.currentMemberId) ?? members[0] ?? null
  }, [familyProfile.currentMemberId, members])

  const memberMap = useMemo(() => {
    return members.reduce<Record<string, FamilyMember>>((result, member) => {
      result[member.id] = member
      return result
    }, {})
  }, [members])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const sendMessage = () => {
    const text = draft.trim()
    if (!text || !currentMember) return
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        memberId: currentMember.id,
        type: 'text',
        text,
        createdAt: new Date().toISOString(),
      },
    ])
    setDraft('')
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !currentMember) return
    if (!file.type.startsWith('image/')) return
    const src = await fileToBase64(file)
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        memberId: currentMember.id,
        type: 'image',
        src,
        text: file.name,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop())
    setRecording(false)
  }

  const toggleRecording = async () => {
    if (recording) {
      stopRecording()
      return
    }
    if (!currentMember) return
    if (!navigator.mediaDevices?.getUserMedia) return

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return
    }

    const recorder = new MediaRecorder(stream)
    audioChunksRef.current = []
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      const src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('语音读取失败'))
        reader.readAsDataURL(blob)
      })
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          memberId: currentMember.id,
          type: 'audio',
          src,
          text: '语音消息',
          createdAt: new Date().toISOString(),
        },
      ])
      audioChunksRef.current = []
      mediaRecorderRef.current = null
    }
    recorder.start()
    setRecording(true)
  }

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-[24px] border border-family-border bg-white shadow-soft">
        <header className="border-b border-family-border bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
              aria-label="返回首页"
              onClick={() => navigate('/home')}
            >
              <ArrowLeft size={22} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="truncate text-xl font-black text-family-text">家庭群聊</h1>
              <p className="mt-1 text-xs font-semibold text-family-muted">{members.length} 位成员</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-family-primarySoft text-family-primary">
              <UsersRound size={21} />
            </div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {members.map((member) => (
              <div key={member.id} className="min-w-[72px] text-center">
                <MemberAvatar member={member} size="md" showStatusDot={false} isOnline={memberPresence[member.id] ?? false} />
                <p className="mt-2 truncate text-xs font-bold text-family-text">{member.name}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="relative h-[58vh] overflow-y-auto bg-[#fbfaf7] px-4 py-5 sm:px-6">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="select-none text-center text-5xl font-black tracking-[0.25em] text-family-primary/10 sm:text-7xl">
              家和万事兴
            </span>
          </div>
          <div className="relative z-10">
          {messages.map((message) => {
            const isSystem = message.memberId === 'system'
            const sender = memberMap[message.memberId]
            const isMine = currentMember?.id === message.memberId

            if (isSystem) {
              return (
                <div key={message.id} className="my-4 text-center">
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-family-muted">{message.text}</span>
                </div>
              )
            }

            if (!sender) return null

            return (
              <div key={message.id} className={`mb-5 flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                <MemberAvatar member={sender} size="md" showStatusDot={false} isOnline={memberPresence[sender.id] ?? false} />
                <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`mb-1 flex items-center gap-2 text-xs font-semibold text-family-muted ${isMine ? 'flex-row-reverse' : ''}`}>
                    <span>{sender.name}</span>
                    <span>{formatMessageTime(message.createdAt)}</span>
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${
                      isMine
                        ? 'rounded-tr-sm bg-family-primary text-white'
                        : 'rounded-tl-sm border border-family-border bg-white text-family-text'
                    }`}
                  >
                    {message.type === 'image' && message.src ? (
                      <img src={message.src} alt={message.text ?? '聊天图片'} className="max-h-64 max-w-full rounded-xl object-contain" />
                    ) : message.type === 'audio' && message.src ? (
                      <audio src={message.src} controls className="max-w-full" />
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
          </div>
        </div>

        <footer className="border-t border-family-border bg-white p-4 sm:p-5">
          <div className="flex items-end gap-3">
            <button
              type="button"
              className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 ${
                recording ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-slate-100 text-family-muted hover:bg-family-primarySoft hover:text-family-primary'
              }`}
              disabled={!currentMember}
              onClick={toggleRecording}
              aria-label={recording ? '停止录音' : '发送语音'}
            >
              {recording ? <Square size={20} /> : <Mic size={22} />}
            </button>
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-family-muted shadow-sm hover:bg-family-primarySoft hover:text-family-primary active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!currentMember}
              onClick={() => imageInputRef.current?.click()}
              aria-label="发送图片"
            >
              <ImagePlus size={22} />
            </button>
            <input ref={imageInputRef} className="sr-only" type="file" accept="image/*" onChange={handleImageUpload} />
            <textarea
              value={draft}
              rows={1}
              maxLength={300}
              placeholder={currentMember ? `以 ${currentMember.name} 的身份发消息` : '请先添加家庭成员'}
              className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-family-border bg-slate-50 px-4 py-3 text-sm font-semibold text-family-text outline-none placeholder:text-slate-400 focus:border-family-primary"
              disabled={!currentMember}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage()
                }
              }}
            />
            <button
              type="button"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-family-primary text-white shadow-sm hover:bg-violet-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!draft.trim() || !currentMember}
              onClick={sendMessage}
              aria-label="发送消息"
            >
              <SendHorizontal size={22} />
            </button>
          </div>
        </footer>
      </section>
    </PageContainer>
  )
}
