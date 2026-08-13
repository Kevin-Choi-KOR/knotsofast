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
    route: 'suez' | 'cape'
    fuelTon: number
    costUsd: number
    co2Ton: number
    etaAt: string
  }
  recommendation: {
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
