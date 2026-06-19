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

export function validateAvatarFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return '不支持该图片格式'
  if (file.size > 2 * 1024 * 1024) return '图片大小不能超过 2MB'
  return ''
}
