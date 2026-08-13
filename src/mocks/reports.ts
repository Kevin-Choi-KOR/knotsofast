import type { EcoSpeedReport } from '@/shared/types'

export const MOCK_REPORTS: EcoSpeedReport[] = [
  {
    id: 'rep001',
    voyageId: 'voy001',
    generatedAt: '2026-07-18T06:00:00Z',
    recommendedSpeed: 13.5,
    currentPlanSpeed: 16.0,
    fuelSavingPercent: 18.2,
    co2SavedTon: 142.6,
    etaIfRecommended: '2026-07-31T22:00:00Z',
    canMeetRta: true,
    aiAnalyzedAt: null,
    reasoning:
      '현재 도착지(로테르담) 항만 체선이 약 18시간 예상됩니다.\n계획 속도 16kts를 13.5kts로 낮추면 연료 18.2%를 절감하면서도 RTA보다 20시간 일찍 도착할 수 있습니다.\n홍해 구간 파고 2.1m 예상 — 감속 운항이 선체 응력에도 유리합니다.',
    risks: [
      {
        level: 'medium',
        category: 'weather',
        title: '홍해 북부 높은 파고',
        description: '향후 48시간 파고 2.1~2.8m 예보. 선수 방향 조정 및 속도 유지 권장.',
      },
      {
        level: 'low',
        category: 'port',
        title: '로테르담 항만 체선',
        description: '현재 평균 대기 시간 18.5시간. 조기 도착보다 적정 속도 유지가 비용 효율적.',
      },
      {
        level: 'low',
        category: 'geopolitical',
        title: '수에즈 운하 통과 대기',
        description: '수에즈 운하 남북 단방향 통항 대기 약 6시간 예상. 일정 반영 완료.',
      },
    ],
  },
  {
    id: 'rep002',
    voyageId: 'voy002',
    generatedAt: '2026-07-18T06:30:00Z',
    recommendedSpeed: 14.0,
    currentPlanSpeed: 17.0,
    fuelSavingPercent: 21.4,
    co2SavedTon: 98.3,
    etaIfRecommended: '2026-08-05T16:00:00Z',
    canMeetRta: false,
    aiAnalyzedAt: null,
    reasoning:
      '북태평양 저기압으로 인해 항로 북쪽 구간에 파고 4.5m 이상 예보.\n현재 계획 항로 우회를 권장하며, 우회 시 거리 180nm 증가하지만 선체 안전 및 화물 보호를 위해 필요합니다.\n우회 후 14kts 유지 시 RTA 대비 10시간 지연 예상.\n하역 일정 재협의 권고.',
    risks: [
      {
        level: 'high',
        category: 'weather',
        title: '북태평양 저기압 — 항로 우회 필요',
        description: '7월 19~22일 항로 상 파고 4.5~6.0m, 풍속 35kts 이상 예보. 남쪽으로 2도 우회 권장.',
      },
      {
        level: 'medium',
        category: 'port',
        title: 'LA 항 체선 심화',
        description: '현재 LA 항 평균 대기 시간 32시간으로 증가. 10시간 지연과 합산 시 실질 영향 최소화.',
      },
    ],
  },
  {
    id: 'rep003',
    voyageId: 'voy003',
    generatedAt: '2026-07-18T07:00:00Z',
    recommendedSpeed: 12.5,
    currentPlanSpeed: 13.0,
    fuelSavingPercent: 5.8,
    co2SavedTon: 18.2,
    etaIfRecommended: '2026-08-01T20:00:00Z',
    canMeetRta: true,
    aiAnalyzedAt: null,
    reasoning:
      '현재 항차는 계획 일정보다 16시간 여유가 있습니다.\n속도를 0.5kts 낮추면 소폭의 연료 절감이 가능하며, RTA 준수에 문제가 없습니다.\n남중국해 구간 파고는 양호(1.2m 미만)합니다.',
    risks: [
      {
        level: 'low',
        category: 'weather',
        title: '남중국해 소규모 스콜',
        description: '필리핀 동쪽 해상 국지성 스콜 예보. 레이더 모니터링 권장, 항로 변경 불필요.',
      },
    ],
  },
  {
    id: 'rep004',
    voyageId: 'voy004',
    generatedAt: '2026-07-18T07:30:00Z',
    recommendedSpeed: 13.0,
    currentPlanSpeed: 14.5,
    fuelSavingPercent: 12.7,
    co2SavedTon: 76.4,
    etaIfRecommended: '2026-07-28T02:00:00Z',
    canMeetRta: true,
    aiAnalyzedAt: null,
    reasoning:
      '아덴만 통과 구간 해적 위험 해역 접근.\n권고 항로(권고 항로 UKMTO 002) 준수 중.\n말라카 해협 통과 예상 시 조류 방향 유리(0.5kts 순방향).\n13.0kts 유지 시 RTA 6시간 전 도착 예상.',
    risks: [
      {
        level: 'high',
        category: 'geopolitical',
        title: '아덴만 — 해적 위험 해역',
        description: 'UKMTO 권고 항로 준수 필요. 현재 통과 완료. 야간 항행 경계 강화 권고.',
      },
      {
        level: 'low',
        category: 'weather',
        title: '인도양 남서 몬순',
        description: '인도양 구간 파고 1.8~2.4m, 선미 방향 파도로 오히려 추진력에 유리.',
      },
    ],
  },
]
