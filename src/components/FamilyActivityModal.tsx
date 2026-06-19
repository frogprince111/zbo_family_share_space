import { CalendarPlus, MapPin, PartyPopper, UsersRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FamilyActivity } from '../hooks/useFamilyActivities'

type FamilyActivityModalProps = {
  open: boolean
  activities: FamilyActivity[]
  currentUser: { id: string; name: string }
  onClose: () => void
  onCreate: (activity: { title: string; time: string; location: string; note: string }) => void
  onJoin: (id: string) => void
  onError: (message: string) => void
}

export function FamilyActivityModal({ open, activities, currentUser, onClose, onCreate, onJoin, onError }: FamilyActivityModalProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const handleCreate = () => {
    if (!title.trim()) {
      onError('请输入活动名称')
      return
    }
    onCreate({
      title: title.trim(),
      time: time.trim() || '时间待定',
      location: location.trim() || '地点待定',
      note: note.trim(),
    })
    setTitle('')
    setTime('')
    setLocation('')
    setNote('')
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/25 px-4 pb-4 sm:items-center sm:pb-0" onMouseDown={onClose}>
      <section
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-soft sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-activity-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-50 text-amber-500">
              <PartyPopper size={24} />
            </span>
            <div>
              <h2 id="family-activity-title" className="text-xl font-black text-family-text">
                家庭活动
              </h2>
              <p className="mt-1 text-sm font-semibold text-family-muted">创建活动后，其他在线成员可以接龙参加</p>
            </div>
          </div>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-family-muted hover:bg-slate-50" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl bg-family-bg p-4 sm:grid-cols-2">
          <input
            value={title}
            maxLength={40}
            placeholder="活动名称，例如：周末野餐"
            className="min-h-12 rounded-2xl border border-family-border px-4 text-sm font-bold text-family-text"
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            value={time}
            maxLength={40}
            placeholder="活动时间，例如：周六 18:30"
            className="min-h-12 rounded-2xl border border-family-border px-4 text-sm font-bold text-family-text"
            onChange={(event) => setTime(event.target.value)}
          />
          <input
            value={location}
            maxLength={40}
            placeholder="地点，例如：家里 / 公园"
            className="min-h-12 rounded-2xl border border-family-border px-4 text-sm font-bold text-family-text"
            onChange={(event) => setLocation(event.target.value)}
          />
          <input
            value={note}
            maxLength={140}
            placeholder="备注，例如：记得带水果"
            className="min-h-12 rounded-2xl border border-family-border px-4 text-sm font-bold text-family-text"
            onChange={(event) => setNote(event.target.value)}
          />
          <button
            type="button"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-family-primary text-sm font-black text-white active:scale-95 sm:col-span-2"
            onClick={handleCreate}
          >
            <CalendarPlus size={18} />
            创建活动并通知大家
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {activities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-family-border bg-white px-4 py-10 text-center text-sm font-bold text-family-muted">
              暂无活动，先创建一个吧
            </div>
          ) : (
            activities.map((activity) => {
              const joined = activity.participants.some((participant) => participant.id === currentUser.id)
              return (
                <article key={activity.id} className="rounded-3xl border border-family-border bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-family-text">{activity.title}</h3>
                      <p className="mt-2 flex items-center gap-2 text-sm font-bold text-family-muted">
                        <MapPin size={16} />
                        {activity.location} · {activity.time}
                      </p>
                      {activity.note ? <p className="mt-2 text-sm font-semibold text-family-muted">{activity.note}</p> : null}
                    </div>
                    <button
                      type="button"
                      className={`rounded-2xl px-5 py-3 text-sm font-black active:scale-95 ${
                        joined ? 'bg-emerald-50 text-emerald-500' : 'bg-family-primary text-white'
                      }`}
                      disabled={joined}
                      onClick={() => onJoin(activity.id)}
                    >
                      {joined ? '已接龙' : '我要参加'}
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-family-muted">
                    <UsersRound size={17} />
                    接龙成员：
                    {activity.participants.map((participant) => (
                      <span key={participant.id} className="rounded-full bg-family-primarySoft px-3 py-1 text-family-primary">
                        {participant.name}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
