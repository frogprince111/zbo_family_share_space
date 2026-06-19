import { ArrowLeft, Cake, IdCard, Smartphone, UserRoundCheck } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MemberAvatar } from '../components/MemberAvatar'
import { PageContainer } from '../components/PageContainer'
import { useOnlineVisitors } from '../hooks/useOnlineVisitors'
import type { FamilyMember } from '../types/member'

function formatBirthday(value?: string) {
  if (!value) return '暂未设置'
  const [, month, day] = value.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export default function MembersPage() {
  const navigate = useNavigate()
  const onlineVisitors = useOnlineVisitors()

  const onlineMembers = useMemo(
    () =>
      onlineVisitors.visitors.map<FamilyMember>((visitor) => ({
        id: visitor.id,
        name: visitor.name,
        role: visitor.role || visitor.device,
        birthday: visitor.birthday,
        avatar: visitor.avatar,
        themeColor: visitor.themeColor,
        createdAt: visitor.lastSeenAt,
      })),
    [onlineVisitors.visitors],
  )

  return (
    <PageContainer>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2 rounded-2xl border border-family-border bg-white px-4 py-3 text-sm font-semibold text-family-text shadow-sm hover:bg-slate-50 active:scale-95"
        onClick={() => navigate('/home')}
      >
        <ArrowLeft size={18} />
        返回
      </button>

      <section className="mt-8 rounded-[24px] border border-family-border bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-family-primary">实时在线资料</p>
            <h1 className="mt-2 text-3xl font-black text-family-text">成员信息</h1>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-500">
            {onlineMembers.length} 位在线
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {onlineMembers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-family-border bg-family-bg px-4 py-12 text-center text-sm font-bold text-family-muted sm:col-span-2 xl:col-span-3">
              暂无在线成员，打开首页后会自动显示成员资料
            </div>
          ) : (
            onlineMembers.map((member) => {
              const isMe = member.id === onlineVisitors.currentVisitorId
              return (
                <article key={member.id} className="rounded-3xl border border-family-border bg-family-bg p-5">
                  <div className="flex items-center gap-4">
                    <MemberAvatar member={member} size="md" showStatusDot={false} isOnline />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-black text-family-text">
                        {member.name}
                        {isMe ? <span className="ml-2 rounded-full bg-family-primarySoft px-2 py-1 text-xs text-family-primary">我</span> : null}
                      </h2>
                      <p className="mt-1 flex items-center gap-1 text-sm font-bold text-emerald-500">
                        <UserRoundCheck size={16} />
                        在线
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm font-bold text-family-text">
                    <p className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3">
                      <IdCard size={18} className="text-family-primary" />
                      角色：{member.role || '家庭成员'}
                    </p>
                    <p className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3">
                      <Cake size={18} className="text-pink-500" />
                      生日：{formatBirthday(member.birthday)}
                    </p>
                    <p className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-family-muted">
                      <Smartphone size={18} className="text-blue-500" />
                      来源：实时在线成员
                    </p>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>
    </PageContainer>
  )
}
