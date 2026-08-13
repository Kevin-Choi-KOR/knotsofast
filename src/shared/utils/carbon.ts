import type { FuelPoint, FuelType, Vessel, Voyage } from '@/shared/types'
import { fuelEmissionFactor, interpolateFuelTonPerDay } from '@/shared/utils/format'
import { CARBON_BENCHMARK_MULTIPLIER } from '@/mocks/carbon'

export type CiiGrade = 'A' | 'B' | 'C' | 'D' | 'E'

// 배열 순서 = 좋은 등급 → 나쁜 등급 (점수는 낮을수록 좋다)
export const CII_GRADES: CiiGrade[] = ['A', 'B', 'C', 'D', 'E']

export const CII_COLORS: Record<CiiGrade, string> = {
  A: '#16a34a',
  B: '#84cc16',
  C: '#d97706',
  D: '#ea580c',
  E: '#dc2626',
}

// 목업 CII 트렌드(C: 4.50~4.92, D: 5.18~5.41)에서 역산한 경계값 — 실제 IMO 기준과 다르다.
export function ciiGradeFromScore(score: number): CiiGrade {
  if (score < 3.5) return 'A'
  if (score < 4.0) return 'B'
  if (score < 4.95) return 'C'
  if (score < 5.6) return 'D'
  return 'E'
}

export interface EmissionTotals {
  totalFuelTon: number
  totalCo2Ton: number
}

// 항해일수(distanceNm / speed / 24) × 연료 커브 보간 일일 소모량 → 총 연료·CO₂
export function computeVoyageEmissions(
  fuelCurve: FuelPoint[],
  speedKnots: number,
  distanceNm: number,
  fuelType: FuelType,
): EmissionTotals {
  const dailyFuelRate = interpolateFuelTonPerDay(fuelCurve, speedKnots)
  const totalFuelTon = dailyFuelRate * (distanceNm / speedKnots / 24)
  const totalCo2Ton = totalFuelTon * fuelEmissionFactor(fuelType)
  return { totalFuelTon, totalCo2Ton }
}

export interface Scope3Result {
  benchmarkFuelTon: number
  benchmarkCo2Ton: number
  savedTon: number
  savedPct: number
}

// 대시보드 "이번 항차 에코 랭킹" 카드와 공유한다 — 한쪽만 실계산이면 두 화면의 랭킹·절감률이 어긋난다.
export function computeScope3Savings(
  voyage: Voyage,
  vessel: Vessel,
  allVessels: Vessel[],
  totalCo2Ton: number,
): Scope3Result {
  // ① 동일 선종 + 총톤수 ±35% 이내
  let peers = allVessels.filter(
    (v) =>
      v.id !== vessel.id &&
      v.type === vessel.type &&
      Math.abs(v.grossTonnage - vessel.grossTonnage) / vessel.grossTonnage <= 0.35,
  )
  // ② 없으면 선종만 일치
  if (peers.length === 0) {
    peers = allVessels.filter((v) => v.id !== vessel.id && v.type === vessel.type)
  }
  // ③ 그마저 없으면 고정 배수 폴백
  if (peers.length === 0) {
    const benchmarkCo2Ton = totalCo2Ton * CARBON_BENCHMARK_MULTIPLIER
    const benchmarkFuelTon = benchmarkCo2Ton / fuelEmissionFactor(voyage.fuelType)
    return {
      benchmarkFuelTon,
      benchmarkCo2Ton,
      savedTon: benchmarkCo2Ton - totalCo2Ton,
      savedPct: (1 - totalCo2Ton / benchmarkCo2Ton) * 100,
    }
  }

  // peers가 "자기 설계 속도로" 같은 거리를 운항했을 때의 연료·CO₂ 평균
  // CO₂ 계수는 voyage.fuelType을 쓴다 — "같은 항차를 그 배가 뛰었다면"을 가정하기 때문.
  const footprints = peers.map((v) => {
    const fuelTon =
      interpolateFuelTonPerDay(v.fuelCurve, v.designSpeedKnots) * (voyage.distanceNm / v.designSpeedKnots / 24)
    return { fuelTon, co2Ton: fuelTon * fuelEmissionFactor(voyage.fuelType) }
  })
  const benchmarkFuelTon = footprints.reduce((sum, f) => sum + f.fuelTon, 0) / footprints.length
  const benchmarkCo2Ton = footprints.reduce((sum, f) => sum + f.co2Ton, 0) / footprints.length

  return {
    benchmarkFuelTon,
    benchmarkCo2Ton,
    savedTon: benchmarkCo2Ton - totalCo2Ton,
    savedPct: (1 - totalCo2Ton / benchmarkCo2Ton) * 100,
  }
}

// 절감/초과를 절댓값 + 접미사로 표기한다 — "-"를 무조건 붙이면 음수와 겹쳐 "--1.8%"가 된다.
export function formatSignedPct(pct: number, positiveSuffix: string, negativeSuffix: string): string {
  const abs = Math.abs(pct).toFixed(1)
  return pct >= 0 ? `${abs}${positiveSuffix}` : `${abs}${negativeSuffix}`
}

// 다국어 사전을 거치지 않는 고정 한국어 단위(억원/만원/원)
export function formatKrwCompact(v: number): string {
  if (v >= 1e8) return `${(v / 1e8).toFixed(1)}억원`
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString()}만원`
  return `${Math.round(v).toLocaleString()}원`
}
