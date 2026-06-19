import { CalendarDays, House, Image, SquareCheckBig, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: '日程', path: '/schedule', icon: CalendarDays },
  { label: '待办', path: '/todo', icon: SquareCheckBig },
  { label: '首页', path: '/home', icon: House, featured: true },
  { label: '相册', path: '/album', icon: Image },
  { label: '理财', path: '/finance', icon: WalletCards },
]

export function BottomNavigation() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-[1000] border-t border-family-border bg-white/95 shadow-[0_-10px_30px_rgba(42,47,66,0.05)] backdrop-blur">
      <div className="mx-auto grid max-w-[1200px] grid-cols-5 gap-1 px-2 py-2 sm:px-8">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 font-semibold transition ${
                  item.featured ? 'min-h-12 py-2 text-xs sm:text-base' : 'min-h-12 py-2 text-[11px] sm:text-sm'
                } ${
                  isActive ? 'bg-family-primarySoft text-family-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-family-text'
                }`
              }
            >
              <Icon size={item.featured ? 31 : 25} strokeWidth={item.featured ? 2.4 : 2.2} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
