import { Check, PencilLine, Smartphone, UsersRound, Wifi, WifiOff, X } from 'lucide-react'
import { useState } from 'react'
import type { OnlineVisitor } from '../hooks/useOnlineVisitors'

type OnlineVisitorsPanelProps = {
  visitors: OnlineVisitor[]
  currentVisitorId: string
  visitorName: string
  cloudEnabled: boolean
  onRename: (name: string) => void
}

function formatLastSeen(value: string) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return '刚刚在线'
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000))
  if (seconds < 10) return '刚刚在线'
  if (seconds < 60) return `${seconds} 秒前在线`
  return `${Math.floor(seconds / 60)} 分钟前在线`
}

export function OnlineVisitorsPanel({ visitors, currentVisitorId, visitorName, cloudEnabled, onRename }: OnlineVisitorsPanelProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(visitorName)

  const saveName = () => {
    const nextName = draftName.trim()
    if (!nextName) return
    onRename(nextName)
    setEditing(false)
  }

  return (
    <section className="mt-6 rounded-[24px] border border-family-border bg-white p-5 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <UsersRound size={24} />
          </span>
          <div>
            <h3 className="text-xl font-black text-family-text">在线人员</h3>
            <p className="mt-1 text-sm font-semibold text-family-muted">
              {cloudEnabled ? '同一个固定链接打开的人会实时显示在这里' : '本地预览模式，部署到 Render 后可实时同步'}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${
            cloudEnabled ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
          }`}
        >
          {cloudEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
          {cloudEnabled ? '实时在线' : '本机在线'}
        </span>
      </div>

      <div className="mt-5 rounded-3xl bg-family-bg p-4">
        <p className="mb-3 text-sm font-bold text-family-muted">我的在线名称</p>
        {editing ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={24}
              className="min-h-12 flex-1 rounded-2xl border border-family-border bg-white px-4 text-base font-bold text-family-text outline-none focus:border-family-primary"
              placeholder="输入你的名字"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-family-primary px-5 text-sm font-black text-white active:scale-95 sm:flex-none"
                onClick={saveName}
              >
                <Check size={18} />
                保存
              </button>
              <button
                type="button"
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-family-muted active:scale-95 sm:flex-none"
                onClick={() => {
                  setDraftName(visitorName)
                  setEditing(false)
                }}
              >
                <X size={18} />
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 text-left shadow-sm active:scale-[0.99]"
            onClick={() => setEditing(true)}
          >
            <span className="text-base font-black text-family-text">{visitorName}</span>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-family-primary">
              <PencilLine size={17} />
              编辑名字
            </span>
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visitors.map((visitor) => {
          const isMe = visitor.id === currentVisitorId
          return (
            <div
              key={visitor.id}
              className={`flex items-center gap-3 rounded-3xl border p-4 ${
                isMe ? 'border-emerald-200 bg-emerald-50' : 'border-family-border bg-family-bg'
              }`}
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-lg font-black text-white">
                {visitor.name.slice(0, 1)}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-family-text">
                  {visitor.name}
                  {isMe ? <span className="ml-2 text-xs text-emerald-500">我</span> : null}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-family-muted">
                  <Smartphone size={14} />
                  {visitor.device} · {formatLastSeen(visitor.lastSeenAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
