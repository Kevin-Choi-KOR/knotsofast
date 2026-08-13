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
} from './calculations'

/**
 * 리포트 한 건에 필요한 모든 파생 데이터(기상 제외)를 계산하는 순수 함수.
 * report.generatedAt을 이 리포트의 "지금"으로 취급한다(docs/specs/AI_REPORT.md 3.1장).
 *
 * 기상은 비동기 조회가 필요해 별도 훅(useReportWeather)으로 뺐다 — 이 함수 자체는 훅이 아니므로
 * 화면 렌더링(useReportView)뿐 아니라 재분석 payload 구성(useReanalyze) 등 훅 규칙 밖에서도 그대로 쓸 수 있다.
 */
export function buildReportView(vessel: Vessel, voyage: Voyage, report: EcoSpeedReport, position: AisPosition | undefined) {
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
}

export type ReportViewBase = ReturnType<typeof buildReportView>
