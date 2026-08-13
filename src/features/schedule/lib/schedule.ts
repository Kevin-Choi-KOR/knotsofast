import type { AisPosition, Vessel, Voyage, VoyageStatus } from '@/shared/types'
import { computeVoyageProgress } from '@/shared/lib/geo'
import { getFleetType, type FleetType } from '@/shared/utils/fleet'

/** ETD + 실거리 ÷ 계획속도로 ETA를 역산한다(docs/specs/SCHEDULE.md 6.2장). */
export function computeEtaIso(etdIso: string, distanceNm: number, speedKnots: number): string {
  const hours = distanceNm / speedKnots
  return new Date(new Date(etdIso).getTime() + hours * 3_600_000).toISOString()
}

/**
 * 현위치(%) — 상태로 먼저 확정할 수 있으면 위치 계산을 건너뛴다(6.7장).
 * AIS 위치는 선박당 하나뿐이라, 이 분기 없이는 preparing/completed 항차가 엉뚱한 값으로 보인다.
 */
export function getProgressPercent(voyage: Voyage, position: AisPosition | undefined): number {
  if (voyage.status === 'preparing' || voyage.status === 'cancelled') return 0
  if (voyage.status === 'completed') return 100
  return computeVoyageProgress(voyage.plannedRoute, voyage.distanceNm, position).percent
}

/** 상태별 편집 가능 필드(7장, FR-208). */
export type EditableFields = 'all' | 'none' | readonly ('sta' | 'plannedSpeedKnots')[]

export function editableFieldsForStatus(status: VoyageStatus): EditableFields {
  if (status === 'preparing') return 'all'
  if (status === 'underway' || status === 'delayed') return ['sta', 'plannedSpeedKnots'] as const
  return 'none'
}

export function isFieldEditable(fields: EditableFields, field: 'sta' | 'plannedSpeedKnots' | string): boolean {
  if (fields === 'all') return true
  if (fields === 'none') return false
  return (fields as readonly string[]).includes(field)
}

export type DateBasis = 'etd' | 'eta' | 'rta'

export interface ScheduleFilters {
  fleetTypes: ReadonlySet<FleetType>
  dateBasis: DateBasis
  dateFrom: string
  dateTo: string
}

/** ① 선단 구분 + 조회기간 — 먼저 적용한다(6.5장). 이 결과를 기준으로 상태 탭 건수를 집계한다. */
export function applyFleetDateFilter(voyages: Voyage[], vessels: Vessel[], filters: ScheduleFilters): Voyage[] {
  return voyages.filter((v) => {
    const vessel = vessels.find((x) => x.id === v.vesselId)
    if (!filters.fleetTypes.has(getFleetType(vessel))) return false
    const basisIso = filters.dateBasis === 'etd' ? v.etd : filters.dateBasis === 'rta' ? v.rta : v.eta
    if (filters.dateFrom && basisIso < `${filters.dateFrom}T00:00:00`) return false
    if (filters.dateTo && basisIso > `${filters.dateTo}T23:59:59`) return false
    return true
  })
}

/** ② 상태 + 검색 — ①의 결과에 적용한다. 대소문자를 구분하는 단순 부분 문자열 포함이다(원본 그대로). */
export function applyStatusSearchFilter(
  voyages: Voyage[],
  vessels: Vessel[],
  status: VoyageStatus | 'all',
  search: string,
): Voyage[] {
  return voyages.filter((v) => {
    if (status !== 'all' && v.status !== status) return false
    if (!search) return true
    const vessel = vessels.find((x) => x.id === v.vesselId)
    return v.departurePort.includes(search) || v.arrivalPort.includes(search) || (vessel?.name.includes(search) ?? false)
  })
}

const STATUS_PRIORITY: Record<VoyageStatus, number> = {
  underway: 0,
  delayed: 0,
  preparing: 1,
  completed: 2,
  cancelled: 3,
}

/** 상태 우선순위 → ETA → RTA 3단계 정렬(6.5장). */
export function sortVoyages(voyages: Voyage[]): Voyage[] {
  return [...voyages].sort((a, b) => {
    const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (byStatus !== 0) return byStatus
    if (a.eta !== b.eta) return a.eta < b.eta ? -1 : 1
    if (a.rta !== b.rta) return a.rta < b.rta ? -1 : 1
    return 0
  })
}

export const STATUS_TABS: readonly (VoyageStatus | 'all')[] = ['all', 'underway', 'delayed', 'preparing', 'completed']
