import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { compressDataUrl } from '../utils/avatar'

const maxAvatarBytes = 250 * 1024

export function isNativeImagePickerAvailable() {
  return Capacitor.isNativePlatform()
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

async function getAvatar(source: CameraSource) {
  const photo = await Camera.getPhoto({
    source,
    resultType: CameraResultType.DataUrl,
    quality: 82,
    allowEditing: true,
    width: 1024,
    height: 1024,
    promptLabelHeader: '设置头像',
    promptLabelPhoto: '从相册选择',
    promptLabelPicture: '拍照',
    promptLabelCancel: '取消',
  })

  const dataUrl = photo.dataUrl
  if (!dataUrl) throw new Error('头像读取失败')
  const compressed = await compressDataUrl(dataUrl)
  if (estimateDataUrlBytes(compressed) > maxAvatarBytes) throw new Error('头像压缩失败，请换一张图片')
  return compressed
}

export async function pickFromGallery() {
  return getAvatar(CameraSource.Photos)
}

export async function takePhoto() {
  return getAvatar(CameraSource.Camera)
}

export async function pickAvatar() {
  try {
    return await getAvatar(CameraSource.Prompt)
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) return null
    throw error
  }
}
