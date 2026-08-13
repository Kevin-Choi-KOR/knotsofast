import type { RegionalIssue } from '@/mocks/map-overlays'

// DASHBOARD.md 8.1장 — mapIcons.tsx(지도 마커)와 ListPanel.tsx(리스트 항목)가 같은 색·라벨을 쓴다.
export const ISSUE_TYPE_COLOR: Record<RegionalIssue['type'], string> = {
  piracy: '#ef4444',
  port_congestion: '#f59e0b',
  geopolitical: '#8b5cf6',
  canal_control: '#6366f1',
}

export const ISSUE_TYPE_LABEL: Record<RegionalIssue['type'], string> = {
  piracy: '해적',
  port_congestion: '항만 혼잡',
  geopolitical: '지정학적 리스크',
  canal_control: '운하 통제',
}
