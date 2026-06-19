import { CheckCircle2, CircleAlert } from 'lucide-react'
import { useEffect } from 'react'

export type ToastState = {
  message: string
  type: 'success' | 'error'
} | null

type ToastProps = {
  toast: ToastState
  onClose: () => void
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onClose, 2500)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const Icon = toast.type === 'success' ? CheckCircle2 : CircleAlert

  return (
    <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-2xl border border-family-border bg-white px-5 py-3 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-semibold text-family-text">
        <Icon className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} size={18} />
        {toast.message}
      </div>
    </div>
  )
}
