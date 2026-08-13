'use client'

import { useEffect, useState } from 'react'
import type { LatLng } from '../lib/calculations'
import { fetchPointWeather, type WeatherPointState } from '../lib/openMeteo'

export type { WeatherPointState } from '../lib/openMeteo'

const LOADING_STATE: WeatherPointState = { status: 'loading', windSpeedMs: 0, waveHeightM: 0 }

/**
 * refreshToken이 바뀌면(좌표가 그대로여도) 강제로 재조회한다 — 재분석 성공으로 aiAnalyzedAt이
 * 바뀔 때 이 값을 넘겨 기상도 함께 새로 조회하도록 한다.
 */
export function useReportWeather(
  currentPoint: LatLng | null,
  arrivalPoint: LatLng | null,
  refreshToken: string,
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
