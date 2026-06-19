import type { ThemeColor } from '../types/member'

export const themeColorMap: Record<ThemeColor, { bg: string; text: string; ring: string; label: string }> = {
  pink: { bg: '#FDECF1', text: '#D94F76', ring: '#F59BB3', label: '粉色' },
  purple: { bg: '#F1EFFF', text: '#7467F0', ring: '#A795F5', label: '紫色' },
  blue: { bg: '#EAF4FF', text: '#4387D9', ring: '#84B7F4', label: '蓝色' },
  yellow: { bg: '#FFF5DA', text: '#B47A10', ring: '#F2C667', label: '黄色' },
  green: { bg: '#EAF8EE', text: '#3D9A5B', ring: '#83D49B', label: '绿色' },
  orange: { bg: '#FFF0E5', text: '#D97824', ring: '#F6A96F', label: '橙色' },
}

export const roleOptions = ['爸爸', '妈妈', '儿子', '女儿', '爷爷', '奶奶', '外公', '外婆', '其他']
export const themeOptions = Object.keys(themeColorMap) as ThemeColor[]

export function getInitial(name: string) {
  return name.trim().charAt(0) || '家'
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('头像读取失败'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = src
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number) {
  return canvas.toDataURL('image/jpeg', quality)
}

export async function compressImageFile(file: File, maxSize = 320, quality = 0.78) {
  const source = await fileToBase64(file)
  const image = await loadImage(source)
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1)
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('图片压缩失败')
  context.drawImage(image, 0, 0, width, height)
  return canvasToDataUrl(canvas, quality)
}

export async function compressDataUrl(dataUrl: string, maxSize = 320, quality = 0.78) {
  const image = await loadImage(dataUrl)
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1)
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('图片压缩失败')
  context.drawImage(image, 0, 0, width, height)
  return canvasToDataUrl(canvas, quality)
}

export function validateAvatarFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return '不支持该图片格式'
  if (file.size > 8 * 1024 * 1024) return '图片大小不能超过 8MB'
  return ''
}
