import type { Vessel, Voyage } from '@/shared/types'
import { fuelEmissionFactor, interpolateFuelTonPerDay } from '@/shared/utils/format'
import type { PortCongestion } from '@/mocks/simulation'
import { CANAL_TOLL_USD, CAPE_DISTANCE_FACTOR, REFERENCE_SPEED_KNOTS } from '@/mocks/simulation'

export type SimRoute = 'suez' | 'cape'

// 시뮬레이션 입력 8종 — 초안·적용 두 벌로 관리한다.
export interface SimInputs {
  voyageId: string
  departureOffset: number
  speedKnots: number
  cargoPercent: number
  route: SimRoute
  portCongestion: PortCongestion
  berthProgress: number
  compareVoyageId: string
}

export interface SimulationResult {
  fuel: number
  days: number
  cost: number
  co2: number
}

// 적재율 80%에서 1.0, 100%에서 1.06, 30%에서 0.85가 된다.
export function draftFactor(cargoPercent: number): number {
  return 1 + (cargoPercent - 80) * 0.003
}

// 해군 배수량 법칙(속도³ 비례) + 흘수 보정 — baseFuelPerDay는 선박마다 다르다(고정 상수를 쓰지 않는다).
export function calcFuel(distanceNm: number, speedKnots: number, baseFuelPerDay: number, draftFactorValue: number): number {
  const days = distanceNm / (speedKnots * 24)
  return baseFuelPerDay * (speedKnots / REFERENCE_SPEED_KNOTS) ** 3 * days * draftFactorValue
}

export function routeDistanceOf(voyage: Voyage, route: SimRoute): number {
  return route === 'suez' ? voyage.distanceNm : voyage.distanceNm * CAPE_DISTANCE_FACTOR
}

export function canalCostOf(route: SimRoute): number {
  return route === 'suez' ? CANAL_TOLL_USD : 0
}

// 현재 계획(planned) — 시뮬레이션에서 선택한 적재율·항로를 공유하는, 완전히 고정되지는 않는 기준선.
export function computePlannedResult(voyage: Voyage, vessel: Vessel, inputs: SimInputs): SimulationResult {
  const baseFuel = interpolateFuelTonPerDay(vessel.fuelCurve, REFERENCE_SPEED_KNOTS)
  const factor = draftFactor(inputs.cargoPercent)
  const fuel = calcFuel(voyage.distanceNm, voyage.plannedSpeedKnots, baseFuel, factor)
  const days = voyage.distanceNm / (voyage.plannedSpeedKnots * 24)
  const cost = fuel * 580 + canalCostOf(inputs.route)
  const co2 = fuel * fuelEmissionFactor(voyage.fuelType)
  return { fuel, days, cost, co2 }
}

export interface SimulatedResult extends SimulationResult {
  etd: Date
  eta: Date
  portWaitHours: number
}

export function computeSimulatedResult(
  voyage: Voyage,
  vessel: Vessel,
  inputs: SimInputs,
  portWaitHours: number,
): SimulatedResult {
  const baseFuel = interpolateFuelTonPerDay(vessel.fuelCurve, REFERENCE_SPEED_KNOTS)
  const factor = draftFactor(inputs.cargoPercent)
  const distance = routeDistanceOf(voyage, inputs.route)
  const fuel = calcFuel(distance, inputs.speedKnots, baseFuel, factor)
  const days = distance / (inputs.speedKnots * 24)

  const etd = new Date(voyage.etd)
  etd.setHours(etd.getHours() + inputs.departureOffset)
  const eta = new Date(etd)
  eta.setTime(eta.getTime() + (days * 24 + portWaitHours) * 60 * 60 * 1000)

  const portWaitCost = portWaitHours * 3_000
  const cost = fuel * 580 + (inputs.route === 'cape' ? 0 : canalCostOf(inputs.route)) + portWaitCost
  const co2 = fuel * fuelEmissionFactor(voyage.fuelType)

  return { fuel, days, cost, co2, etd, eta, portWaitHours }
}

// 비교 항차는 그 항차가 속한 선박의 커브·연료 종류로 따로 계산한다 — draftFactor는 항상 1(표준 적재 가정).
export function computeHistoricalResult(compareVoyage: Voyage, compareVessel: Vessel): SimulationResult {
  const baseFuel = interpolateFuelTonPerDay(compareVessel.fuelCurve, REFERENCE_SPEED_KNOTS)
  const fuel = calcFuel(compareVoyage.distanceNm, compareVoyage.plannedSpeedKnots, baseFuel, 1)
  const days = compareVoyage.distanceNm / (compareVoyage.plannedSpeedKnots * 24)
  const cost = fuel * 580
  const co2 = fuel * fuelEmissionFactor(compareVoyage.fuelType)
  return { fuel, days, cost, co2 }
}

export interface SavingResult {
  fuel: number
  cost: number
  co2: number
}

// 양수 = 절약, 음수 = 초과. 화면에는 부호 없이 절댓값 + "절약"/"초과" 단어 배지로 표시한다.
export function computeSaving(planned: SimulationResult, simulated: SimulationResult): SavingResult {
  return {
    fuel: planned.fuel - simulated.fuel,
    cost: planned.cost - simulated.cost,
    co2: planned.co2 - simulated.co2,
  }
}
