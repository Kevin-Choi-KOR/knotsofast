export interface TyphoonWarning {
  id: string
  name: string
  lat: number
  lng: number
  intensity: 'TD' | 'TS' | 'TY' | 'STY'
  windSpeedKnots: number
  radiusKm: number
  movingDir: string
  movingSpeedKnots: number
}

export interface RegionalIssue {
  id: string
  lat: number
  lng: number
  type: 'piracy' | 'port_congestion' | 'geopolitical' | 'canal_control'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  source: string
}

export interface DangerZone {
  id: string
  center: [number, number]
  radiusKm: number
  type: 'collision_risk' | 'restricted' | 'piracy'
  label: string
  color: string
}

export const MOCK_TYPHOONS: TyphoonWarning[] = [
  {
    id: 't001',
    name: '태풍 MAWAR',
    lat: 18,
    lng: 135,
    intensity: 'TY',
    windSpeedKnots: 85,
    radiusKm: 350,
    movingDir: '북북서',
    movingSpeedKnots: 12,
  },
  {
    id: 't002',
    name: '저기압 BOB-02',
    lat: 12,
    lng: 88,
    intensity: 'TS',
    windSpeedKnots: 45,
    radiusKm: 200,
    movingDir: '북',
    movingSpeedKnots: 8,
  },
]

export const MOCK_REGIONAL_ISSUES: RegionalIssue[] = [
  {
    id: 'i001',
    lat: 12.5,
    lng: 45,
    type: 'piracy',
    title: '해적 활동 경보',
    description: '아덴만 일대 해적 위협 증가. IMB 경보 Level 2. 순찰 강화 중이나 우회 항로 권고.',
    severity: 'high',
    source: 'IMB Piracy Reporting Centre',
  },
  {
    id: 'i002',
    lat: 30.5,
    lng: 32.3,
    type: 'canal_control',
    title: '수에즈 운하 통항 지연',
    description: '선박 증가로 대기 시간 평균 18시간. 남·북행 각 2개 호송대 운영 중.',
    severity: 'medium',
    source: 'SCA (수에즈 운하청)',
  },
  {
    id: 'i003',
    lat: 31.3,
    lng: 121.8,
    type: 'port_congestion',
    title: '상하이항 터미널 혼잡',
    description: '컨테이너 터미널 혼잡으로 입항 대기 평균 3.2일. 양양·닝보 대체 입항 권장.',
    severity: 'medium',
    source: '상하이 항만국',
  },
  {
    id: 'i004',
    lat: 1.3,
    lng: 103.8,
    type: 'geopolitical',
    title: '말라카 해협 통항 규제',
    description: '대형 선박(DWT 300,000+) 야간 통항 제한. 파일럿 필수 탑승.',
    severity: 'low',
    source: '말레이시아 해사청',
  },
  {
    id: 'i005',
    lat: 15,
    lng: 42,
    type: 'geopolitical',
    title: '홍해 안보 위협',
    description: '후티 세력의 민간 선박 공격 지속. 미·영 합동 호위 작전 운영 중. 희망봉 우회 권고.',
    severity: 'high',
    source: 'UKMTO / MSCHOA',
  },
  {
    id: 'i006',
    lat: 22.3,
    lng: 114.2,
    type: 'port_congestion',
    title: '홍콩항 혼잡',
    description: '파업 여파로 컨테이너 처리 지연. 입항 대기 1.8일.',
    severity: 'low',
    source: '홍콩 항만물류국',
  },
  {
    id: 'i007',
    lat: 26.6,
    lng: 56.5,
    type: 'geopolitical',
    title: '호르무즈 해협 긴장 고조',
    description: '이란-미국 군사 대치로 상선 통항 제한 가능성. 이란 혁명수비대 해상 검문 사례 보고. 통항 시 VHF Ch.16 상시 감청 및 속도 제한 준수 요망.',
    severity: 'high',
    source: 'UKMTO / IMO',
  },
]

export const MOCK_DANGER_ZONES: DangerZone[] = [
  {
    id: 'dz001',
    center: [1.3, 103.8],
    radiusKm: 120,
    type: 'collision_risk',
    label: '말라카 해협 충돌 위험',
    color: '#f59e0b',
  },
  {
    id: 'dz002',
    center: [12, 44],
    radiusKm: 300,
    type: 'piracy',
    label: '아덴만 해적 위험구역',
    color: '#ef4444',
  },
  {
    id: 'dz003',
    center: [16, 112],
    radiusKm: 400,
    type: 'restricted',
    label: '남중국해 분쟁 수역',
    color: '#8b5cf6',
  },
  {
    id: 'dz004',
    center: [14.5, 42.5],
    radiusKm: 400,
    type: 'piracy',
    label: '홍해 위협 구역',
    color: '#ef4444',
  },
  {
    id: 'dz005',
    center: [26.6, 56.5],
    radiusKm: 180,
    type: 'restricted',
    label: '호르무즈 해협 분쟁수역',
    color: '#8b5cf6',
  },
]
