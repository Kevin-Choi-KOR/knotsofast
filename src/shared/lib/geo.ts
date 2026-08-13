/**
 * 항해 진행률(현위치 %) 계산 — AI 운항 리포트와 물류 일정 관리 화면이 완전히 동일한 함수를
 * 공유해야 두 화면의 값이 어긋나지 않는다(docs/specs/AI_REPORT.md 6.1장,
 * docs/specs/SCHEDULE.md 6.7장 / KNOWN_PITFALLS.md 5.2).
 */

const EARTH_RADIUS_NM = 3440.065

export interface LatLng {
  lat: number
  lng: number
}

export function haversineNm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function findClosestIndex(routePoints: LatLng[], position: LatLng): number {
  let bestIndex = 0
  let bestDistance = Infinity
  routePoints.forEach((point, index) => {
    const distance = haversineNm(point, position)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })
  return bestIndex
}

export interface VoyageProgress {
  traveledNm: number
  remainingNm: number
  percent: number
}

export function computeVoyageProgress(
  routePoints: LatLng[],
  totalDistanceNm: number,
  position: LatLng | null | undefined,
): VoyageProgress {
  if (!position || routePoints.length < 2) {
    return { traveledNm: 0, remainingNm: totalDistanceNm, percent: 0 }
  }
  const idx = findClosestIndex(routePoints, position)
  let traveled = 0
  for (let i = 0; i < idx; i++) {
    traveled += haversineNm(routePoints[i], routePoints[i + 1])
  }
  traveled += haversineNm(routePoints[idx], position)
  traveled = Math.min(traveled, totalDistanceNm)
  const remaining = Math.max(totalDistanceNm - traveled, 0)
  const percent = totalDistanceNm > 0 ? (traveled / totalDistanceNm) * 100 : 0
  return { traveledNm: traveled, remainingNm: remaining, percent }
}

/** 현재 위치부터 도착지까지 남은 항로만 추출 — 인근 지역 이슈 탐색 등에 사용. */
export function remainingRoute(routePoints: LatLng[], position: LatLng | null | undefined): LatLng[] {
  if (!position || routePoints.length < 2) return routePoints
  return routePoints.slice(findClosestIndex(routePoints, position))
}
