'use client'

import { useMemo } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useVessels } from '@/shared/hooks/useVessels'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { usePositions } from '@/shared/hooks/usePositions'
import { computeFleetGaugeRows } from '@/features/dashboard/fleetGauge'
import { SummaryCards } from '@/features/dashboard/SummaryCards'

export default function Page() {
  const { vessels } = useVessels()
  const { voyages } = useVoyages()
  const { positions } = usePositions()

  const activeVoyages = useMemo(
    () => voyages.filter((voyage) => voyage.status === 'underway' || voyage.status === 'delayed'),
    [voyages],
  )

  const fleetGaugeRows = useMemo(
    () => computeFleetGaugeRows(vessels, voyages, positions),
    [vessels, voyages, positions],
  )

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="실시간 운항 대시보드" subtitle="선박 위치 및 항로·해상 기상 현황" />

      {/* 상단 요약 카드 6종 */}
      <SummaryCards vessels={vessels} voyages={voyages} activeVoyages={activeVoyages} fleetGaugeRows={fleetGaugeRows} />

      {/* 함대 게이지 카드 — 활성 항차 1건 이상일 때만, L1 */}
      {activeVoyages.length > 0 && (
        <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-2 dark:border-slate-800 dark:bg-slate-800" />
      )}

      {/* 필터 바 — L2 */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-800" />

      {/* 이슈·항구 리스트 패널 — "이슈"/"항구" 빠른 필터가 생기는 L2 이후 조건부 렌더링 */}

      {/* 지도 영역 */}
      <div className="flex min-h-[500px] flex-1 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-900 dark:text-slate-600">
        지도 영역 (MapView) — 다음 단계에서 구현
      </div>
    </div>
  )
}
