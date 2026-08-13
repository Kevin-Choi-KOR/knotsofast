'use client'

import { useEffect, useState } from 'react'
import type { LatLng } from '../lib/calculations'

export type WeatherStatus = 'loading' | 'success' | 'error'

export interface WeatherPointState {
  status: WeatherStatus
  windSpeedMs: number
  waveHeightM: number
}

const LOADING_STATE: WeatherPointState = { status: 'loading', windSpeedMs: 0, waveHeightM: 0 }
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
 * forecast/marine 두 호출 중 하나만 실패하면 나머지 값 + 0 폴백으로 성공 처리하고,
 * 둘 다 실패했을 때만 해당 지점을 에러 상태로 표시한다.
 */
async function fetchPointWeather(point: LatLng): Promise<WeatherPointState> {
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

/**
 * refreshToken이 바뀌면(좌표가 그대로여도) 강제로 재조회한다 — "재분석" 버튼 클릭 시 사용.
 */
export function useReportWeather(
  currentPoint: LatLng | null,
  arrivalPoint: LatLng | null,
  refreshToken: number,
): { current: WeatherPointState; arrival: WeatherPointState } {
  const [current, setCurrent] = useState<WeatherPointState>(LOADING_STATE)
  const [arrival, setArrival] = useState<WeatherPointState>(LOADING_STATE)

  const currentLat = currentPoint?.lat ?? null
  const currentLng = currentPoint?.lng ?? null
  const arrivalLat = arrivalPoint?.lat ?? null
  const arrivalLng = arrivalPoint?.lng ?? null

  useEffect(() => {
    let cancelled = false
    // 좌표·refreshToken이 바뀔 때마다 이전 값 대신 로딩 상태부터 다시 보여준다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(LOADING_STATE)
    setArrival(LOADING_STATE)

    if (currentLat != null && currentLng != null) {
      fetchPointWeather({ lat: currentLat, lng: currentLng }).then((state) => {
        if (!cancelled) setCurrent(state)
      })
    }
    if (arrivalLat != null && arrivalLng != null) {
      fetchPointWeather({ lat: arrivalLat, lng: arrivalLng }).then((state) => {
        if (!cancelled) setArrival(state)
      })
    }
    return () => {
      cancelled = true
    }
  }, [currentLat, currentLng, arrivalLat, arrivalLng, refreshToken])

  return { current, arrival }
}
