import type { LatLng } from './calculations'

export type WeatherStatus = 'loading' | 'success' | 'error'

export interface WeatherPointState {
  status: WeatherStatus
  windSpeedMs: number
  waveHeightM: number
}

const TIMEOUT_MS = 8000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 두 지점(현재 위치, 도착항)의 실시간 풍속·파고를 Open-Meteo에서 조회한다(docs/specs/AI_REPORT.md 6.7장).
 * 클라이언트 훅(useReportWeather)과 서버 재분석 라우트 양쪽에서 동일하게 사용한다.
 * forecast/marine 두 호출 중 하나만 실패하면 나머지 값 + 0 폴백으로 성공 처리하고,
 * 둘 다 실패했을 때만 해당 지점을 에러 상태로 표시한다.
 */
export async function fetchPointWeather(point: LatLng): Promise<WeatherPointState> {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lng}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${point.lat}&longitude=${point.lng}&current=wave_height`

  const [forecastResult, marineResult] = await Promise.allSettled([
    fetchWithTimeout(forecastUrl).then((res) => res.json()),
    fetchWithTimeout(marineUrl).then((res) => res.json()),
  ])

  const windOk = forecastResult.status === 'fulfilled'
  const waveOk = marineResult.status === 'fulfilled'
  if (!windOk && !waveOk) {
    return { status: 'error', windSpeedMs: 0, waveHeightM: 0 }
  }
  const windSpeedMs = windOk ? Number(forecastResult.value?.current?.wind_speed_10m ?? 0) : 0
  const waveHeightM = waveOk ? Number(marineResult.value?.current?.wave_height ?? 0) : 0
  return { status: 'success', windSpeedMs, waveHeightM }
}
