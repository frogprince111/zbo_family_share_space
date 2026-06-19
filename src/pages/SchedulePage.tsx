import { CalendarDays, Clock, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageContainer } from '../components/PageContainer'
import { Toast, type ToastState } from '../components/Toast'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultMembers } from '../data/defaultMembers'
import type { FamilyMember } from '../types/member'

type ScheduleEvent = {
  id: string
  date: string
  time: string
  title: string
  detail: string
  completed?: boolean
  readonly?: boolean
  createdAt: string
}

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateLabel(dateKey: string) {
  const date = parseDateKey(dateKey)
  return `${date.getMonth() + 1}月${date.getDate()}日 周${weekdays[date.getDay()]}`
}

function getCountdownText(title: string, targetDateKey: string, todayKey: string) {
  const eventName = title.trim()
  if (!eventName || !targetDateKey) return ''
  const dayMilliseconds = 24 * 60 * 60 * 1000
  const diffDays = Math.round((parseDateKey(targetDateKey).getTime() - parseDateKey(todayKey).getTime()) / dayMilliseconds)
  if (diffDays === 0) return `倒计时 ${eventName}，就是今天`
  if (diffDays > 0) return `倒计时 ${eventName}，还有 ${diffDays} 天`
  return `倒计时 ${eventName}，已过去 ${Math.abs(diffDays)} 天`
}

function getEventDateTime(event: ScheduleEvent) {
  const [hour, minute] = event.time.split(':').map(Number)
  const date = parseDateKey(event.date)
  date.setHours(hour || 0, minute || 0, 0, 0)
  return date
}

function createEmptyEvent(date: string): ScheduleEvent {
  return {
    id: crypto.randomUUID(),
    date,
    time: '09:00',
    title: '',
    detail: '',
    completed: false,
    createdAt: new Date().toISOString(),
  }
}

