import routesData from '@/mocks/routes.json'
import type { AisPosition, Voyage, Waypoint } from '@/shared/types'

const ROUTES = routesData as Record<string, { points: Waypoint[] } | undefined>

// DASHBOARD.md 9.7장 ① — 사전 계산 항로가 있으면 그것, 없으면 voyage.plannedRoute.
export function getDisplayRoute(voyage: Voyage): Waypoint[] {
  return ROUTES[voyage.id]?.points ?? voyage.plannedRoute
}

// DASHBOARD.md 9.7장 ② — 계획 항로를 현재 AIS 위치에서 가장 가까운 점까지 잘라서 실제 항적을 만든다.
// 단순 직선 보간을 쓰면 항적이 대륙을 통과한다(KNOWN_PITFALLS.md 2.9).
export function getActualRoute(voyage: Voyage, displayRoute: Waypoint[], position: AisPosition | undefined): Waypoint[] {
  if (!position) return voyage.actualRoute

  let closestIdx = 0
  let closestDist = Infinity
  for (let i = 0; i < displayRoute.length; i++) {
    const point = displayRoute[i]
    const dist = Math.hypot(point.lat - position.lat, point.lng - position.lng)
    if (dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }

  return displayRoute.slice(0, closestIdx + 1)
}
