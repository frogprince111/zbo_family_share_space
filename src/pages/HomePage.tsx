import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { ChoreDiceModal } from '../components/ChoreDiceModal'
import { EditOnlineNameModal } from '../components/EditOnlineNameModal'
import { FamilyActivityModal } from '../components/FamilyActivityModal'
import { FamilyMembers } from '../components/FamilyMembers'
import { HarmonyTips } from '../components/HarmonyTips'
import { Header } from '../components/Header'
import { MemberFormModal } from '../components/MemberFormModal'
import { PageContainer } from '../components/PageContainer'
import { Toast, type ToastState } from '../components/Toast'
import type { ActivityEvent } from '../hooks/useFamilyActivities'
import { useFamilyActivities } from '../hooks/useFamilyActivities'
import { useChatUnread } from '../hooks/useChatUnread'
import type { MemberPresenceMap } from '../hooks/useMemberPresence'
import { useOnlineVisitors } from '../hooks/useOnlineVisitors'
import { useRealtimeChat } from '../hooks/useRealtimeChat'
import { useSoundSetting } from '../hooks/useSoundSetting'
import { locateReadableAddress } from '../services/location'
import { addNotification } from '../services/notifications'
import type { FamilyMember, FamilyProfile } from '../types/member'

type HomePageProps = {
  members: FamilyMember[]
  setMembers: Dispatch<SetStateAction<FamilyMember[]>>
  memberPresence: MemberPresenceMap
  familyProfile: FamilyProfile
  setFamilyProfile: Dispatch<SetStateAction<FamilyProfile>>
}

export default function HomePage({ setMembers, familyProfile, setFamilyProfile }: HomePageProps) {
  const [toast, setToast] = useState<ToastState>(null)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<FamilyMember | null>(null)
  const [choreDiceOpen, setChoreDiceOpen] = useState(false)
  const [onlineNameOpen, setOnlineNameOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [locatingAddress, setLocatingAddress] = useState(false)
  const onlineVisitors = useOnlineVisitors()
  const realtimeChat = useRealtimeChat()
  const soundSetting = useSoundSetting()
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])
  const chatUnread = useChatUnread({
    messages: realtimeChat.messages,
    currentMemberId: onlineVisitors.currentVisitorId,
    soundEnabled: soundSetting.enabled,
    onIncomingMessage: (message) => {
      addNotification('主页', message.type === 'text' ? `群聊收到新消息：${message.text ?? ''}` : '群聊收到一条新消息')
    },
  })

  const handleActivityEvent = useCallback(
    (event: ActivityEvent) => {
      if (event.event === 'created' && event.activity && event.activity.creatorId !== onlineVisitors.currentVisitorId) {
        showToast(`${event.activity.creatorName} 创建了活动：${event.activity.title}`)
      }
    },
    [onlineVisitors.currentVisitorId, showToast],
  )
  const familyActivities = useFamilyActivities(handleActivityEvent)
  const onlineMembers = onlineVisitors.visitors.map<FamilyMember>((visitor) => ({
    id: visitor.id,
    name: visitor.name,
    role: visitor.role || visitor.device,
    themeColor: visitor.themeColor,
    avatar: visitor.avatar,
    birthday: visitor.birthday,
    createdAt: visitor.lastSeenAt,
  }))
  const onlinePresence = onlineMembers.reduce<MemberPresenceMap>((next, member) => {
    next[member.id] = true
    return next
  }, {})

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

  const handleLocateAddress = async () => {
    setLocatingAddress(true)
    try {
      const located = await locateReadableAddress()
      setFamilyProfile((current) => ({ ...current, address: located.address }))
      showToast('家庭住址已更新')
      addNotification('主页', `家庭住址已更新为：${located.address}`)
    } catch (error) {
      const message = error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED ? '定位权限被拒绝' : '定位失败，请稍后重试'
      showToast(message, 'error')
    } finally {
      setLocatingAddress(false)
    }
  }

  return (
    <PageContainer>
      <Header
        spaceName={familyProfile.spaceName}
        address={familyProfile.address}
        onLocateAddress={handleLocateAddress}
        locatingAddress={locatingAddress}
        soundEnabled={soundSetting.enabled}
        onToggleSound={soundSetting.toggle}
      />
      <HarmonyTips onOpenChoreDice={() => setChoreDiceOpen(true)} onOpenActivity={() => setActivityOpen(true)} />
      <FamilyMembers
        members={onlineMembers}
        memberPresence={onlinePresence}
        showAddButton={false}
        editableMemberIds={[onlineVisitors.currentVisitorId]}
        emptyMessage={onlineVisitors.cloudEnabled ? '当前还没有在线成员' : '正在连接在线成员...'}
        onAdd={() => {
          setEditingMember(null)
          setFormOpen(true)
        }}
        onEdit={(member) => {
          if (member.id === onlineVisitors.currentVisitorId) setOnlineNameOpen(true)
        }}
        chatUnreadCount={chatUnread.unreadCount}
      />
      <EditOnlineNameModal
        open={onlineNameOpen}
        name={onlineVisitors.visitorName}
        avatar={onlineVisitors.visitorAvatar}
        role={onlineVisitors.visitorRole}
        birthday={onlineVisitors.visitorBirthday}
        onClose={() => setOnlineNameOpen(false)}
        onError={(message) => showToast(message, 'error')}
        onSave={(profile) => {
          onlineVisitors.updateVisitorName(profile.name)
          onlineVisitors.updateVisitorAvatar(profile.avatar ?? '')
          onlineVisitors.updateVisitorRole(profile.role)
          onlineVisitors.updateVisitorBirthday(profile.birthday)
          setOnlineNameOpen(false)
          showToast('在线资料已同步')
          addNotification('主页', `${profile.name} 更新了成员资料`)
        }}
      />
      <FamilyActivityModal
        open={activityOpen}
        activities={familyActivities.activities}
        currentUser={{ id: onlineVisitors.currentVisitorId, name: onlineVisitors.visitorName }}
        onClose={() => setActivityOpen(false)}
        onError={(message) => showToast(message, 'error')}
        onCreate={(activity) => {
          familyActivities.createActivity({
            ...activity,
            creatorId: onlineVisitors.currentVisitorId,
            creatorName: onlineVisitors.visitorName,
          })
          showToast('活动已创建，已通知在线成员')
          addNotification('主页', `${onlineVisitors.visitorName} 创建了家庭活动：${activity.title}`)
        }}
        onJoin={(id) => {
          familyActivities.joinActivity(id, onlineVisitors.currentVisitorId, onlineVisitors.visitorName)
          showToast('接龙成功')
          addNotification('主页', `${onlineVisitors.visitorName} 参加了家庭活动接龙`)
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
        members={onlineMembers}
        onClose={() => setChoreDiceOpen(false)}
        onEmptyMembers={() => showToast('当前没有在线成员', 'error')}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </PageContainer>
  )
}
