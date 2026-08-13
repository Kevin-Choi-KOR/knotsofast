'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/shared/components/PageHeader'
import { useVessels } from '@/shared/hooks/useVessels'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { usePositions } from '@/shared/hooks/usePositions'
import { computeFleetGaugeRows } from '@/features/dashboard/fleetGauge'
import { SummaryCards } from '@/features/dashboard/SummaryCards'
import { FleetGaugeCard } from '@/features/dashboard/FleetGaugeCard'
import { FilterBar } from '@/features/dashboard/FilterBar'
import {
  computeDestinations,
  computeVisibleVoyageIds,
  layersForFilters,
  showVesselsForFilters,
  type QuickFilterKey,
} from '@/features/dashboard/filters'
import type { MapViewHandle, MapViewProps } from '@/features/dashboard/MapView'

// Leaflet은 window에 의존한다 — 반드시 SSR을 끄고 동적 import 한다(DASHBOARD.md 9.1장).
const MapView = dynamic<MapViewProps>(() => import('@/features/dashboard/MapView'), { ssr: false })

export default function Page() {
  const { vessels } = useVessels()
  const { voyages } = useVoyages()
  const { positions } = usePositions()

  const mapHandleRef = useRef<MapViewHandle | null>(null)

  const activeVoyages = useMemo(
    () => voyages.filter((voyage) => voyage.status === 'underway' || voyage.status === 'delayed'),
    [voyages],
  )

  const fleetGaugeRows = useMemo(
    () => computeFleetGaugeRows(vessels, voyages, positions),
    [vessels, voyages, positions],
  )

  // DASHBOARD.md 14장 8번 — 최초 진입 시 활성 항차를 전부 선택한다. useRef 플래그로 1회만 실행해야
  // 사용자가 해제한 선택이 데이터 갱신(polling)마다 되살아나지 않는다.
  const didAutoSelectRef = useRef(false)
  const [selectedVoyageIds, setSelectedVoyageIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (didAutoSelectRef.current || fleetGaugeRows.length === 0) return
    didAutoSelectRef.current = true
    setSelectedVoyageIds(new Set(fleetGaugeRows.map((row) => row.voyage.id)))
  }, [fleetGaugeRows])

  const toggleVoyage = (voyageId: string) => {
    setSelectedVoyageIds((prev) => {
      const next = new Set(prev)
      if (next.has(voyageId)) next.delete(voyageId)
      else next.add(voyageId)
      return next
    })
  }

  const selectAllGauge = () => {
    setSelectedVoyageIds((prev) => {
      const next = new Set(prev)
      fleetGaugeRows.forEach((row) => next.add(row.voyage.id))
      return next
    })
  }

  const deselectAllGauge = () => {
    setSelectedVoyageIds((prev) => {
      const next = new Set(prev)
      fleetGaugeRows.forEach((row) => next.delete(row.voyage.id))
      return next
    })
  }

  // DASHBOARD.md 6.2장 — 함대 게이지 카드 펼침 상태. 기본값은 접힘이며, 필터 바의 "My" 토글이
  // 누를 때마다(켤 때·끌 때 모두) 이 상태를 반전시키므로 page.tsx에서 공유 상태로 둔다.
  const [gaugesOpen, setGaugesOpen] = useState(false)

  // DASHBOARD.md 7장 — 빠른 필터 상태.
  const [activeFilters, setActiveFilters] = useState<Set<QuickFilterKey>>(new Set())
  const [selectedDestinationCode, setSelectedDestinationCode] = useState<string | null>(null)

  const myOn = activeFilters.has('my')
  const layers = useMemo(() => layersForFilters(activeFilters), [activeFilters])
  const showVessels = useMemo(() => showVesselsForFilters(activeFilters), [activeFilters])

  const destinations = useMemo(
    () => computeDestinations(vessels, activeVoyages, myOn),
    [vessels, activeVoyages, myOn],
  )

  // "My"를 켜서 선택한 도착지가 목록에서 사라져도 상태를 초기화하지 않는다 — 그 시점부터
  // "유효하지 않은 선택"으로 취급해 자연히 전체 보기로 대체된다(7.6장).
  const effectiveDestinationCode = useMemo(() => {
    if (selectedDestinationCode === null) return null
    return destinations.some((d) => d.code === selectedDestinationCode) ? selectedDestinationCode : null
  }, [selectedDestinationCode, destinations])

  const visibleVoyageIds = useMemo(
    () => computeVisibleVoyageIds(vessels, activeVoyages, selectedVoyageIds, effectiveDestinationCode, myOn, showVessels),
    [vessels, activeVoyages, selectedVoyageIds, effectiveDestinationCode, myOn, showVessels],
  )

  const summaryText = useMemo(() => {
    const parts: string[] = []
    if (showVessels) parts.push(`${visibleVoyageIds.size}척`)
    if (layers.weather) parts.push('기상')
    if (layers.issues) parts.push('이슈')
    if (layers.ports) parts.push('항구')
    return `${parts.join(' · ')} 표시 중`
  }, [showVessels, visibleVoyageIds, layers])

  // DASHBOARD.md 7.2장 — wasActive는 업데이터 바깥에서 먼저 읽고, 다른 setter도 바깥에서 한 번만
  // 호출한다. 업데이터 안에서 다른 setter를 부르면 부수효과가 중복 실행돼 필터가 간헐적으로
  // 안 먹는 버그가 난다(KNOWN_PITFALLS.md 1.3장).
  const toggleQuickFilter = (key: QuickFilterKey) => {
    const wasActive = activeFilters.has(key)

    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (wasActive) {
        next.delete(key)
      } else {
        next.add(key)
        if (key === 'issues') next.delete('ports')
        if (key === 'ports') next.delete('issues')
      }
      return next
    })

    if (key === 'my') {
      if (!wasActive) setSelectedVoyageIds(new Set(fleetGaugeRows.map((row) => row.voyage.id)))
      setGaugesOpen((v) => !v)
    }
    mapHandleRef.current?.resetView()
  }

  const toggleDestination = (code: string | null) => {
    setSelectedDestinationCode((prev) => (code === prev ? null : code))
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="실시간 운항 대시보드" subtitle="선박 위치 및 항로·해상 기상 현황" />

      {/* 상단 요약 카드 6종 */}
      <SummaryCards vessels={vessels} voyages={voyages} activeVoyages={activeVoyages} fleetGaugeRows={fleetGaugeRows} />

      {/* 함대 게이지 카드 — 활성 항차 1건 이상일 때만 */}
      {activeVoyages.length > 0 && (
        <FleetGaugeCard
          rows={fleetGaugeRows}
          selectedVoyageIds={selectedVoyageIds}
          onToggleVoyage={toggleVoyage}
          onSelectAll={selectAllGauge}
          onDeselectAll={deselectAllGauge}
          expanded={gaugesOpen}
          onToggleExpanded={() => setGaugesOpen((v) => !v)}
        />
      )}

      {/* 필터 바 */}
      <FilterBar
        activeFilters={activeFilters}
        onToggleFilter={toggleQuickFilter}
        destinations={destinations}
        selectedDestinationCode={effectiveDestinationCode}
        onSelectDestination={toggleDestination}
        showVessels={showVessels}
        summaryText={summaryText}
      />

      {/* 이슈·항구 리스트 패널 — "이슈"/"항구" 빠른 필터가 생기는 L2 이후 조건부 렌더링 */}

      {/* 지도 영역 */}
      <div className="relative min-h-[500px] flex-1">
        <MapView
          vessels={vessels}
          voyages={voyages}
          layers={layers}
          onReady={(handle) => {
            mapHandleRef.current = handle
          }}
        />
      </div>
    </div>
  )
}
