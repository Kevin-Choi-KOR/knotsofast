import type { FuelPoint, FuelType, Vessel, Voyage, EcoSpeedReport } from '@/shared/types'
import { haversineNm, findClosestIndex, computeVoyageProgress, remainingRoute, type LatLng, type VoyageProgress } from '@/shared/lib/geo'
import { resolveDeadline } from '@/shared/utils/format'

/**
 * AI 운항 리포트의 모든 수치 계산 — 순수 함수만 둔다.
 * 화면 렌더링과 Gemini 재분석 요청 컨텍스트 구성(서버) 양쪽에서 동일하게 재사용해야
 * 화면 숫자와 AI에게 주는 근거 숫자가 항상 일치한다. docs/specs/AI_REPORT.md 6장.
 *
 * 항해 진행률 계산(haversineNm/computeVoyageProgress 등)은 물류 일정 관리 화면과 공유하므로
 * shared/lib/geo에 있다 — 여기서는 재수출만 한다.
 */

export { haversineNm, findClosestIndex, computeVoyageProgress, remainingRoute, resolveDeadline }
export type { LatLng, VoyageProgress }

export type Confidence = 'high' | 'medium' | 'low'

export interface ProbabilityResult {
  percent: number
  confidence: Confidence
  marginHours: number
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** 여유시간(마진, 시간 단위) 기반 RTA/STA 준수 확률. 마진 0 이상이면 항상 100%. */
export function marginToProbability(marginHours: number): ProbabilityResult {
  if (marginHours >= 0) return { percent: 100, confidence: 'high', marginHours }
  const percent = clamp(Math.round(50 + marginHours * 4), 3, 49)
  const confidence: Confidence = percent >= 40 ? 'medium' : 'low'
  return { percent, confidence, marginHours }
}

function hoursBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 3_600_000
}

/**
 * 마감시각에 정확히 맞추려면 지금부터 평균 몇 노트로 가야 하는지.
 * congestionWaitHours(도착항 P75 접안 대기)만큼 실질 마감을 앞당긴다.
 * 클라이언트(화면)·서버(Gemini 프롬프트)·물류 일정 관리 화면 세 곳에서 완전히 동일해야 한다.
 */
export function computeRequiredSpeedKnots(
  anchorSpeedKnots: number,
  anchorEtaIso: string,
  nowIso: string,
  deadlineIso: string,
  congestionWaitHours = 0,
): number {
  const anchorHours = Math.max(0.01, hoursBetween(nowIso, anchorEtaIso))
  const hoursUntilDeadline = Math.max(0.01, hoursBetween(nowIso, deadlineIso) - congestionWaitHours)
  const raw = (anchorSpeedKnots * anchorHours) / hoursUntilDeadline
  return Math.ceil(raw * 10) / 10
}

function etaMsAtSpeed(anchorSpeedKnots: number, anchorHours: number, nowMs: number, speedKnots: number): number {
  const hours = anchorHours * (anchorSpeedKnots / speedKnots)
  return nowMs + hours * 3_600_000
}

export function interpolateFuelRate(fuelCurve: FuelPoint[], speedKnots: number): number {
  if (fuelCurve.length === 0) return 0
  const sorted = [...fuelCurve].sort((a, b) => a.speedKnots - b.speedKnots)
  if (speedKnots <= sorted[0].speedKnots) return sorted[0].fuelTonPerDay
  const last = sorted[sorted.length - 1]
  if (speedKnots >= last.speedKnots) return last.fuelTonPerDay
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (speedKnots >= a.speedKnots && speedKnots <= b.speedKnots) {
      const ratio = (speedKnots - a.speedKnots) / (b.speedKnots - a.speedKnots)
      return a.fuelTonPerDay + ratio * (b.fuelTonPerDay - a.fuelTonPerDay)
    }
  }
  return last.fuelTonPerDay
}

const FUEL_EMISSION_FACTOR: Record<FuelType, number> = { HFO: 3.114, MGO: 3.206, LNG: 2.75 }

export function fuelEmissionFactor(fuelType: FuelType): number {
  return FUEL_EMISSION_FACTOR[fuelType] ?? FUEL_EMISSION_FACTOR.HFO
}

export function fuelCurveSpeedRange(fuelCurve: FuelPoint[]): { min: number; max: number } {
  const speeds = fuelCurve.map((p) => p.speedKnots)
  return { min: Math.min(...speeds), max: Math.max(...speeds) }
}

export interface SpeedPlanInput {
  vessel: Pick<Vessel, 'fuelCurve'>
  voyage: Pick<Voyage, 'fuelType'>
  report: Pick<EcoSpeedReport, 'recommendedSpeed' | 'currentPlanSpeed' | 'etaIfRecommended'>
  remainingNm: number
  currentSpeedKnots: number
  nowIso: string
  deadlineIso: string
  congestionWaitHours?: number
  /** 있으면 baseline(report.recommendedSpeed) 대신 이 값을 권장 속도로 사용(AI 재분석 override) */
  aiRecommendedSpeedKnots?: number
}

