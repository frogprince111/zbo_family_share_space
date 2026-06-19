import { Camera, Check, X } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { fileToBase64, getInitial, validateAvatarFile } from '../utils/avatar'

type EditOnlineNameModalProps = {
  open: boolean
  name: string
  avatar?: string
  onClose: () => void
  onSave: (profile: { name: string; avatar?: string }) => void
  onError: (message: string) => void
}

export function EditOnlineNameModal({ open, name, avatar, onClose, onSave, onError }: EditOnlineNameModalProps) {
  const [draftName, setDraftName] = useState(name)
  const [draftAvatar, setDraftAvatar] = useState(avatar ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDraftName(name)
    setDraftAvatar(avatar ?? '')
  }, [avatar, name, open])

  if (!open) return null

  const handleSave = () => {
    const nextName = draftName.trim()
    if (!nextName) {
      onError('请输入在线名称')
      return
    }
    onSave({ name: nextName, avatar: draftAvatar })
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const error = validateAvatarFile(file)
    if (error) {
      onError(error)
      return
    }
    try {
      setDraftAvatar(await fileToBase64(file))
    } catch {
      onError('头像读取失败')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/25 px-4 pb-4 sm:items-center sm:pb-0" onMouseDown={onClose}>
      <section
        className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="online-name-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="online-name-title" className="text-xl font-black text-family-text">
            编辑在线名称
          </h2>
          <button
            type="button"
            aria-label="关闭弹窗"
            className="flex h-9 w-9 items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <button type="button" className="group relative" onClick={() => fileInputRef.current?.click()}>
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-family-primarySoft text-3xl font-black text-family-primary ring-4 ring-family-primary/20">
              {draftAvatar ? <img src={draftAvatar} alt="头像预览" className="h-full w-full object-cover" /> : getInitial(draftName)}
            </div>
            <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-family-primary text-white shadow-sm group-active:scale-95">
              <Camera size={17} />
            </span>
            <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleAvatarChange} />
          </button>
        </div>

        <label className="mt-6 grid gap-2 text-sm font-bold text-family-text">
          名称
          <input
            value={draftName}
            maxLength={10}
            placeholder="请输入你的名称"
            className="min-h-12 rounded-2xl border border-family-border px-4 text-base font-bold text-family-text placeholder:text-slate-400 focus:border-family-primary"
            onChange={(event) => setDraftName(event.target.value)}
            autoFocus
          />
        </label>

        <button
          type="button"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-family-primary text-base font-black text-white active:scale-95"
          onClick={handleSave}
        >
          <Check size={19} />
          保存并同步
        </button>
      </section>
    </div>
  )
}
