import { Camera, X } from 'lucide-react'
import type { ChangeEvent, CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { isNativeImagePickerAvailable, pickAvatar } from '../services/imagePicker'
import type { FamilyMember, ThemeColor } from '../types/member'
import { fileToBase64, getInitial, roleOptions, themeColorMap, themeOptions, validateAvatarFile } from '../utils/avatar'

type MemberFormModalProps = {
  open: boolean
  member?: FamilyMember | null
  onClose: () => void
  onSave: (member: FamilyMember) => void
  onDelete?: (member: FamilyMember) => void
  onError: (message: string) => void
}

const createEmptyMember = (): FamilyMember => ({
  id: crypto.randomUUID(),
  name: '',
  role: '',
  themeColor: 'purple',
  createdAt: new Date().toISOString(),
})

export function MemberFormModal({ open, member, onClose, onSave, onDelete, onError }: MemberFormModalProps) {
  const [form, setForm] = useState<FamilyMember>(createEmptyMember)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setForm(member ?? createEmptyMember())
  }, [member, open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const colors = themeColorMap[form.themeColor]
  const isEditing = Boolean(member)

  const handleSave = () => {
    const name = form.name.trim()
    if (!name) {
      onError('请输入成员名称')
      return
    }
    if (name.length > 10) {
      onError('成员名称最多 10 个字符')
      return
    }
    if (!form.role) {
      onError('请选择家庭角色')
      return
    }
    onSave({ ...form, name })
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
      const avatar = await fileToBase64(file)
      setForm((current) => ({ ...current, avatar }))
    } catch {
      onError('头像读取失败')
    }
  }

  const handleAvatarPick = async () => {
    if (!isNativeImagePickerAvailable()) {
      fileInputRef.current?.click()
      return
    }

    try {
      const avatar = await pickAvatar()
      if (avatar) setForm((current) => ({ ...current, avatar }))
    } catch (error) {
      onError(error instanceof Error ? error.message : '头像选择失败，请检查相机或相册权限')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/25 px-4 py-8" onMouseDown={onClose}>
      <section
        className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-soft sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="member-form-title" className="text-xl font-bold text-family-text">
            {isEditing ? '编辑家庭成员' : '添加家庭成员'}
          </h2>
          <button
            type="button"
            aria-label="关闭弹窗"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <button type="button" className="group relative cursor-pointer" onClick={handleAvatarPick}>
            <div
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-3xl font-bold ring-4"
              style={{ background: colors.bg, color: colors.text, '--tw-ring-color': colors.ring } as CSSProperties}
            >
              {form.avatar ? <img src={form.avatar} alt="头像预览" className="h-full w-full object-cover" /> : getInitial(form.name)}
            </div>
            <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-family-primary text-white shadow-sm group-hover:bg-violet-600">
              <Camera size={17} />
            </span>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarChange}
              onClick={(event) => event.stopPropagation()}
            />
          </button>
        </div>

        <div className="mt-7 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-family-text">
            成员名称
            <input
              value={form.name}
              maxLength={10}
              placeholder="请输入名称"
              className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text placeholder:text-slate-400"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-family-text">
            家庭角色
            <select
              value={form.role}
              className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text"
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="">请选择角色</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-family-text">
            成员生日
            <input
              type="date"
              value={form.birthday ?? ''}
              className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text"
              onChange={(event) => setForm((current) => ({ ...current, birthday: event.target.value }))}
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-family-text">主题颜色</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {themeOptions.map((theme) => {
                const option = themeColorMap[theme]
                const active = form.themeColor === theme
                return (
                  <button
                    key={theme}
                    type="button"
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm text-family-text hover:bg-slate-50 active:scale-95 ${
                      active ? 'border-family-primary bg-family-primarySoft' : 'border-family-border bg-white'
                    }`}
                    onClick={() => setForm((current) => ({ ...current, themeColor: theme as ThemeColor }))}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ background: option.ring }} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 active:scale-95"
              onClick={() => onDelete(form)}
            >
              删除成员
            </button>
          ) : (
            <span />
          )}
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-xl border border-family-border px-4 py-2 text-sm font-semibold text-family-muted hover:bg-slate-50 active:scale-95"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-family-primary px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
              onClick={handleSave}
            >
              {isEditing ? '保存修改' : '保存成员'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