export interface SpeedPlan {
  recommendedSpeedKnots: number
  requiredSpeedKnots: number
  hoursUntilDeadline: number
  currentSpeedProbability: ProbabilityResult
  recommendedSpeedProbability: ProbabilityResult
  etaAtCurrent: string
  etaAtRecommended: string
  fuelSavingPercent: number
  co2SavedTon: number
  fuelSavingPercentFromCurrent: number
  co2SavedTonFromCurrent: number
}

/** 리포트 하나를 펼쳤을 때 필요한 파생 수치를 한 번에 계산하는 핵심 함수(6.4장). */
export function computeSpeedPlan(input: SpeedPlanInput): SpeedPlan {
  const {
    vessel,
    voyage,
    report,
    remainingNm,
    currentSpeedKnots,
    nowIso,
    deadlineIso,
    congestionWaitHours = 0,
    aiRecommendedSpeedKnots,
  } = input

  const recommendedSpeedKnots = aiRecommendedSpeedKnots ?? report.recommendedSpeed
  const nowMs = new Date(nowIso).getTime()
  const deadlineMs = new Date(deadlineIso).getTime()

  // ① 세 시나리오의 ETA를 앵커(baseline 권장 속도 @ baseline ETA) 비율로 환산
  const anchorHours = Math.max(0.01, hoursBetween(nowIso, report.etaIfRecommended))
  const etaAtRecommendedMs = etaMsAtSpeed(report.recommendedSpeed, anchorHours, nowMs, recommendedSpeedKnots)
  const etaAtCurrentMs = etaMsAtSpeed(report.recommendedSpeed, anchorHours, nowMs, currentSpeedKnots)

  const recommendedSpeedProbability = marginToProbability((deadlineMs - etaAtRecommendedMs) / 3_600_000)
  const currentSpeedProbability = marginToProbability((deadlineMs - etaAtCurrentMs) / 3_600_000)

  // ② 필요 속도
  const requiredSpeedKnots = computeRequiredSpeedKnots(
    report.recommendedSpeed,
    report.etaIfRecommended,
    nowIso,
    deadlineIso,
    congestionWaitHours,
  )

  const hoursUntilDeadline = Math.max(0.01, hoursBetween(nowIso, deadlineIso))

  // ③ 연료/CO2 절감 — 최초 계획 속도 대비
  const planDailyRate = interpolateFuelRate(vessel.fuelCurve, report.currentPlanSpeed)
  const recDailyRate = interpolateFuelRate(vessel.fuelCurve, recommendedSpeedKnots)
  const planFuelTon = planDailyRate * (remainingNm / report.currentPlanSpeed / 24)
  const recFuelTon = recDailyRate * (remainingNm / recommendedSpeedKnots / 24)
  const fuelSavedTon = planFuelTon - recFuelTon
  const fuelSavingPercent = planFuelTon > 0 ? (fuelSavedTon / planFuelTon) * 100 : 0
  const co2SavedTon = fuelSavedTon * fuelEmissionFactor(voyage.fuelType)

  // ④ 연료/CO2 절감 — 현재 실시간 속도 대비
  const currentDailyRate = interpolateFuelRate(vessel.fuelCurve, currentSpeedKnots)
  const currentLiveFuelTon = currentDailyRate * (remainingNm / currentSpeedKnots / 24)
  const fuelSavedTonFromCurrent = currentLiveFuelTon - recFuelTon
  const fuelSavingPercentFromCurrent = currentLiveFuelTon > 0 ? (fuelSavedTonFromCurrent / currentLiveFuelTon) * 100 : 0
  const co2SavedTonFromCurrent = fuelSavedTonFromCurrent * fuelEmissionFactor(voyage.fuelType)

  return {
    recommendedSpeedKnots,
    requiredSpeedKnots,
    hoursUntilDeadline,
    currentSpeedProbability,
    recommendedSpeedProbability,
    etaAtCurrent: new Date(etaAtCurrentMs).toISOString(),
    etaAtRecommended: new Date(etaAtRecommendedMs).toISOString(),
    fuelSavingPercent,
    co2SavedTon,
    fuelSavingPercentFromCurrent,
    co2SavedTonFromCurrent,
  }
}

/** 남은 항로(remainingRoute 결과) 600nm 이내의 지역 이슈만 반환(6.6장). 이미 지난 구간의 이슈는 제외된다. */
export function nearbyIssues<T extends LatLng>(remainingRoutePoints: LatLng[], issues: T[], thresholdNm = 600): T[] {
  return issues.filter((issue) => remainingRoutePoints.some((point) => haversineNm(point, issue) <= thresholdNm))
}

export type SpeedDeltaKind = 'maintain' | 'reduce' | 'increase'

/** 속도차 0.05kts 미만이면 유지, 아니면 감속/증속(12장 엣지케이스 #7). */
export function speedDeltaKind(currentSpeedKnots: number, recommendedSpeedKnots: number): SpeedDeltaKind {
  const delta = recommendedSpeedKnots - currentSpeedKnots
  if (Math.abs(delta) < 0.05) return 'maintain'
  return delta < 0 ? 'reduce' : 'increase'
}
