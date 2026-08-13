'use client'

import { useMemo, useState } from 'react'
import type { Vessel, Voyage, EcoSpeedReport, AisPosition } from '@/shared/types'
import { getPortCongestion, congestionLevel } from '@/mocks/port-congestion'
import { MOCK_REGIONAL_ISSUES } from '@/mocks/map-overlays'
import {
  computeVoyageProgress,
  remainingRoute,
  resolveDeadline,
  computeSpeedPlan,
  nearbyIssues,
  fuelCurveSpeedRange,
  speedDeltaKind,
  type LatLng,
} from '../lib/calculations'
import { useReportWeather } from './useReportWeather'

/**
 * 리포트 카드 하나를 펼쳤을 때 필요한 모든 파생 데이터를 한 곳에서 계산한다.
 * report.generatedAt을 이 리포트의 "지금"으로 취급한다(docs/specs/AI_REPORT.md 3.1장).
 */
export function useReportView(
  vessel: Vessel,
  voyage: Voyage,
  report: EcoSpeedReport,
  position: AisPosition | undefined,
) {
  const [weatherRefreshToken, setWeatherRefreshToken] = useState(0)

  const view = useMemo(() => {
    const nowIso = report.generatedAt
    const currentSpeedKnots = position?.speedKnots ?? voyage.plannedSpeedKnots
    const currentPos: LatLng = position ?? voyage.plannedRoute[0] ?? { lat: 0, lng: 0 }

    const progress = computeVoyageProgress(voyage.plannedRoute, voyage.distanceNm, currentPos)
    const remaining = remainingRoute(voyage.plannedRoute, currentPos)
    const arrivalPos: LatLng = remaining[remaining.length - 1] ?? voyage.plannedRoute[voyage.plannedRoute.length - 1] ?? { lat: 0, lng: 0 }

    const deadline = resolveDeadline(voyage)
    const congestion = getPortCongestion(voyage.arrivalPort)
    const congestionTier = congestionLevel(congestion.congestionScore)
    const issues = nearbyIssues(remaining, MOCK_REGIONAL_ISSUES, 600)

    const speedPlan = computeSpeedPlan({
      vessel,
      voyage,
      report,
      remainingNm: progress.remainingNm,
      currentSpeedKnots,
      nowIso,
      deadlineIso: deadline.deadlineIso,
      congestionWaitHours: congestion.avgWaitHours,
    })

    const speedRange = fuelCurveSpeedRange(vessel.fuelCurve)
    const delta = speedDeltaKind(currentSpeedKnots, speedPlan.recommendedSpeedKnots)

    return {
      nowIso,
      currentSpeedKnots,
      currentPos,
      arrivalPos,
      progress,
      remaining,
      deadline,
      congestion,
      congestionTier,
      issues,
      speedPlan,
      speedRange,
      delta,
    }
  }, [vessel, voyage, report, position])

  const weather = useReportWeather(view.currentPos, view.arrivalPos, weatherRefreshToken)

  return {
    ...view,
    weather,
    bumpWeatherRefresh: () => setWeatherRefreshToken((v) => v + 1),
  }
}

export type ReportView = ReturnType<typeof useReportView>
