import { ChevronRight, Heart, MessageCircle, Soup, Sparkles } from 'lucide-react'
import type { HarmonyTip } from '../types/member'

const iconMap = {
  message: MessageCircle,
  utensils: Soup,
  broom: Sparkles,
  heart: Heart,
}

const themeMap = {
  purple: 'bg-family-primarySoft text-family-primary',
  yellow: 'bg-yellow-50 text-amber-500',
  blue: 'bg-blue-50 text-blue-500',
  pink: 'bg-pink-50 text-pink-500',
}

type HarmonyTipCardProps = {
  tip: HarmonyTip
  onClick?: () => void
}

export function HarmonyTipCard({ tip, onClick }: HarmonyTipCardProps) {
  const Icon = iconMap[tip.icon]
  const interactive = Boolean(onClick)

  return (
    <button
      type="button"
      className={`relative rounded-[20px] border border-family-border bg-white px-5 py-8 text-center shadow-soft transition duration-200 hover:-translate-y-1 ${
        interactive ? 'cursor-pointer hover:border-family-primary' : 'cursor-default'
      }`}
      onClick={onClick}
      aria-label={interactive ? `打开${tip.title}` : undefined}
    >
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${themeMap[tip.theme]}`}>
        <Icon size={34} strokeWidth={2.4} />
      </div>
      <h3 className="mt-7 text-lg font-bold text-family-text">{tip.title}</h3>
      <p className="mt-3 text-sm leading-6 text-family-muted">{tip.description}</p>
      {interactive && (
        <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-family-primarySoft text-family-primary">
          <ChevronRight size={16} />
        </span>
      )}
    </button>
  )
}
