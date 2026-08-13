import type { SimRoute } from '@/shared/utils/simulation'

/** POST /api/simulation/recommend 요청/응답 payload. */
export interface AiSimulationRecommendRequest {
  lang: 'ko' | 'en'
  vessel: { name: string; type: string; imo: string }
  route: { departurePort: string; arrivalPort: string; cargoDescription: string }
  deadlineTerm: 'RTA' | 'STA'
  deadlineAt: string
  etdBaseAt: string
  distanceNm: { suez: number; cape: number }
  fuelCurve: { speedKnots: number; fuelTonPerDay: number }[]
  portWaitHours: number
  plan: {
    speedKnots: number
    // 클릭 직전 사용자가 수동으로 골라둔 항로 — '기본'(수에즈·희망봉 모두 불필요)일 수도 있다.
    route: SimRoute
    fuelTon: number
    costUsd: number
    co2Ton: number
    etaAt: string
  }
  recommendation: {
    // 최적화 탐색은 suez·cape만 비교한다 — '기본'은 최적화 결과로 나오지 않는다.
    route: 'suez' | 'cape'
    departureOffsetH: number
    speedKnots: number
    cargoPercent: number
    requiredSpeedKnots: number
    feasible: boolean
    marginHours: number
    etdAt: string
    etaAt: string
    fuelTon: number
    costUsd: number
    co2Ton: number
  }
  savingVsPlan: { fuelTon: number; costUsd: number; co2Ton: number }
}

export interface AiSimulationRecommendSuccess {
  ok: true
  reasoning: string
  model: string
}

export type AiSimulationRecommendFailureReason = 'bad_request' | 'no_api_key' | 'upstream_error'

export interface AiSimulationRecommendFailure {
  ok: false
  reason: AiSimulationRecommendFailureReason
}

export type AiSimulationRecommendResponse = AiSimulationRecommendSuccess | AiSimulationRecommendFailure
