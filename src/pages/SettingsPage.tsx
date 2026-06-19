import { ArrowLeft, LocateFixed, Save } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { Toast, type ToastState } from '../components/Toast'
import type { FamilyMember, FamilyProfile } from '../types/member'

type SettingsPageProps = {
  members: FamilyMember[]
  familyProfile: FamilyProfile
  setFamilyProfile: Dispatch<SetStateAction<FamilyProfile>>
}

export default function SettingsPage({ members, familyProfile, setFamilyProfile }: SettingsPageProps) {
  const navigate = useNavigate()
  const [toast, setToast] = useState<ToastState>(null)
  const [spaceName, setSpaceName] = useState(familyProfile.spaceName)
  const [address, setAddress] = useState(familyProfile.address)
  const [currentMemberId, setCurrentMemberId] = useState(familyProfile.currentMemberId)
  const [locating, setLocating] = useState(false)

  const handleSave = () => {
    setFamilyProfile({ spaceName: spaceName.trim() || '家庭共享空间', address: address.trim(), currentMemberId })
    setToast({ message: '设置已保存', type: 'success' })
    navigate('/home')
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToast({ message: '当前设备不支持定位', type: 'error' })
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6)
        const longitude = position.coords.longitude.toFixed(6)
        const accuracy = Math.round(position.coords.accuracy)
        setAddress(`当前位置：纬度 ${latitude}，经度 ${longitude}（精度约 ${accuracy} 米）`)
        setLocating(false)
        setToast({ message: '已获取真实定位', type: 'success' })
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED ? '定位权限被拒绝' : '定位失败，请稍后重试'
        setLocating(false)
        setToast({ message, type: 'error' })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

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
        <h1 className="text-3xl font-black text-family-text">设置</h1>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-family-text">
            共享空间名称
            <input
              value={spaceName}
              maxLength={16}
              placeholder="请输入共享空间名称"
              className="rounded-2xl border border-family-border bg-white px-4 py-3 font-normal text-family-text placeholder:text-slate-400"
              onChange={(event) => setSpaceName(event.target.value)}
            />
          </label>
          <label className="grid gap-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-family-text">
            家庭住址
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={address}
                placeholder="请输入家庭住址，或使用当前定位"
                className="min-w-0 flex-1 rounded-2xl border border-family-border bg-white px-4 py-3 font-normal text-family-text placeholder:text-slate-400"
                onChange={(event) => setAddress(event.target.value)}
              />
              <button
                type="button"
                disabled={locating}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-family-primary px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleUseCurrentLocation}
              >
                <LocateFixed size={18} />
                {locating ? '定位中...' : '使用当前定位'}
              </button>
            </div>
            <span className="text-xs font-normal leading-5 text-family-muted">
              浏览器会请求定位权限；当前版本保存真实经纬度，接入地图服务后可转换为详细门牌地址。
            </span>
          </label>
          <label className="grid gap-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-family-text">
            当前登录成员
            <select
              value={currentMemberId}
              className="rounded-2xl border border-family-border bg-white px-4 py-3 font-normal text-family-text"
              onChange={(event) => setCurrentMemberId(event.target.value)}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}（{member.role}）
                </option>
              ))}
            </select>
            <span className="text-xs font-normal leading-5 text-family-muted">
              这个设置代表当前设备的登录身份：该成员打开 App 时在线，进入后台或退出时离线。
            </span>
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-family-text">
            通知提醒
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-family-primary" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-family-text">
            温暖模式
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-family-primary" />
          </label>
        </div>
        <button
          className="mt-7 flex cursor-pointer items-center gap-2 rounded-2xl bg-family-primary px-5 py-3 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
          onClick={handleSave}
        >
          <Save size={18} />
          保存设置
        </button>
      </section>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </PageContainer>
  )
}
