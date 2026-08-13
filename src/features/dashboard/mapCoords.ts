import type { Waypoint } from '@/shared/types'

// DASHBOARD.md 9.2장 — 지도를 표준 ±180°가 아니라 북대서양 한가운데(-30°)에서 끊는다.
export const SEAM_LNG = -30
// Web Mercator는 위도 ±90°에서 발산한다 — 안전 한계인 ±85.0511287798을 쓴다.
export const MAX_LAT = 85.0511287798

export const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-MAX_LAT, SEAM_LNG],
  [MAX_LAT, SEAM_LNG + 360],
]

// 단일 마커 좌표에 적용한다. 항로 폴리라인에는 쓰지 않는다 — wrapRouteSegments()를 쓴다.
export function wrapLng(lng: number): number {
  return lng < SEAM_LNG ? lng + 360 : lng
}

function copyIndexOf(lng: number): number {
  return Math.floor((lng - SEAM_LNG) / 360)
}

function toDisplayLng(lng: number, copy: number): number {
  return lng - copy * 360
}

// 이음매를 가로지르는 항로를 여러 선분으로 분할한다(DASHBOARD.md 9.2장 의사코드).
// 점마다 독립적으로 wrapLng를 적용하면 지도 폭 전체를 가로지르는 직선으로 끊겨 보인다.
export function wrapRouteSegments(waypoints: Waypoint[]): [number, number][][] {
  if (waypoints.length < 2) return []

  // ① 인접 점 간 점프가 180°를 넘지 않도록 연속화(unwrap)
  const contLngs: number[] = [waypoints[0].lng]
  for (let i = 1; i < waypoints.length; i++) {
    let lng = waypoints[i].lng
    while (lng - contLngs[i - 1] > 180) lng -= 360
    while (lng - contLngs[i - 1] < -180) lng += 360
    contLngs.push(lng)
  }

  // ② 표시 구간 경계를 넘는 지점에서 위도를 보간해 선을 끊는다
  const segments: [number, number][][] = []
  let current: [number, number][] = [[waypoints[0].lat, toDisplayLng(contLngs[0], copyIndexOf(contLngs[0]))]]

  for (let i = 1; i < waypoints.length; i++) {
    const prevLat = waypoints[i - 1].lat
    const prevLng = contLngs[i - 1]
    const lat = waypoints[i].lat
    const lng = contLngs[i]

    const k = copyIndexOf(prevLng)
    const kNext = copyIndexOf(lng)

    if (kNext !== k) {
      const increasing = lng > prevLng
      const boundary = SEAM_LNG + (increasing ? k + 1 : k) * 360
      const t = (boundary - prevLng) / (lng - prevLng)
      const crossLat = prevLat + (lat - prevLat) * t

      current.push([crossLat, toDisplayLng(boundary, k)])
      if (current.length >= 2) segments.push(current)
      current = [[crossLat, toDisplayLng(boundary, kNext)]]
    }

    current.push([lat, toDisplayLng(lng, kNext)])
  }

  if (current.length >= 2) segments.push(current)
  return segments
}
