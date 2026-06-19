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

type NominatimAddress = {
  province?: string
  state?: string
  city?: string
  town?: string
  village?: string
  county?: string
  district?: string
  suburb?: string
  neighbourhood?: string
  city_district?: string
  road?: string
  pedestrian?: string
  footway?: string
  residential?: string
  house_number?: string
}

function uniqueParts(parts: Array<string | undefined>) {
  const seen = new Set<string>()
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      if (seen.has(part)) return false
      seen.add(part)
      return true
    })
}

function compactDisplayName(displayName: string) {
  return displayName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reverse()
    .filter((part) => !/中国|China/i.test(part))
    .slice(0, 6)
    .join(' ')
}

function formatAddress(address?: NominatimAddress, displayName = '') {
  if (address) {
    const province = address.province || address.state
    const city = address.city || address.town || address.village
    const district = address.county || address.district || address.city_district || address.suburb
    const street = address.neighbourhood
    const road = address.road || address.pedestrian || address.footway || address.residential
    const houseNumber = address.house_number
    const ordered = uniqueParts([province, city, district, street, road, houseNumber])
    if (ordered.length > 0) return ordered.join(' ')
  }

  return compactDisplayName(displayName)
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
  const data = (await response.json()) as { display_name?: string; name?: string; address?: NominatimAddress }
  return formatAddress(data.address, data.display_name || data.name || '')
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
