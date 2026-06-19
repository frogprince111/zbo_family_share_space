import { Heart } from 'lucide-react'
import { useMemo } from 'react'
import { harmonyTips } from '../data/harmonyTips'
import { HarmonyTipCard } from './HarmonyTipCard'

type HarmonyTipsProps = {
  onOpenChoreDice: () => void
}

export function HarmonyTips({ onOpenChoreDice }: HarmonyTipsProps) {
  const shuffledTips = useMemo(() => [...harmonyTips].sort(() => Math.random() - 0.5), [])

  return (
    <section className="mt-16">
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-family-border bg-white text-family-primary shadow-sm">
          <Heart size={31} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-family-text">家庭和谐小贴士</h2>
          <p className="mt-2 text-family-muted">用小行动，让每天更温暖</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5 lg:gap-6">
        {shuffledTips.map((tip) => (
          <HarmonyTipCard key={tip.id} tip={tip} onClick={tip.id === 'chores' ? onOpenChoreDice : undefined} />
        ))}
      </div>
    </section>
  )
}
