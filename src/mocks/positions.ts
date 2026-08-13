import type { AisPosition } from '@/shared/types'

export const MOCK_POSITIONS: AisPosition[] = [
  {
    // voy001 부산→로테르담: ETD 7/10, 8.2일 경과 → 항로 24% (싱가포르 해협 진입)
    vesselId: 'v001',
    lat: 1.1,
    lng: 103.6,
    speedKnots: 13.5,
    cogDegrees: 294, // 말라카 해협 북서 진입 방향
    updatedAt: new Date().toISOString(),
  },
  {
    // voy002 상하이→LA: ETD 7/15, 3.1일 경과 → 항로 18% (일본 동방 진출)
    vesselId: 'v002',
    lat: 41.26,
    lng: 139.74,
    speedKnots: 14.2,
    cogDegrees: 61,  // 북태평양 대권 항로 동북동 방향
    updatedAt: new Date().toISOString(),
  },
  {
    // voy003 포트헤들랜드→광양: ETD 7/18 06:00 → 실제 해상항로(routes.json) 기준 약 3% 진행
    // (기존 좌표(-19.6, 118.6)가 routes.json의 항로 시작점과 완전히 동일해 진행률이 항상 0%로
    // 계산되던 문제를 보정 — 첫 구간을 살짝 지난 지점으로 이동했다).
    vesselId: 'v003',
    lat: -17.89,
    lng: 118.11,
    speedKnots: 12.8,
    cogDegrees: 344, // 북북서 방향 (남중국해 향해 북상 중)
    updatedAt: new Date().toISOString(),
  },
  {
    // voy004 라스타누라→울산: ETD 7/12, 5.9일 경과 → 항로 29% (인도양 스리랑카 남서방)
    vesselId: 'v004',
    lat: 9.7,
    lng: 75.3,
    speedKnots: 13.1,
    cogDegrees: 129, // 말라카 향해 동남동 방향
    updatedAt: new Date().toISOString(),
  },
]
