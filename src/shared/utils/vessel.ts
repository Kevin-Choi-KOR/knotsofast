import type { FuelPoint, Voyage } from '@/shared/types'

const FUEL_CURVE_OFFSETS = [-4, -2, 0, 2, 4, 6]

// 해군 배수량 법칙(속도³ 비례) — 기준 속도·연료소모량 두 값만으로 6개 지점을 생성한다.
export function buildFuelCurve(designSpeedKnots: number, designSpeedFuelTon: number): FuelPoint[] {
  return FUEL_CURVE_OFFSETS.map((offset) => designSpeedKnots + offset)
    .filter((speed) => speed > 0)
    .map((speed) => ({
      speedKnots: speed,
      fuelTonPerDay: Math.round(designSpeedFuelTon * (speed / designSpeedKnots) ** 3),
    }))
}

const ACTIVE_VOYAGE_STATUSES: Voyage['status'][] = ['underway', 'delayed']

export function findActiveVoyage(voyages: Voyage[], vesselId: string): Voyage | undefined {
  return voyages.find((v) => v.vesselId === vesselId && ACTIVE_VOYAGE_STATUSES.includes(v.status))
}

// "부산 (Busan)" → "부산"
export function portToken(port: string): string {
  return port.split(' ')[0]
}

export const ALWAYS_LOCKED_FIELDS = [
  'imo',
  'buildYear',
  'type',
  'grossTonnage',
  'lengthOverall',
  'beam',
  'maxDraft',
  'enginePower',
  'designSpeedKnots',
  'designSpeedFuelTon',
] as const

export type VesselModalMode = 'create' | 'view'

export function isFieldEditable(
  mode: VesselModalMode,
  key: string,
  hasActiveVoyage: boolean,
): boolean {
  if (mode === 'create') return true
  if ((ALWAYS_LOCKED_FIELDS as readonly string[]).includes(key)) return false
  if (key === 'status' && hasActiveVoyage) return false
  return true
}
