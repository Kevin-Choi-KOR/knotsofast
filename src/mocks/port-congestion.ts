export type CongestionLevel = 'low' | 'medium' | 'high'
export type CongestionTrend = 'rising' | 'stable' | 'falling'

export interface PortCongestion {
  portKey: string
  matchNames: string[]
  congestionScore: number // 0-100, 높을수록 혼잡
  avgWaitHours: number
  berthsAvailable: number
  berthsTotal: number
  trend: CongestionTrend
  updatedAt: string
}

export const MOCK_PORT_CONGESTION: PortCongestion[] = [
  {
    portKey: 'rotterdam',
    matchNames: ['로테르담', 'rotterdam'],
    congestionScore: 42,
    avgWaitHours: 18.5,
    berthsAvailable: 3,
    berthsTotal: 9,
    trend: 'stable',
    updatedAt: '2026-07-18T06:00:00Z',
  },
  {
    portKey: 'losangeles',
    matchNames: ['로스앤젤레스', 'los angeles', 'la '],
    congestionScore: 78,
    avgWaitHours: 32,
    berthsAvailable: 2,
    berthsTotal: 10,
    trend: 'rising',
    updatedAt: '2026-07-18T06:30:00Z',
  },
  {
    portKey: 'gwangyang',
    matchNames: ['광양', 'gwangyang'],
    congestionScore: 25,
    avgWaitHours: 6,
    berthsAvailable: 6,
    berthsTotal: 8,
    trend: 'stable',
    updatedAt: '2026-07-18T07:00:00Z',
  },
  {
    portKey: 'ulsan',
    matchNames: ['울산', 'ulsan'],
    congestionScore: 30,
    avgWaitHours: 8,
    berthsAvailable: 5,
    berthsTotal: 7,
    trend: 'stable',
    updatedAt: '2026-07-18T07:30:00Z',
  },
  {
    portKey: 'busan',
    matchNames: ['부산', 'busan'],
    congestionScore: 55,
    avgWaitHours: 14,
    berthsAvailable: 4,
    berthsTotal: 12,
    trend: 'rising',
    updatedAt: '2026-07-18T06:00:00Z',
  },
  {
    portKey: 'shanghai',
    matchNames: ['상하이', 'shanghai'],
    congestionScore: 62,
    avgWaitHours: 22,
    berthsAvailable: 3,
    berthsTotal: 11,
    trend: 'rising',
    updatedAt: '2026-07-18T06:00:00Z',
  },
  {
    portKey: 'hamburg',
    matchNames: ['함부르크', 'hamburg'],
    congestionScore: 38,
    avgWaitHours: 12,
    berthsAvailable: 4,
    berthsTotal: 8,
    trend: 'falling',
    updatedAt: '2026-07-18T06:00:00Z',
  },
  {
    portKey: 'auckland',
    matchNames: ['오클랜드', 'auckland'],
    congestionScore: 20,
    avgWaitHours: 4,
    berthsAvailable: 5,
    berthsTotal: 6,
    trend: 'stable',
    updatedAt: '2026-07-18T06:00:00Z',
  },
  {
    portKey: 'porthedland',
    matchNames: ['포트헤들랜드', 'port hedland'],
    congestionScore: 33,
    avgWaitHours: 9,
    berthsAvailable: 4,
    berthsTotal: 6,
    trend: 'stable',
    updatedAt: '2026-07-18T06:00:00Z',
  },
  {
    portKey: 'rastanura',
    matchNames: ['라스 타누라', 'ras tanura'],
    congestionScore: 28,
    avgWaitHours: 7,
    berthsAvailable: 5,
    berthsTotal: 7,
    trend: 'stable',
    updatedAt: '2026-07-18T06:00:00Z',
  },
]

const DEFAULT_CONGESTION: Omit<PortCongestion, 'portKey' | 'matchNames'> = {
  congestionScore: 35,
  avgWaitHours: 10,
  berthsAvailable: 5,
  berthsTotal: 8,
  trend: 'stable',
  updatedAt: '2026-07-18T06:00:00Z',
}

export function getPortCongestion(portName: string): PortCongestion {
  const normalized = portName.toLowerCase()
  const found = MOCK_PORT_CONGESTION.find(p => p.matchNames.some(name => normalized.includes(name.toLowerCase())))
  return found ?? { portKey: 'default', matchNames: [], ...DEFAULT_CONGESTION }
}

export function congestionLevel(score: number): CongestionLevel {
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
