import { ChevronDown, Heart, HousePlus, MapPin, Moon, Settings, Sun, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'

type HeaderProps = {
  spaceName: string
  address: string
  onLocateAddress?: () => void
  locatingAddress?: boolean
  soundEnabled?: boolean
  onToggleSound?: () => void
  themeMode?: 'day' | 'night'
  onToggleTheme?: () => void
}

export function Header({
  spaceName,
  address,
  onLocateAddress,
  locatingAddress = false,
  soundEnabled = true,
  onToggleSound,
  themeMode = 'day',
  onToggleTheme,
}: HeaderProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menuOpen])

  return (
    <header className="relative rounded-[28px] bg-white/45 p-3 shadow-[0_16px_42px_rgba(45,90,115,0.08)] sm:p-0 sm:shadow-none">
      <div ref={menuRef} className="absolute right-3 top-3 z-20 sm:right-0 sm:top-0">
        <button
          type="button"
          aria-label={menuOpen ? '收起功能菜单' : '展开功能菜单'}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/85 text-slate-600 shadow-sm ring-1 ring-white/80 active:scale-95 hover:text-family-primary"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <ChevronDown size={24} className={`transition ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 flex items-center gap-2 rounded-[22px] border border-white/70 bg-white/95 p-2 shadow-soft">
            <NotificationBell />
            <button
              type="button"
              aria-label={soundEnabled ? '关闭提示音' : '开启提示音'}
              title={soundEnabled ? '关闭提示音' : '开启提示音'}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full active:scale-95 ${
                soundEnabled ? 'text-slate-600 hover:bg-family-primarySoft hover:text-family-primary' : 'bg-slate-100 text-slate-400 hover:text-family-primary'
              }`}
              onClick={onToggleSound}
            >
              {soundEnabled ? <Volume2 size={25} /> : <VolumeX size={25} />}
            </button>
            <button
              type="button"
              aria-label={themeMode === 'day' ? '切换黑夜模式' : '切换白天模式'}
              title={themeMode === 'day' ? '切换黑夜模式' : '切换白天模式'}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cyan-50 text-cyan-600 active:scale-95 hover:bg-family-primarySoft hover:text-family-primary"
              onClick={onToggleTheme}
            >
              {themeMode === 'day' ? <Sun size={25} /> : <Moon size={25} />}
            </button>
            <button
              type="button"
              aria-label="打开设置"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-family-primarySoft hover:text-family-primary active:scale-95"
              onClick={() => navigate('/settings')}
            >
              <Settings size={27} />
            </button>
          </div>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-3 pr-12 sm:flex sm:gap-6 sm:pr-14">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-family-primary sm:h-20 sm:w-20">
          <HousePlus size={50} strokeWidth={2.3} className="sm:h-[70px] sm:w-[70px]" />
          <Heart className="absolute bottom-3 left-1/2 -translate-x-1/2 text-family-primary sm:bottom-4" size={16} fill="white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-black leading-tight tracking-normal text-family-text sm:text-5xl">{spaceName || '家庭共享空间'}</h1>
          <p className="mt-2 truncate text-base text-family-muted sm:mt-3 sm:text-xl">一起管理家庭生活，让爱更有序</p>
          <button
            type="button"
            className="mt-3 flex max-w-full cursor-pointer items-center gap-2 rounded-full text-left text-sm font-medium leading-6 text-family-muted transition hover:text-family-primary active:scale-[0.99] sm:max-w-xl sm:text-base"
            onClick={onLocateAddress}
            disabled={!onLocateAddress || locatingAddress}
            title="点击重新定位家庭住址"
          >
            <MapPin size={18} className="shrink-0 text-family-primary" />
            <span className="truncate">家庭住址：{locatingAddress ? '定位中...' : address || '未设置'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
