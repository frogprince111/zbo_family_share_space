export type LocatedAddress = {
  address: string
  accuracy: number
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前设备不支持定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    })
  })
}

function compactAddress(displayName: string) {
  return displayName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join(' ')
}

async function reverseGeocode(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.5',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('地址解析失败')
  const data = (await response.json()) as { display_name?: string; name?: string }
  return compactAddress(data.display_name || data.name || '')
}

export async function locateReadableAddress(): Promise<LocatedAddress> {
  const position = await getCurrentPosition()
  const accuracy = Math.round(position.coords.accuracy)

  try {
    const address = await reverseGeocode(position.coords.latitude, position.coords.longitude)
    if (address) return { address, accuracy }
  } catch {
    // 定位可用但地址解析失败时，仍然给用户一个可读状态，不暴露经纬度。
  }

  return { address: `已定位当前位置（精度约 ${accuracy} 米）`, accuracy }
}
