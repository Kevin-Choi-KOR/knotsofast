export type PortCongestion = 'low' | 'medium' | 'high' | 'severe'

export const FUEL_PRICE_USD_TON = 580
export const CANAL_TOLL_USD = 420_000
export const CAPE_DISTANCE_FACTOR = 1.28
// BASE_FUEL_PER_DAY 상수는 쓰지 않는다 — 선박별 fuelCurve를 14kts로 보간해 쓴다.
export const REFERENCE_SPEED_KNOTS = 14

export const AVG_BERTH_UNLOAD_HOURS = 30 // 선석 하역 총 소요시간(진행률 0%일 때의 대기)
export const WAIT_COST_USD_PER_HOUR = 3_000

export const CONGESTION_WAIT_HOURS: Record<PortCongestion, number> = { low: 0, medium: 8, high: 20, severe: 40 }

// 속도 커브 차트용 — 10~20kts, 0.5 간격 21개
export const SPEED_RANGE: number[] = Array.from({ length: 21 }, (_, i) => 10 + i * 0.5)

// 슬라이더·AI 추천 탐색이 공유하는 속도/출발시점 조정 범위.
export const SPEED_MIN_KNOTS = 10
export const SPEED_MAX_KNOTS = 20
export const SPEED_STEP_KNOTS = 0.5
export const DEPARTURE_OFFSET_MIN_H = -24
export const DEPARTURE_OFFSET_MAX_H = 72
export const DEPARTURE_OFFSET_STEP_H = 6
