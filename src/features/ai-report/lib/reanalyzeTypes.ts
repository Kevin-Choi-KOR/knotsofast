import type { RiskItem } from '@/shared/types'

/** POST /api/ai-report/reanalyze 요청 payload (docs/specs/AI_REPORT.md 7.2장). */
export interface AiReanalyzeRequest {
  lang: 'ko' | 'en'
  vessel: { name: string; type: string; imo: string }
  route: { departurePort: string; arrivalPort: string; cargoDescription: string }
  deadlineTerm: 'RTA' | 'STA'
  deadlineAt: string
  nowIso: string
  baselineEtaAt: string
  progress: { totalNm: number; traveledNm: number; remainingNm: number; progressPercent: number }
  currentPos: { lat: number; lng: number }
  arrivalPos: { lat: number; lng: number }
  currentSpeedKnots: number
  currentSpeedProbabilityPercent: number
  marginHoursAtCurrentSpeed: number
  planSpeedKnots: number
  baselineRecommendedSpeedKnots: number
  speedRangeKnots: { min: number; max: number }
  fuelCurve: { speedKnots: number; fuelTonPerDay: number }[]
  congestion: {
    level: 'low' | 'medium' | 'high'
    score: number
    avgWaitHours: number
    berthsAvailable: number
    berthsTotal: number
    trend: 'rising' | 'stable' | 'falling'
  }
  nearbyIssues: { title: string; description: string; severity: 'high' | 'medium' | 'low' }[]
}

export interface AiReanalyzeSuccess {
  ok: true
  reasoning: string
  risks: RiskItem[]
  recommendedSpeedKnots: number
  model: string
}

export type AiReanalyzeFailureReason = 'bad_request' | 'no_api_key' | 'upstream_error'

export interface AiReanalyzeFailure {
  ok: false
  reason: AiReanalyzeFailureReason
}

export type AiReanalyzeResponse = AiReanalyzeSuccess | AiReanalyzeFailure