export default function SchedulePage() {
  const today = useMemo(() => new Date(), [])
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const todayKey = toDateKey(today)
  const [events, setEvents] = useLocalStorage<ScheduleEvent[]>('family-schedule-events', [])
  const [members] = useLocalStorage<FamilyMember[]>('family-members', defaultMembers)
  const [countdownTitle, setCountdownTitle] = useLocalStorage('family-countdown-title', '')
  const [countdownDate, setCountdownDate] = useLocalStorage('family-countdown-date', '')
  const [toast, setToast] = useState<ToastState>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [countdownModalOpen, setCountdownModalOpen] = useState(false)
  const [draftCountdownTitle, setDraftCountdownTitle] = useState(countdownTitle)
  const [draftCountdownDate, setDraftCountdownDate] = useState(countdownDate)
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent>(() => createEmptyEvent(todayKey))
  const [contextEvent, setContextEvent] = useState<ScheduleEvent | null>(null)
  const [contextPosition, setContextPosition] = useState({ x: 0, y: 0 })
  const longPressTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const eventsWithExtraTask = events.filter((event) => event.detail.trim())
    if (eventsWithExtraTask.length === 0) return

    setEvents((current) =>
      current.flatMap((event) => {
        const extraTask = event.detail.trim()
        if (!extraTask) return [event]
        return [
          { ...event, detail: '' },
          {
            ...createEmptyEvent(event.date),
            time: event.time,
            title: extraTask,
            completed: event.completed,
            createdAt: event.createdAt,
          },
        ]
      }),
    )
  }, [events, setEvents])

  const firstDay = new Date(currentYear, currentMonth, 1)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const leadingDays = firstDay.getDay()

  const calendarCells = useMemo(() => {
    const emptyCells = Array.from({ length: leadingDays }, (_, index) => ({ key: `empty-${index}`, dateKey: '', day: '' }))
    const dayCells = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(currentYear, currentMonth, index + 1)
      return { key: toDateKey(date), dateKey: toDateKey(date), day: String(index + 1) }
    })
    return [...emptyCells, ...dayCells]
  }, [currentMonth, currentYear, daysInMonth, leadingDays])

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, ScheduleEvent[]>>((grouped, event) => {
      grouped[event.date] = [...(grouped[event.date] ?? []), event]
      return grouped
    }, {})
  }, [events])

  const selectedDateEvents = [...(eventsByDate[selectedDate] ?? [])].sort((a, b) => a.time.localeCompare(b.time))

  const birthdayEvents = useMemo(() => {
    return members
      .filter((member) => member.birthday)
      .flatMap((member) => {
        const [, birthMonth, birthDay] = member.birthday!.split('-').map(Number)
        return [currentYear, currentYear + 1].map((year) => {
          const birthday = new Date(year, birthMonth - 1, birthDay)
          return {
            id: `birthday-${member.id}-${year}`,
            date: toDateKey(birthday),
            time: '09:00',
            title: `${member.name}的生日快到了，快送上祝福吧`,
            detail: '家庭成员生日提醒',
            completed: false,
            readonly: true,
            createdAt: member.createdAt,
          }
        })
      })
  }, [currentYear, members])

  const recentEvents = useMemo(() => {
    const now = new Date()
    const start = now.getTime() - 7 * 24 * 60 * 60 * 1000
    const end = now.getTime() + 7 * 24 * 60 * 60 * 1000
    return [...events, ...birthdayEvents]
      .filter((event) => {
        const time = getEventDateTime(event).getTime()
        return time >= start && time <= end
      })
      .sort((a, b) => {
        if (a.readonly !== b.readonly) return a.readonly ? -1 : 1
        return getEventDateTime(a).getTime() - getEventDateTime(b).getTime()
      })
  }, [birthdayEvents, events])

  const recentEventsByDate = useMemo(() => {
    return recentEvents.reduce<Record<string, ScheduleEvent[]>>((grouped, event) => {
      grouped[event.date] = [...(grouped[event.date] ?? []), event]
      return grouped
    }, {})
  }, [recentEvents])

  const recentDateKeys = Object.keys(recentEventsByDate).sort((a, b) => {
    const aHasBirthday = recentEventsByDate[a].some((event) => event.readonly)
    const bHasBirthday = recentEventsByDate[b].some((event) => event.readonly)
    if (aHasBirthday !== bHasBirthday) return aHasBirthday ? -1 : 1
    return parseDateKey(a).getTime() - parseDateKey(b).getTime()
  })
  const countdownText = getCountdownText(countdownTitle, countdownDate, todayKey)

  useEffect(() => {
    if (!modalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [modalOpen])

  useEffect(() => {
    if (!countdownModalOpen) return
    setDraftCountdownTitle(countdownTitle)
    setDraftCountdownDate(countdownDate)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCountdownModalOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [countdownDate, countdownModalOpen, countdownTitle])

  useEffect(() => {
    const closeMenu = () => setContextEvent(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const openDateModal = (dateKey: string) => {
    const firstEvent = eventsByDate[dateKey]?.[0]
    setSelectedDate(dateKey)
    setEditingEvent(firstEvent ?? createEmptyEvent(dateKey))
    setModalOpen(true)
  }

  const handleAddSchedule = () => {
    setSelectedDate(todayKey)
    setEditingEvent(createEmptyEvent(todayKey))
    setModalOpen(true)
  }

  const handleSaveEvent = () => {
    const title = editingEvent.title.trim()
    const detail = editingEvent.detail.trim()
    if (!title) {
      setToast({ message: '请输入日程标题', type: 'error' })
      return
    }

    const eventToSave = { ...editingEvent, title, detail: '', date: selectedDate }
    const extraEvent = detail
      ? {
          ...createEmptyEvent(selectedDate),
          time: editingEvent.time,
          title: detail,
        }
      : null

    setEvents((current) => {
      const exists = current.some((event) => event.id === eventToSave.id)
      const next = exists ? current.map((event) => (event.id === eventToSave.id ? eventToSave : event)) : [...current, eventToSave]
      return extraEvent ? [...next, extraEvent] : next
    })
    setToast({ message: '日程已保存', type: 'success' })
    setEditingEvent(createEmptyEvent(selectedDate))
    setModalOpen(false)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId))
    setEditingEvent(createEmptyEvent(selectedDate))
    setContextEvent(null)
    setToast({ message: '日程已删除', type: 'success' })
  }

  const toggleEventCompleted = (eventId: string) => {
    setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, completed: !event.completed } : event)))
  }

  const openEventContextMenu = (event: ScheduleEvent, x: number, y: number) => {
    setContextEvent(event)
    setContextPosition({ x, y })
  }

  const openEventRename = (event: ScheduleEvent) => {
    setSelectedDate(event.date)
    setEditingEvent(event)
    setContextEvent(null)
    setModalOpen(true)
  }

  const startLongPress = (eventItem: ScheduleEvent, x: number, y: number) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => openEventContextMenu(eventItem, x, y), 550)
  }

  const cancelLongPress = () => {
    if (!longPressTimerRef.current) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const handleSaveCountdown = () => {
    const title = draftCountdownTitle.trim()
    if (!title) {
      setToast({ message: '请输入倒计时事项', type: 'error' })
      return
    }
    if (!draftCountdownDate) {
      setToast({ message: '请选择倒计时日期', type: 'error' })
      return
    }
    setCountdownTitle(title)
    setCountdownDate(draftCountdownDate)
    setCountdownModalOpen(false)
    setToast({ message: '倒计时已保存', type: 'success' })
  }

  return (
    <PageContainer>
      <section className="rounded-[24px] border border-family-border bg-white p-6 shadow-soft sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-family-primary">本月日历（{currentMonth + 1}月）</p>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center">
              <h1 className="text-3xl font-black text-family-text">家庭日程</h1>
              <button
                type="button"
                className="w-fit cursor-pointer rounded-full bg-family-primarySoft px-4 py-2 text-sm font-bold text-family-primary hover:bg-violet-100 active:scale-95"
                onClick={() => setCountdownModalOpen(true)}
              >
                {countdownText || '倒计时'}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-family-primary px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
            onClick={handleAddSchedule}
          >
            <Plus size={18} />
            添加日程
          </button>
        </div>

        <div className="mt-8 grid grid-cols-7 gap-2 text-center text-sm">
          {weekdays.map((day) => (
            <div key={day} className="font-semibold text-family-muted">
              {day}
            </div>
          ))}
          {calendarCells.map((cell) => {
            const hasEvents = Boolean(cell.dateKey && eventsByDate[cell.dateKey]?.length)
            const hasActiveTasks = hasEvents && cell.dateKey >= todayKey
            const isToday = cell.dateKey === todayKey
            if (!cell.dateKey) return <div key={cell.key} className="min-h-16 rounded-2xl" />

            return (
              <button
                key={cell.key}
                type="button"
                className={`min-h-20 cursor-pointer rounded-2xl border px-2 py-3 text-left transition hover:-translate-y-0.5 active:scale-95 ${
                  hasActiveTasks
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                    : isToday
                      ? 'border-family-primary bg-family-primarySoft text-family-primary'
                      : 'border-family-border bg-white text-family-text hover:bg-slate-50'
                }`}
                onClick={() => openDateModal(cell.dateKey)}
              >
                <span className="block text-center font-bold">{cell.day}</span>
                {hasEvents && (
                  <span className="mt-2 flex flex-col items-center gap-1" aria-label="当天有日程">
                    {isToday ? (
                      <Star size={18} className="text-rose-500" fill="currentColor" strokeWidth={2.2} />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
                    )}
                    <span className="text-[11px] font-semibold text-blue-600">{eventsByDate[cell.dateKey].length} 项</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-family-border bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-xl font-bold text-family-text">
          <CalendarDays size={22} />
          近期日程
        </h2>
        <div className="mt-4 grid gap-4 text-sm">
          {recentDateKeys.length > 0 ? (
            recentDateKeys.map((dateKey) => (
              <div key={dateKey} className="rounded-[22px] border border-family-border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-family-text">{formatDateLabel(dateKey)}</h3>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-family-muted">
                    {recentEventsByDate[dateKey].length} 项
                  </span>
                </div>
                <div className="grid gap-3">
                  {recentEventsByDate[dateKey].map((event) => {
                    const completed = Boolean(event.completed)
                    const isPastDay = event.date < todayKey
                    const isTodayEvent = event.date === todayKey
                    const itemClass = completed
                      ? 'border-emerald-200 bg-emerald-50'
                      : isPastDay
                        ? 'border-slate-200 bg-slate-50'
                        : isTodayEvent
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-violet-100 bg-family-primarySoft'
                    const titleClass = completed
                      ? 'text-emerald-700'
                      : isPastDay
                        ? 'text-slate-500'
                        : isTodayEvent
                          ? 'text-blue-700'
                          : 'text-family-text'
                    const metaClass = completed
                      ? 'text-emerald-600'
                      : isPastDay
                        ? 'text-slate-500'
                        : isTodayEvent
                          ? 'text-blue-600'
                          : 'text-family-muted'
                    const detailClass = metaClass

                    return (
                      <div
                        key={event.id}
                        className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center ${itemClass}`}
                        onContextMenu={(mouseEvent) => {
                          if (event.readonly) return
                          mouseEvent.preventDefault()
                          openEventContextMenu(event, mouseEvent.clientX, mouseEvent.clientY)
                        }}
                        onTouchStart={(touchEvent) => {
                          if (event.readonly) return
                          const touch = touchEvent.touches[0]
                          startLongPress(event, touch.clientX, touch.clientY)
                        }}
                        onTouchEnd={cancelLongPress}
                        onTouchMove={cancelLongPress}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 cursor-pointer text-left active:scale-[0.99]"
                          onClick={() => {
                            if (event.readonly) return
                            setSelectedDate(event.date)
                            setEditingEvent(event)
                            setModalOpen(true)
                          }}
                        >
                          <span className={`block font-bold ${titleClass}`}>
                            {event.title}
                          </span>
                          <span className={`mt-1 flex flex-wrap items-center gap-2 ${metaClass}`}>
                            <Clock size={15} />
                            {event.time}
                            {completed && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">已完成</span>
                            )}
                            {!completed && isTodayEvent && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">今日</span>
                            )}
                            {!completed && isPastDay && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">已过期</span>
                            )}
                            {event.readonly && (
                              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-600">生日提醒</span>
                            )}
                          </span>
                          {event.detail && (
                            <span className={`mt-2 block ${detailClass}`}>
                              {event.detail}
                            </span>
                          )}
                        </button>
                        {!event.readonly && (
                          <label className="flex cursor-pointer items-center justify-end gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-family-text sm:justify-center">
                            <input
                              type="checkbox"
                              checked={completed}
                              className="h-5 w-5 accent-family-primary"
                              onChange={() => toggleEventCompleted(event.id)}
                            />
                            已完成
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-4 text-family-muted">最近一周还没有日程，点上方“添加日程”安排一下吧。</p>
          )}
        </div>
      </section>

      {contextEvent && (
        <div
          className="fixed z-50 w-40 overflow-hidden rounded-2xl border border-family-border bg-white py-2 shadow-soft"
          style={{ left: contextPosition.x, top: contextPosition.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-family-text hover:bg-family-primarySoft"
            onClick={() => openEventRename(contextEvent)}
          >
            <Pencil size={16} />
            重命名
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-rose-500 hover:bg-rose-50"
            onClick={() => handleDeleteEvent(contextEvent.id)}
          >
            <Trash2 size={16} />
            删除
          </button>
        </div>
      )}

      {countdownModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/25 px-4 py-8" onMouseDown={() => setCountdownModalOpen(false)}>
          <section
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-soft sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="countdown-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-family-primary">重要日子</p>
                <h2 id="countdown-modal-title" className="mt-2 text-2xl font-black text-family-text">
                  设置倒计时
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭倒计时弹窗"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setCountdownModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                什么事
                <input
                  value={draftCountdownTitle}
                  maxLength={12}
                  placeholder="例如：生日"
                  className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text placeholder:text-slate-400"
                  onChange={(event) => setDraftCountdownTitle(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                日期
                <input
                  type="date"
                  value={draftCountdownDate}
                  className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text"
                  onChange={(event) => setDraftCountdownDate(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-xl border border-family-border px-4 py-2 text-sm font-semibold text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setCountdownModalOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl bg-family-primary px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
                onClick={handleSaveCountdown}
              >
                保存
              </button>
            </div>
          </section>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/25 px-4 py-8" onMouseDown={() => setModalOpen(false)}>
          <section
            className="w-full max-w-xl rounded-[24px] bg-white p-6 shadow-soft sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-family-primary">{formatDateLabel(selectedDate)}</p>
                <h2 id="schedule-modal-title" className="mt-2 text-2xl font-black text-family-text">
                  编辑当天事务
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭日程弹窗"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                日程标题
                <input
                  value={editingEvent.title}
                  placeholder="例如：家庭聚餐"
                  className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text placeholder:text-slate-400"
                  onChange={(event) => setEditingEvent((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                时间
                <input
                  type="time"
                  value={editingEvent.time}
                  className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text"
                  onChange={(event) => setEditingEvent((current) => ({ ...current, time: event.target.value }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                具体事务
                <textarea
                  value={editingEvent.detail}
                  placeholder="写下需要准备或提醒的事情"
                  rows={3}
                  className="resize-none rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text placeholder:text-slate-400"
                  onChange={(event) => setEditingEvent((current) => ({ ...current, detail: event.target.value }))}
                />
              </label>
            </div>

            {selectedDateEvents.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-family-text">当天已有日程</p>
                <div className="mt-3 grid gap-3">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 rounded-2xl border border-family-border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-family-text">
                          {event.time} {event.title}
                        </p>
                        {event.detail && <p className="mt-1 truncate text-sm text-family-muted">{event.detail}</p>}
                      </div>
                      <button
                        type="button"
                        aria-label="编辑这条日程"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-family-muted hover:bg-family-primarySoft hover:text-family-primary"
                        onClick={() => setEditingEvent(event)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label="删除这条日程"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-family-muted hover:bg-rose-50 hover:text-rose-500"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-xl border border-family-border px-4 py-2 text-sm font-semibold text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setModalOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl bg-family-primary px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
                onClick={handleSaveEvent}
              >
                保存日程
              </button>
            </div>
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </PageContainer>
  )
}
