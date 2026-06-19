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
    <header className="relative">
      <div className="absolute right-0 top-0 z-10 flex shrink-0 gap-1.5 sm:gap-5">
        <NotificationBell />
        <button
          type="button"
          aria-label={soundEnabled ? '关闭提示音' : '开启提示音'}
          title={soundEnabled ? '关闭提示音' : '开启提示音'}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full active:scale-95 sm:h-11 sm:w-11 ${
            soundEnabled ? 'text-slate-600 hover:bg-white hover:text-family-primary' : 'bg-slate-100 text-slate-400 hover:text-family-primary'
          }`}
          onClick={onToggleSound}
        >
          {soundEnabled ? <Volume2 size={24} className="sm:h-[27px] sm:w-[27px]" /> : <VolumeX size={24} className="sm:h-[27px] sm:w-[27px]" />}
        </button>
        <button
          type="button"
          aria-label="打开设置"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-white hover:text-family-primary active:scale-95 sm:h-11 sm:w-11"
          onClick={() => navigate('/settings')}
        >
          <Settings size={25} className="sm:h-[29px] sm:w-[29px]" />
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-3 pr-32 sm:flex sm:gap-6 sm:pr-44">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-family-primary sm:h-20 sm:w-20">
          <HousePlus size={50} strokeWidth={2.3} className="sm:h-[70px] sm:w-[70px]" />
          <Heart className="absolute bottom-3 left-1/2 -translate-x-1/2 text-family-primary sm:bottom-4" size={16} fill="white" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-black tracking-normal text-family-text sm:text-5xl">{spaceName || '家庭共享空间'}</h1>
          <p className="mt-2 text-base text-family-muted sm:mt-3 sm:text-xl">一起管理家庭生活，让爱更有序</p>
          <button
            type="button"
            className="mt-3 flex max-w-full cursor-pointer items-start gap-2 rounded-full text-left text-sm font-medium leading-6 text-family-muted transition hover:text-family-primary active:scale-[0.99] sm:max-w-xl sm:items-center sm:text-base"
            onClick={onLocateAddress}
            disabled={!onLocateAddress || locatingAddress}
            title="点击重新定位家庭住址"
          >
            <MapPin size={18} className="shrink-0 text-family-primary" />
            <span className="line-clamp-2 break-words sm:truncate">家庭住址：{locatingAddress ? '定位中...' : address || '未设置'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
