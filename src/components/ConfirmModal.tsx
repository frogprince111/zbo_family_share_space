import { useEffect } from 'react'

type ConfirmModalProps = {
  open: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmModal({ open, message, onCancel, onConfirm }: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4" onMouseDown={onCancel}>
      <section
        className="w-full max-w-sm rounded-[22px] bg-white p-6 shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold text-family-text">
          确认操作
        </h2>
        <p className="mt-3 text-sm leading-6 text-family-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="cursor-pointer rounded-xl border border-family-border px-4 py-2 text-sm font-semibold text-family-muted hover:bg-slate-50 active:scale-95"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 active:scale-95"
            onClick={onConfirm}
          >
            删除
          </button>
        </div>
      </section>
    </div>
  )
}
