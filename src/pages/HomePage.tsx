import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { ChoreDiceModal } from '../components/ChoreDiceModal'
import { FamilyMembers } from '../components/FamilyMembers'
import { HarmonyTips } from '../components/HarmonyTips'
import { Header } from '../components/Header'
import { MemberFormModal } from '../components/MemberFormModal'
import { OnlineVisitorsPanel } from '../components/OnlineVisitorsPanel'
import { PageContainer } from '../components/PageContainer'
import { Toast, type ToastState } from '../components/Toast'
import type { MemberPresenceMap } from '../hooks/useMemberPresence'
import { useOnlineVisitors } from '../hooks/useOnlineVisitors'
import type { FamilyMember, FamilyProfile } from '../types/member'

type HomePageProps = {
  members: FamilyMember[]
  setMembers: Dispatch<SetStateAction<FamilyMember[]>>
  memberPresence: MemberPresenceMap
  familyProfile: FamilyProfile
}

export default function HomePage({ members, setMembers, memberPresence, familyProfile }: HomePageProps) {
  const [toast, setToast] = useState<ToastState>(null)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<FamilyMember | null>(null)
  const [choreDiceOpen, setChoreDiceOpen] = useState(false)
  const onlineVisitors = useOnlineVisitors()

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

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
      <Header spaceName={familyProfile.spaceName} address={familyProfile.address} onNotify={() => showToast('暂无新通知')} />
      <HarmonyTips onOpenChoreDice={() => setChoreDiceOpen(true)} />
      <FamilyMembers
        members={members}
        memberPresence={memberPresence}
        onAdd={() => {
          setEditingMember(null)
          setFormOpen(true)
        }}
        onEdit={(member) => {
          setEditingMember(member)
          setFormOpen(true)
        }}
      />
      <OnlineVisitorsPanel
        visitors={onlineVisitors.visitors}
        currentVisitorId={onlineVisitors.currentVisitorId}
        visitorName={onlineVisitors.visitorName}
        cloudEnabled={onlineVisitors.cloudEnabled}
        onRename={(name) => {
          onlineVisitors.updateVisitorName(name)
          showToast('在线名称已更新')
        }}
      />
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
      <ChoreDiceModal
        open={choreDiceOpen}
        members={members}
        onClose={() => setChoreDiceOpen(false)}
        onEmptyMembers={() => showToast('请先添加家庭成员', 'error')}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </PageContainer>
  )
}
