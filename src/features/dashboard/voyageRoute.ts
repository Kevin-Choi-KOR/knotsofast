import routesData from '@/mocks/routes.json'
import type { AisPosition, Voyage, Waypoint } from '@/shared/types'

const ROUTES = routesData as Record<string, { points: Waypoint[] } | undefined>

// DASHBOARD.md 9.7장 ① — 사전 계산 항로가 있으면 그것, 없으면 voyage.plannedRoute.
export function getDisplayRoute(voyage: Voyage): Waypoint[] {
  return ROUTES[voyage.id]?.points ?? voyage.plannedRoute
}

// 두 경도의 최단 각도 차(-180~180]. routes.json의 사전계산 항로는 날짜변경선을 넘는 구간을
// "연속 좌표"(예: 121°→241.8°)로 저장하지만, AIS 위치는 항상 표준 범위(-180~180)로 온다.
// 단순 차감(point.lng - position.lng)으로 비교하면 이 두 좌표계가 어긋나 실제로는 가까운 점도
// 수백 도 차이로 계산되어, 태평양 횡단 항로(voy002 등)에서 가장 가까운 점이 항상 출발항으로
// 고정되고 실제 항적이 1개 점으로 쪼그라드는 버그가 있었다.
function shortestLngDiff(a: number, b: number): number {
  return (((a - b + 180) % 360) + 360) % 360 - 180
}

// DASHBOARD.md 9.7장 ② — 계획 항로를 현재 AIS 위치에서 가장 가까운 점까지 잘라서 실제 항적을 만든다.
// 단순 직선 보간을 쓰면 항적이 대륙을 통과한다(KNOWN_PITFALLS.md 2.9).
export function getActualRoute(voyage: Voyage, displayRoute: Waypoint[], position: AisPosition | undefined): Waypoint[] {
  if (!position) return voyage.actualRoute

  let closestIdx = 0
  let closestDist = Infinity
  for (let i = 0; i < displayRoute.length; i++) {
    const point = displayRoute[i]
    const dist = Math.hypot(point.lat - position.lat, shortestLngDiff(point.lng, position.lng))
    if (dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }

  const traveled = displayRoute.slice(0, closestIdx + 1)

  // 사전계산 항로(대권항로 등으로 실제보다 크게 우회하기도 한다)와 시뮬레이션 AIS 위치가
  // 정확히 일치하지 않을 수 있다. "가장 가까운 점"이 실제로는 수백 해리 떨어져 있으면 항적이
  // 배 아이콘까지 닿지 못해, 화면상 배만 떠 있고 항로가 안 보이는 것처럼 보인다. 현재 위치를
  // 항적의 마지막 점으로 항상 덧붙여 배 아이콘까지 확실히 이어지도록 한다.
  return [...traveled, { lat: position.lat, lng: position.lng }]
}
