import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../components/ConfirmModal'
import { MemberAvatar } from '../components/MemberAvatar'
import { MemberFormModal } from '../components/MemberFormModal'
import { PageContainer } from '../components/PageContainer'
import { Toast, type ToastState } from '../components/Toast'
import type { MemberPresenceMap } from '../hooks/useMemberPresence'
import type { FamilyMember } from '../types/member'

type MembersPageProps = {
  members: FamilyMember[]
  setMembers: Dispatch<SetStateAction<FamilyMember[]>>
  memberPresence: MemberPresenceMap
}

export default function MembersPage({ members, setMembers, memberPresence }: MembersPageProps) {
  const navigate = useNavigate()
  const [toast, setToast] = useState<ToastState>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [pendingDelete, setPendingDelete] = useState<FamilyMember | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  const moveMember = (id: string, direction: -1 | 1) => {
    setMembers((current) => {
      const index = current.findIndex((item) => item.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const handleSave = (member: FamilyMember) => {
    setMembers((current) => {
      const exists = current.some((item) => item.id === member.id)
      return exists ? current.map((item) => (item.id === member.id ? member : item)) : [...current, member]
    })
    setFormOpen(false)
    setEditingMember(null)
    showToast(editingMember ? '家庭成员修改成功' : '家庭成员添加成功')
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    setMembers((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setFormOpen(false)
    setEditingMember(null)
    showToast('家庭成员已删除')
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-2xl border border-family-border bg-white px-4 py-3 text-sm font-semibold text-family-text shadow-sm hover:bg-slate-50 active:scale-95"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={18} />
          返回
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-2xl bg-family-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-600 active:scale-95"
          onClick={() => {
            setEditingMember(null)
            setFormOpen(true)
          }}
        >
          <Plus size={18} />
          添加成员
        </button>
      </div>

      <section className="mt-8 rounded-[24px] border border-family-border bg-white p-6 shadow-soft sm:p-8">
        <h1 className="text-3xl font-black text-family-text">成员管理</h1>
        <div className="mt-6 grid gap-4">
          {members.map((member, index) => (
            <article key={member.id} className="flex flex-wrap items-center gap-4 rounded-[20px] border border-family-border p-4">
              <MemberAvatar member={member} size="md" isOnline={memberPresence[member.id] ?? false} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-family-text">{member.name}</h2>
                <p className="mt-1 text-sm text-family-muted">{member.role}</p>
                <p className={`mt-1 text-xs font-semibold ${memberPresence[member.id] ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {memberPresence[member.id] ? '在线' : '离线'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="上移成员"
                  disabled={index === 0}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-family-border text-family-muted hover:text-family-primary disabled:cursor-not-allowed disabled:opacity-35"
                  onClick={() => moveMember(member.id, -1)}
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  type="button"
                  aria-label="下移成员"
                  disabled={index === members.length - 1}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-family-border text-family-muted hover:text-family-primary disabled:cursor-not-allowed disabled:opacity-35"
                  onClick={() => moveMember(member.id, 1)}
                >
                  <ArrowDown size={18} />
                </button>
                <button
                  type="button"
                  aria-label="编辑成员"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-family-border text-family-muted hover:text-family-primary"
                  onClick={() => {
                    setEditingMember(member)
                    setFormOpen(true)
                  }}
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  aria-label="删除成员"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-family-border text-family-muted hover:text-rose-500"
                  onClick={() => setPendingDelete(member)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MemberFormModal
        open={formOpen}
        member={editingMember}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        onDelete={setPendingDelete}
        onError={(message) => showToast(message, 'error')}
      />
      <ConfirmModal
        open={Boolean(pendingDelete)}
        message="确定要删除这位家庭成员吗？"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </PageContainer>
  )
}
