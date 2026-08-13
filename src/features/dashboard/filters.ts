import type { Vessel, Voyage } from '@/shared/types'
import { getFleetType } from '@/shared/utils/fleet'
import { getPortCode, findPort } from '@/mocks/ports'

export type QuickFilterKey = 'my' | 'weather' | 'vessels' | 'issues' | 'ports'

export interface MapLayers {
  weather: boolean
  radar: boolean
  typhoon: boolean
  issues: boolean
  dangerZones: boolean
  ports: boolean
}

// DASHBOARD.md 7.3장 — 개별 레이어 on/off 스위치는 없다. 태풍·위험구역은 "이슈"에,
// 강수 레이더는 "기상"에 편입된다.
export function layersForFilters(filters: Set<QuickFilterKey>): MapLayers {
  const none = filters.size === 0
  const showW = none || filters.has('weather')
  const showI = none || filters.has('issues')
  const showP = none || filters.has('ports')
  return { weather: showW, radar: showW, typhoon: showI, issues: showI, dangerZones: showI, ports: showP }
}

export function showVesselsForFilters(filters: Set<QuickFilterKey>): boolean {
  return filters.size === 0 || filters.has('vessels') || filters.has('my')
}

export interface Destination {
  code: string | null // null = "전체"
  label: string
  count: number
}

// DASHBOARD.md 7.4장 — My가 켜져 있으면 자사 선단(own+partner) 활성 항차만, 아니면 타사선 전체를 더한다.
export function computeDestinations(vessels: Vessel[], activeVoyages: Voyage[], myOn: boolean): Destination[] {
  const relevant = activeVoyages.filter((voyage) => {
    const fleetType = getFleetType(vessels.find((v) => v.id === voyage.vesselId))
    return fleetType === 'other' ? !myOn : true
  })

  const counts = new Map<string, number>()
  for (const voyage of relevant) {
    const code = getPortCode(voyage.arrivalPort)
    if (!code) continue
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }

  const items: Destination[] = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => {
      const port = findPort(code)
      return { code, label: port ? `${code} · ${port.name} (${count})` : `${code} (${count})`, count }
    })

  return [{ code: null, label: `전체 (${relevant.length})`, count: relevant.length }, ...items]
}

// DASHBOARD.md 7.6장 — 지도에 표시할 항차 확정. selectedVoyageIds 자체는 필터가 바뀌어도
// 건드리지 않고, 여기서 매 렌더마다 "실제로 보여줄 최종 집합"만 파생시킨다.
export function computeVisibleVoyageIds(
  vessels: Vessel[],
  activeVoyages: Voyage[],
  selectedVoyageIds: Set<string>,
  effectiveDestinationCode: string | null,
  myOn: boolean,
  showVessels: boolean,
): Set<string> {
  if (!showVessels) return new Set()

  const matchesDestination = (voyage: Voyage) =>
    effectiveDestinationCode === null || getPortCode(voyage.arrivalPort) === effectiveDestinationCode

  const ownVisibleIds = effectiveDestinationCode
    ? [...selectedVoyageIds].filter((id) => {
        const voyage = activeVoyages.find((v) => v.id === id)
        return voyage ? matchesDestination(voyage) : false
      })
    : [...selectedVoyageIds]

  const otherVisibleIds = myOn
    ? []
    : activeVoyages
        .filter((voyage) => getFleetType(vessels.find((v) => v.id === voyage.vesselId)) === 'other')
        .filter(matchesDestination)
        .map((voyage) => voyage.id)

  return new Set([...ownVisibleIds, ...otherVisibleIds])
}
