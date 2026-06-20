import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications()

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label="查看通知"
        className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-white hover:text-family-primary active:scale-95"
        onClick={() => {
          setOpen((current) => !current)
          if (!open) markAllRead()
        }}
      >
        <Bell size={28} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" aria-label={`${unreadCount}条未读通知`} />
        )}
      </button>

      {open && (
        <section className="fixed left-4 right-4 top-24 z-[1300] max-h-[70vh] overflow-hidden rounded-[22px] border border-family-border bg-white shadow-soft sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-[min(86vw,360px)]">
          <div className="flex items-center justify-between gap-3 border-b border-family-border px-4 py-3">
            <div>
              <h2 className="text-base font-black text-family-text">新消息</h2>
              <p className="mt-1 text-xs font-semibold text-family-muted">{notifications.length > 0 ? `${notifications.length} 条消息` : '暂无消息'}</p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="全部已读"
                className="flex h-9 w-9 items-center justify-center rounded-full text-family-muted hover:bg-family-primarySoft hover:text-family-primary"
                onClick={markAllRead}
              >
                <CheckCheck size={18} />
              </button>
              <button
                type="button"
                aria-label="清空通知"
                className="flex h-9 w-9 items-center justify-center rounded-full text-family-muted hover:bg-rose-50 hover:text-rose-500"
                onClick={clearAll}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(70vh-74px)] overflow-y-auto p-2 sm:max-h-[360px]">
            {notifications.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-family-muted">还没有新的消息</p>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`mb-2 grid grid-cols-[auto_1fr] gap-3 rounded-2xl px-3 py-3 text-left ${
                    notification.read ? 'bg-white' : 'bg-family-primarySoft'
                  }`}
                >
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.read ? 'bg-slate-300' : 'bg-rose-500'}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-family-text">
                      【{notification.module}】{notification.message}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-family-muted">{formatNotificationTime(notification.createdAt)}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}
