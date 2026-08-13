import { PORTS } from '@/mocks/ports'
import type { LatLng } from '@/shared/lib/geo'

export interface PortPairRoute {
  points: LatLng[]
  distanceNm: number
  waypoints: number
}

/**
 * 항구쌍 실해상 항로 조회(docs/specs/SCHEDULE.md 6.3장, Track A).
 * 사전은 알파벳 오름차순 코드 조합("PUS-RTM")으로만 저장돼 있으므로 역방향은 좌표를 뒤집어 반환한다.
 * 사전 크기가 커서(항구 30곳 전 조합 435개) 다른 페이지 번들이 커지지 않도록 동적 import로 제출
 * 시점에만 로드한다.
 */
export async function resolvePortPairRoute(fromCode: string, toCode: string): Promise<PortPairRoute | null> {
  const mod = await import('@/mocks/port-pairs.json')
  const routes = mod.default as unknown as Record<string, PortPairRoute>
  const forward = routes[`${fromCode}-${toCode}`]
  if (forward) return forward
  const reverse = routes[`${toCode}-${fromCode}`]
  if (reverse) return { ...reverse, points: [...reverse.points].reverse() }
  return null
}

/**
 * 캘린더 마커의 "PUS-RTM" 표기와 모달 조회 시 항구 선택값 복원에 쓴다.
 * "로스앤젤레스 (Los Angeles)" → 괄호 안 영문명으로 항구 사전에서 코드를 찾는다.
 */
export function getPortCode(label: string): string | undefined {
  const match = label.match(/\(([^)]+)\)/)
  const en = (match ? match[1] : label).trim().toLowerCase()
  return PORTS.find((p) => p.nameEn.toLowerCase() === en)?.code
}
