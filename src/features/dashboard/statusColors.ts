import type { VoyageStatus } from '@/shared/types'

// DASHBOARD.md 13장 — 항차 상태 마커 색(지도·캘린더·게이지 공통).
export const VOYAGE_STATUS_COLOR: Record<VoyageStatus, string> = {
  underway: '#3b82f6',
  delayed: '#ef4444',
  preparing: '#94a3b8',
  completed: '#22c55e',
  cancelled: '#64748b',
}
