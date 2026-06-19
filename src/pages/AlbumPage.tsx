import { ArrowLeft, Camera, Download, FolderPlus, ImagePlus, Pencil, Trash2, Upload, X } from 'lucide-react'
import type { ChangeEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { PageContainer } from '../components/PageContainer'
import { Toast, type ToastState } from '../components/Toast'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { fileToBase64 } from '../utils/avatar'

type AlbumFolder = {
  id: string
  name: string
  cover?: string
  createdAt: string
}

type AlbumPhoto = {
  id: string
  name: string
  src: string
  folderId: string
  createdAt: string
}

const defaultFolders: AlbumFolder[] = [
  { id: 'default', name: '默认相册', createdAt: '2026-01-01T00:00:00.000Z' },
]

const folderColors = ['#FDECF1', '#EAF4FF', '#FFF5DA', '#F1EFFF', '#EAF8EE', '#FFF0E5']
const oldDefaultFolderIds = ['living-room', 'birthday', 'weekend', 'travel']
const minPreviewScale = 0.6
const maxPreviewScale = 4

function validatePhotoFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return '不支持该图片格式'
  if (file.size > 5 * 1024 * 1024) return '图片大小不能超过 5MB'
  return ''
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getPointerDistance(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return 0
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
}

export default function AlbumPage() {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [folders, setFolders] = useLocalStorage<AlbumFolder[]>('family-album-folders', defaultFolders)
  const [photos, setPhotos] = useLocalStorage<AlbumPhoto[]>('family-album-photos', [])
  const [toast, setToast] = useState<ToastState>(null)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<AlbumFolder | null>(null)
  const [folderName, setFolderName] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [selectedUploadFolderId, setSelectedUploadFolderId] = useState(defaultFolders[0].id)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [contextFolder, setContextFolder] = useState<AlbumFolder | null>(null)
  const [contextPhoto, setContextPhoto] = useState<AlbumPhoto | null>(null)
  const [contextPosition, setContextPosition] = useState({ x: 0, y: 0 })
  const [editingPhoto, setEditingPhoto] = useState<AlbumPhoto | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<AlbumPhoto | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 })
  const [previewDragging, setPreviewDragging] = useState(false)
  const [photoName, setPhotoName] = useState('')
  const longPressTimerRef = useRef<number | null>(null)
  const previewPointersRef = useRef(new Map<number, { x: number; y: number }>())
  const previewDragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const previewPinchRef = useRef<{ distance: number; scale: number } | null>(null)

  useEffect(() => {
    setFolders((current) => {
      const customFolders = current.filter((folder) => !oldDefaultFolderIds.includes(folder.id) && folder.id !== 'default')
      return [current.find((folder) => folder.id === 'default') ?? defaultFolders[0], ...customFolders]
    })
  }, [setFolders])

  useEffect(() => {
    setPhotos((current) =>
      current.map((photo) => (photo.folderId ? photo : { ...photo, folderId: defaultFolders[0].id })),
    )
  }, [setPhotos])

  useEffect(() => {
    if (folders.length === 0) {
      setFolders(defaultFolders)
      setSelectedUploadFolderId(defaultFolders[0].id)
      return
    }
    if (!folders.some((folder) => folder.id === selectedUploadFolderId)) {
      setSelectedUploadFolderId(folders[0].id)
    }
  }, [folders, selectedUploadFolderId, setFolders])

  useEffect(() => {
    const closeMenu = () => {
      setContextFolder(null)
      setContextPhoto(null)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  useEffect(() => {
    if (!folderModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFolderModalOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [folderModalOpen])

  useEffect(() => {
    if (!previewPhoto) return
    setPreviewScale(1)
    setPreviewOffset({ x: 0, y: 0 })
    setPreviewDragging(false)
    previewPointersRef.current.clear()
    previewPinchRef.current = null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewPhoto(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [previewPhoto])

  const openFolderModal = (folder?: AlbumFolder) => {
    setEditingFolder(folder ?? null)
    setFolderName(folder?.name ?? '')
    setCoverPreview(folder?.cover ?? '')
    setFolderModalOpen(true)
  }

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const uploadedPhotos: AlbumPhoto[] = []
    for (const file of files) {
      const error = validatePhotoFile(file)
      if (error) {
        setToast({ message: error, type: 'error' })
        continue
      }
      const src = await fileToBase64(file)
      uploadedPhotos.push({
        id: crypto.randomUUID(),
        name: file.name,
        src,
        folderId: selectedUploadFolderId,
        createdAt: new Date().toISOString(),
      })
    }

    if (uploadedPhotos.length > 0) {
      setPhotos((current) => [...uploadedPhotos, ...current])
      setToast({ message: `已上传 ${uploadedPhotos.length} 张照片`, type: 'success' })
    }
  }

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const error = validatePhotoFile(file)
    if (error) {
      setToast({ message: error, type: 'error' })
      return
    }
    const src = await fileToBase64(file)
    setCoverPreview(src)
  }

  const handleSaveFolder = () => {
    const name = folderName.trim()
    if (!name) {
      setToast({ message: '请输入文件夹名称', type: 'error' })
      return
    }

    if (editingFolder) {
      setFolders((current) => current.map((folder) => (folder.id === editingFolder.id ? { ...folder, name, cover: coverPreview } : folder)))
      setToast({ message: '文件夹已保存', type: 'success' })
    } else {
      setFolders((current) => [
        ...current,
        { id: crypto.randomUUID(), name, cover: coverPreview, createdAt: new Date().toISOString() },
      ])
      setToast({ message: '文件夹已添加', type: 'success' })
    }
    setFolderModalOpen(false)
  }

  const handleDeleteFolder = (folder: AlbumFolder) => {
    if (folders.length <= 1) {
      setToast({ message: '至少保留一个文件夹', type: 'error' })
      return
    }
    if (!window.confirm('确定要删除这个文件夹吗？')) return
    setFolders((current) => current.filter((item) => item.id !== folder.id))
    setPhotos((current) => current.map((photo) => (photo.folderId === folder.id ? { ...photo, folderId: defaultFolders[0].id } : photo)))
    setToast({ message: '文件夹已删除', type: 'success' })
  }

  const movePhotoToFolder = (photoId: string, folderId: string) => {
    const folder = folders.find((item) => item.id === folderId)
    setPhotos((current) => current.map((photo) => (photo.id === photoId ? { ...photo, folderId } : photo)))
    setToast({ message: `已放入${folder?.name ?? '文件夹'}`, type: 'success' })
  }

  const openContextMenu = (folder: AlbumFolder, x: number, y: number) => {
    setContextFolder(folder)
    setContextPhoto(null)
    setContextPosition({ x, y })
  }

  const openPhotoContextMenu = (photo: AlbumPhoto, x: number, y: number) => {
    setContextPhoto(photo)
    setContextFolder(null)
    setContextPosition({ x, y })
  }

  const startLongPress = (folder: AlbumFolder, x: number, y: number) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => openContextMenu(folder, x, y), 550)
  }

  const startPhotoLongPress = (photo: AlbumPhoto, x: number, y: number) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => openPhotoContextMenu(photo, x, y), 550)
  }

  const cancelLongPress = () => {
    if (!longPressTimerRef.current) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? null
  const visiblePhotos = activeFolderId ? photos.filter((photo) => photo.folderId === activeFolderId) : photos.slice(0, 8)

  const openPhotoRename = (photo: AlbumPhoto) => {
    setEditingPhoto(photo)
    setPhotoName(photo.name)
    setContextPhoto(null)
  }

  const handleSavePhotoName = () => {
    if (!editingPhoto) return
    const name = photoName.trim()
    if (!name) {
      setToast({ message: '请输入照片名称', type: 'error' })
      return
    }
    setPhotos((current) => current.map((photo) => (photo.id === editingPhoto.id ? { ...photo, name } : photo)))
    setEditingPhoto(null)
    setToast({ message: '照片已重命名', type: 'success' })
  }

  const handleDeletePhoto = (photo: AlbumPhoto) => {
    if (!window.confirm('确定要删除这张照片吗？')) return
    setPhotos((current) => current.filter((item) => item.id !== photo.id))
    setContextPhoto(null)
    setToast({ message: '照片已删除', type: 'success' })
  }

  const downloadPhoto = (photo: AlbumPhoto) => {
    const link = document.createElement('a')
    link.href = photo.src
    link.download = photo.name || 'family-photo'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setContextPhoto(null)
    setToast({ message: '已开始保存照片', type: 'success' })
  }

  const handlePreviewWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    setPreviewScale((current) => clamp(current + direction * 0.18, minPreviewScale, maxPreviewScale))
  }

  const handlePreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    previewPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = Array.from(previewPointersRef.current.values())

    if (points.length >= 2) {
      previewPinchRef.current = { distance: getPointerDistance(points), scale: previewScale }
      setPreviewDragging(false)
      return
    }

    previewDragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: previewOffset.x,
      offsetY: previewOffset.y,
    }
    setPreviewDragging(true)
  }

  const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!previewPointersRef.current.has(event.pointerId)) return
    event.preventDefault()
    previewPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = Array.from(previewPointersRef.current.values())

    if (points.length >= 2 && previewPinchRef.current) {
      const distance = getPointerDistance(points)
      const nextScale = previewPinchRef.current.scale * (distance / Math.max(previewPinchRef.current.distance, 1))
      setPreviewScale(clamp(nextScale, minPreviewScale, maxPreviewScale))
      return
    }

    if (previewDragging) {
      setPreviewOffset({
        x: previewDragStartRef.current.offsetX + event.clientX - previewDragStartRef.current.x,
        y: previewDragStartRef.current.offsetY + event.clientY - previewDragStartRef.current.y,
      })
    }
  }

  const handlePreviewPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    previewPointersRef.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const points = Array.from(previewPointersRef.current.values())

    if (points.length >= 2) {
      previewPinchRef.current = { distance: getPointerDistance(points), scale: previewScale }
      return
    }
    previewPinchRef.current = null

    if (points.length === 1) {
      previewDragStartRef.current = {
        x: points[0].x,
        y: points[0].y,
        offsetX: previewOffset.x,
        offsetY: previewOffset.y,
      }
      setPreviewDragging(true)
      return
    }
    setPreviewDragging(false)
  }

  return (
    <PageContainer>
      <section className="rounded-[24px] border border-family-border bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-family-text">家庭相册</h1>
          <div className="flex gap-3">
            <select
              value={selectedUploadFolderId}
              className="hidden rounded-2xl border border-family-border bg-white px-3 py-3 text-sm font-semibold text-family-text sm:block"
              aria-label="选择照片文件夹"
              onChange={(event) => setSelectedUploadFolderId(event.target.value)}
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  上传到：{folder.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-2xl border border-family-border bg-white px-4 py-3 text-sm font-semibold text-family-text shadow-sm hover:bg-slate-50 active:scale-95"
              onClick={() => openFolderModal()}
            >
              <FolderPlus size={18} />
              新建文件夹
            </button>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-2xl bg-family-primary px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
              onClick={() => photoInputRef.current?.click()}
            >
              <Upload size={18} />
              上传照片
            </button>
          </div>
          <input
            ref={photoInputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handlePhotoUpload}
          />
        </div>

        {activeFolder && (
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-family-muted hover:text-family-primary"
              onClick={() => setActiveFolderId(null)}
            >
              <ArrowLeft size={18} />
              返回相册
            </button>
            <span className="text-sm font-bold text-family-text">{activeFolder.name}</span>
          </div>
        )}

        {!activeFolder && (
          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
            {folders.map((folder, index) => (
              <button
                type="button"
                key={folder.id}
                className={`group relative aspect-square overflow-hidden rounded-[20px] border bg-family-primarySoft text-left shadow-sm transition ${
                  dragOverFolderId === folder.id ? 'border-family-primary ring-4 ring-violet-100' : 'border-family-border'
                }`}
                onClick={() => setActiveFolderId(folder.id)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  openContextMenu(folder, event.clientX, event.clientY)
                }}
                onDragEnter={() => setDragOverFolderId(folder.id)}
                onDragLeave={() => setDragOverFolderId(null)}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDragOverFolderId(folder.id)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOverFolderId(null)
                  const photoId = event.dataTransfer.getData('text/plain')
                  if (photoId) movePhotoToFolder(photoId, folder.id)
                }}
                onTouchStart={(event) => {
                  const touch = event.touches[0]
                  startLongPress(folder, touch.clientX, touch.clientY)
                }}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
              >
                {folder.cover ? (
                  <img src={folder.cover} alt={`${folder.name}封面`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-end p-4 text-sm font-bold text-family-text" style={{ background: folderColors[index % folderColors.length] }}>
                    <Camera className="absolute left-4 top-4 text-family-primary" size={26} />
                    {folder.name}
                  </div>
                )}
                {folder.cover && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/55 to-transparent p-4 text-sm font-bold text-white">{folder.name}</div>}
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-family-muted shadow-sm">
                  {photos.filter((photo) => photo.folderId === folder.id).length} 张
                </span>
                {dragOverFolderId === folder.id && (
                  <span className="absolute inset-3 flex items-center justify-center rounded-2xl bg-white/80 text-sm font-bold text-family-primary">
                    松手放入
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              className="aspect-square rounded-[20px] border-2 border-dashed border-family-border bg-slate-50 text-family-muted hover:border-family-primary hover:text-family-primary active:scale-95"
              onClick={() => openFolderModal()}
            >
              <FolderPlus className="mx-auto" size={30} />
              <span className="mt-3 block text-sm font-semibold">添加文件夹</span>
            </button>
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-family-text">{activeFolder ? `${activeFolder.name}的照片` : '最近上传'}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {visiblePhotos.length > 0 ? (
              visiblePhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-[18px] border border-family-border bg-slate-50"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', photo.id)}
                  onClick={() => setPreviewPhoto(photo)}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    openPhotoContextMenu(photo, event.clientX, event.clientY)
                  }}
                  onTouchStart={(event) => {
                    const touch = event.touches[0]
                    startPhotoLongPress(photo, touch.clientX, touch.clientY)
                  }}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  <img src={photo.src} alt={photo.name} className="h-full w-full object-cover" />
                </div>
              ))
            ) : !activeFolder ? (
              <div className="col-span-full rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-family-muted">
                快来记录幸福时刻吧。
              </div>
            ) : null}
            {activeFolder && (
              <button
                type="button"
                className="aspect-square rounded-[18px] border-2 border-dashed border-family-border bg-slate-50 text-family-muted hover:border-family-primary hover:text-family-primary active:scale-95"
                onClick={() => {
                  setSelectedUploadFolderId(activeFolder.id)
                  photoInputRef.current?.click()
                }}
              >
                <ImagePlus className="mx-auto" size={34} />
                <span className="mt-3 block text-sm font-semibold">添加照片</span>
              </button>
            )}
          </div>
        </section>
      </section>

      {contextFolder && (
        <div
          className="fixed z-50 w-40 overflow-hidden rounded-2xl border border-family-border bg-white py-2 shadow-soft"
          style={{ left: contextPosition.x, top: contextPosition.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-family-text hover:bg-family-primarySoft"
            onClick={() => {
              setSelectedUploadFolderId(contextFolder.id)
              setContextFolder(null)
              photoInputRef.current?.click()
            }}
          >
            <Upload size={16} />
            添加照片
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-family-text hover:bg-family-primarySoft"
            onClick={() => {
              openFolderModal(contextFolder)
              setContextFolder(null)
            }}
          >
            <Pencil size={16} />
            重命名
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-rose-500 hover:bg-rose-50"
            onClick={() => {
              handleDeleteFolder(contextFolder)
              setContextFolder(null)
            }}
          >
            <Trash2 size={16} />
            删除
          </button>
        </div>
      )}

      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8" onClick={() => setPreviewPhoto(null)}>
          <section
            className="flex max-h-full max-w-5xl items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="查看原图"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`relative inline-block max-h-[82vh] max-w-[92vw] overflow-hidden rounded-2xl leading-none shadow-soft ${
                previewDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'none' }}
              onWheel={handlePreviewWheel}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
              onDoubleClick={() => {
                setPreviewScale(1)
                setPreviewOffset({ x: 0, y: 0 })
              }}
            >
              <img
                src={previewPhoto.src}
                alt={previewPhoto.name}
                draggable={false}
                className="block h-auto w-auto max-h-[82vh] max-w-[92vw] select-none object-contain"
                style={{
                  transform: `translate(${previewOffset.x}px, ${previewOffset.y}px) scale(${previewScale})`,
                  transformOrigin: 'center center',
                }}
              />
              <button
                type="button"
                aria-label="关闭原图预览"
                className="absolute right-3 top-3 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-950/75 text-white shadow-soft ring-1 ring-white/70 backdrop-blur hover:bg-slate-950 active:scale-95"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  setPreviewPhoto(null)
                }}
              >
                <X size={24} strokeWidth={2.6} />
              </button>
            </div>
          </section>
        </div>
      )}

      {contextPhoto && (
        <div
          className="fixed z-50 w-40 overflow-hidden rounded-2xl border border-family-border bg-white py-2 shadow-soft"
          style={{ left: contextPosition.x, top: contextPosition.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-family-text hover:bg-family-primarySoft"
            onClick={() => openPhotoRename(contextPhoto)}
          >
            <Pencil size={16} />
            编辑名称
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-family-text hover:bg-family-primarySoft"
            onClick={() => downloadPhoto(contextPhoto)}
          >
            <Download size={16} />
            保存到本地
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-rose-500 hover:bg-rose-50"
            onClick={() => handleDeletePhoto(contextPhoto)}
          >
            <Trash2 size={16} />
            删除
          </button>
        </div>
      )}

      {editingPhoto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/25 px-4 py-8" onMouseDown={() => setEditingPhoto(null)}>
          <section
            className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-rename-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="photo-rename-title" className="text-xl font-black text-family-text">
              编辑照片名称
            </h2>
            <input
              value={photoName}
              maxLength={30}
              className="mt-5 w-full rounded-2xl border border-family-border px-4 py-3 text-family-text"
              onChange={(event) => setPhotoName(event.target.value)}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-xl border border-family-border px-4 py-2 text-sm font-semibold text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setEditingPhoto(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl bg-family-primary px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
                onClick={handleSavePhotoName}
              >
                保存
              </button>
            </div>
          </section>
        </div>
      )}

      {folderModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/25 px-4 py-8" onMouseDown={() => setFolderModalOpen(false)}>
          <section
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-soft sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="album-folder-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-family-primary">相册文件夹</p>
                <h2 id="album-folder-title" className="mt-2 text-2xl font-black text-family-text">
                  {editingFolder ? '编辑文件夹' : '新建文件夹'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭文件夹弹窗"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setFolderModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                文件夹名称
                <input
                  value={folderName}
                  maxLength={14}
                  placeholder="例如：宝宝成长"
                  className="rounded-2xl border border-family-border px-4 py-3 font-normal text-family-text placeholder:text-slate-400"
                  onChange={(event) => setFolderName(event.target.value)}
                />
              </label>
              <div>
                <p className="text-sm font-semibold text-family-text">自定义封面</p>
                <button
                  type="button"
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-family-border bg-slate-50 px-4 py-6 text-sm font-semibold text-family-muted hover:border-family-primary hover:text-family-primary"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="封面预览" className="h-28 w-28 rounded-2xl object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={22} />
                      上传文件夹封面
                    </>
                  )}
                </button>
                <input
                  ref={coverInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleCoverUpload}
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-xl border border-family-border px-4 py-2 text-sm font-semibold text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setFolderModalOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl bg-family-primary px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
                onClick={handleSaveFolder}
              >
                保存
              </button>
            </div>
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </PageContainer>
  )
}
