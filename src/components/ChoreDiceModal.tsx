import { PartyPopper, Sparkles, Star, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import type { FamilyMember } from '../types/member'
import { MemberAvatar } from './MemberAvatar'

type ChoreDiceModalProps = {
  open: boolean
  members: FamilyMember[]
  onClose: () => void
  onEmptyMembers: () => void
}

export function ChoreDiceModal({ open, members, onClose, onEmptyMembers }: ChoreDiceModalProps) {
  const [rolling, setRolling] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setRolling(false)
    setCelebrating(false)
    setSelectedMember(null)
  }, [open])

  useEffect(() => {
    if (!celebrating) return
    const timer = window.setTimeout(() => setCelebrating(false), 3000)
    return () => window.clearTimeout(timer)
  }, [celebrating])

  if (!open) return null

  const drawLuckyStar = () => {
    if (members.length === 0) {
      onEmptyMembers()
      return
    }

    setRolling(true)
    setCelebrating(false)
    setSelectedMember(null)

    let ticks = 0
    const timer = window.setInterval(() => {
      ticks += 1
      setSelectedMember(members[Math.floor(Math.random() * members.length)])

      if (ticks >= 12) {
        window.clearInterval(timer)
        const winner = members[Math.floor(Math.random() * members.length)]
        setSelectedMember(winner)
        setRolling(false)
        setCelebrating(true)
      }
    }, 90)
  }

  const confettiPieces = Array.from({ length: 14 }, (_, index) => index)

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-slate-900/25 px-4 py-6 pb-[calc(108px+env(safe-area-inset-bottom))]"
      onMouseDown={onClose}
    >
      <section
        className="max-h-[calc(100dvh-132px-env(safe-area-inset-bottom))] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-soft sm:max-h-[88vh] sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chore-dice-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-family-primary">
              <Sparkles size={17} />
              家务小决定
            </p>
            <h2 id="chore-dice-title" className="mt-2 text-2xl font-black text-family-text">
              挑选一位英雄
            </h2>
          </div>
          <button
            type="button"
            aria-label="关闭家务分配弹窗"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <button
          type="button"
          className="relative mt-7 w-full cursor-pointer overflow-hidden rounded-[22px] bg-family-primarySoft p-6 text-center transition hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-90"
          disabled={rolling}
          onClick={drawLuckyStar}
        >
          {celebrating && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <PartyPopper className="party-popper-left absolute bottom-4 left-2 text-family-primary sm:left-4" size={96} />
              <PartyPopper className="party-popper-right absolute bottom-4 right-2 text-pink-400 sm:right-4" size={96} />
              <div className="confetti-burst confetti-left">
                {confettiPieces.map((piece) => (
                  <span key={`left-${piece}`} style={{ '--piece-index': piece, '--piece-lift': piece % 5 } as CSSProperties} />
                ))}
              </div>
              <div className="confetti-burst confetti-right">
                {confettiPieces.map((piece) => (
                  <span key={`right-${piece}`} style={{ '--piece-index': piece, '--piece-lift': piece % 5 } as CSSProperties} />
                ))}
              </div>
            </div>
          )}
          <p className="text-sm font-semibold text-family-primary">今日幸运星</p>
          <p className="mt-3 min-h-[48px] text-4xl font-black text-family-text sm:text-5xl">
            {selectedMember ? selectedMember.name : '待揭晓'}
          </p>
          <div
            className={`mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-family-primary shadow-sm transition ${
              rolling ? 'scale-110' : ''
            }`}
          >
            <Star size={44} fill="currentColor" />
          </div>
          <p className="mt-4 text-sm text-family-muted">
            {rolling ? '正在抽取今天的幸运星...' : '点这里，从在线成员里挑选今天的英雄'}
          </p>
        </button>

        <div className="mt-6">
          <p className="text-sm font-semibold text-family-text">参与成员</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {members.map((member) => (
              <div key={member.id} className="min-w-16 rounded-2xl border border-family-border bg-white p-3 text-center">
                <MemberAvatar member={member} size="md" isOnline />
                <p className="mt-2 text-sm font-semibold text-family-text">{member.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 min-h-[88px] rounded-[20px] border border-family-border bg-slate-50 p-4 text-center">
          {selectedMember ? (
            <>
              <p className="text-sm text-family-muted">{rolling ? '幸运星正在闪烁...' : '今天的英雄是'}</p>
              <p className="mt-2 text-2xl font-black text-family-text">{selectedMember.name}</p>
            </>
          ) : (
            <p className="pt-5 text-sm text-family-muted">还没有抽取幸运星，先来一次吧。</p>
          )}
        </div>
      </section>
    </div>
  )
}
