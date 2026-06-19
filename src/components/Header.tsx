import { Heart, HousePlus, MapPin, Settings, Volume2, VolumeX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'

type HeaderProps = {
  spaceName: string
  address: string
  onLocateAddress?: () => void
  locatingAddress?: boolean
  soundEnabled?: boolean
  onToggleSound?: () => void
}

export function Header({ spaceName, address, onLocateAddress, locatingAddress = false, soundEnabled = true, onToggleSound }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="flex items-start justify-between gap-5">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-family-primary sm:h-20 sm:w-20">
          <HousePlus size={58} strokeWidth={2.3} className="sm:h-[70px] sm:w-[70px]" />
          <Heart className="absolute bottom-4 left-1/2 -translate-x-1/2 text-family-primary" size={18} fill="white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-normal text-family-text sm:text-5xl">{spaceName || '家庭共享空间'}</h1>
          <p className="mt-3 text-base text-family-muted sm:text-xl">一起管理家庭生活，让爱更有序</p>
          <button
            type="button"
            className="mt-3 flex max-w-xl cursor-pointer items-center gap-2 rounded-full text-left text-sm font-medium text-family-muted transition hover:text-family-primary active:scale-[0.99] sm:text-base"
            onClick={onLocateAddress}
            disabled={!onLocateAddress || locatingAddress}
            title="点击重新定位家庭住址"
          >
            <MapPin size={18} className="shrink-0 text-family-primary" />
            <span className="truncate">家庭住址：{locatingAddress ? '定位中...' : address || '未设置'}</span>
          </button>
        </div>
      </div>
      <div className="flex shrink-0 gap-3 pt-2 sm:gap-5">
        <NotificationBell />
        <button
          type="button"
          aria-label={soundEnabled ? '关闭提示音' : '开启提示音'}
          title={soundEnabled ? '关闭提示音' : '开启提示音'}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full active:scale-95 ${
            soundEnabled ? 'text-slate-600 hover:bg-white hover:text-family-primary' : 'bg-slate-100 text-slate-400 hover:text-family-primary'
          }`}
          onClick={onToggleSound}
        >
          {soundEnabled ? <Volume2 size={27} /> : <VolumeX size={27} />}
        </button>
        <button
          type="button"
          aria-label="打开设置"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-white hover:text-family-primary active:scale-95"
          onClick={() => navigate('/settings')}
        >
          <Settings size={29} />
        </button>
      </div>
    </header>
  )
}
