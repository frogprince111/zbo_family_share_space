import { ChevronRight, MessageCircleMore, Plus, UserRoundCog, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MemberPresenceMap } from '../hooks/useMemberPresence'
import type { FamilyMember } from '../types/member'
import { MemberAvatar } from './MemberAvatar'

type FamilyMembersProps = {
  members: FamilyMember[]
  memberPresence: MemberPresenceMap
  onAdd: () => void
  onEdit: (member: FamilyMember) => void
}

export function FamilyMembers({ members, memberPresence, onAdd, onEdit }: FamilyMembersProps) {
  const navigate = useNavigate()

  return (
    <section className="mt-16 rounded-[24px] border border-family-border bg-white p-6 shadow-soft sm:p-8 lg:p-10">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UsersRound className="text-family-muted" size={28} />
          <h2 className="text-2xl font-bold text-family-text">家庭成员</h2>
        </div>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-2xl border border-family-border bg-white px-4 py-3 text-sm font-semibold text-family-text shadow-sm hover:bg-family-primarySoft active:scale-95"
          onClick={() => navigate('/members')}
        >
          <UserRoundCog size={18} />
          <span className="hidden sm:inline">管理成员</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex gap-7 overflow-x-auto pb-2 sm:flex-wrap sm:justify-between md:gap-10">
        {members.map((member) => (
          <div key={member.id} className="min-w-[116px] text-center sm:min-w-[140px]">
            <MemberAvatar member={member} editable isOnline={memberPresence[member.id] ?? false} onEdit={() => onEdit(member)} />
            <p className="mt-5 text-xl font-bold text-family-text">{member.name}</p>
            <p className={`mt-2 text-sm font-semibold ${memberPresence[member.id] ? 'text-emerald-500' : 'text-slate-400'}`}>
              {memberPresence[member.id] ? '在线' : '离线'}
            </p>
          </div>
        ))}
        <button
          type="button"
          className="min-w-[116px] cursor-pointer text-center text-family-muted hover:text-family-primary active:scale-95 sm:min-w-[140px]"
          onClick={onAdd}
        >
          <span className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-family-primary sm:h-36 sm:w-36">
            <Plus size={54} />
          </span>
          <span className="mt-5 block text-lg font-semibold">添加成员</span>
        </button>
      </div>

      <button
        type="button"
        className="mt-8 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-family-primary text-base font-black text-white shadow-sm hover:bg-violet-600 active:scale-95"
        onClick={() => navigate('/chat')}
      >
        <MessageCircleMore size={22} />
        开始群聊
      </button>
    </section>
  )
}
