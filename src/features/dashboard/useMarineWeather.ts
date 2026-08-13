'use client'

import { useEffect, useState } from 'react'
import { WEATHER_LOCATIONS, type WeatherPoint } from '@/mocks/map-overlays'

const TIMEOUT_MS = 8000

async function fetchPointWeather(loc: (typeof WEATHER_LOCATIONS)[number]): Promise<WeatherPoint | null> {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${loc.lat}&longitude=${loc.lng}&current=wave_height`

  const [forecastResult, marineResult] = await Promise.allSettled([
    fetch(forecastUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) }).then((res) => res.json()),
    fetch(marineUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) }).then((res) => res.json()),
  ])

  // DASHBOARD.md 11.1장 — 8지점을 병렬 조회하되 일부 실패를 허용한다. 이 지점의 두 호출이
  // 모두 실패했을 때만 지점 자체를 제외하고, 하나만 실패하면 나머지 필드는 0으로 채운다.
  if (forecastResult.status === 'rejected' && marineResult.status === 'rejected') return null

  const current = forecastResult.status === 'fulfilled' ? forecastResult.value?.current : undefined
  const marineCurrent = marineResult.status === 'fulfilled' ? marineResult.value?.current : undefined

  return {
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    windSpeed: current?.wind_speed_10m ?? 0,
    windDir: current?.wind_direction_10m ?? 0,
    waveHeight: marineCurrent?.wave_height ?? 0,
  }
}

export interface MarineWeatherState {
  points: WeatherPoint[]
  error: boolean
}

// DASHBOARD.md 11.1장 — 해상 기상(Open-Meteo). API 키 불필요, 브라우저에서 직접 호출한다.
export function useMarineWeather(): MarineWeatherState {
  const [state, setState] = useState<MarineWeatherState>({ points: [], error: false })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const results = await Promise.allSettled(WEATHER_LOCATIONS.map(fetchPointWeather))
      if (cancelled) return

      const points = results.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []))
      setState({ points, error: points.length === 0 })
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
