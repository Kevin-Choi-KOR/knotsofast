'use client'

import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { BrainCircuit, ChevronDown, Fuel, Gauge, Leaf, LocateFixed, TrendingDown } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { formatShortDateTime } from '@/shared/utils/format'
import { getPortCode } from '@/mocks/ports'
import { VoyageBadge } from '@/shared/components/StatusBadge'
import { HorizontalGauge } from '@/features/dashboard/HorizontalGauge'
import type { FleetGaugeRow } from '@/features/dashboard/fleetGauge'

function portShortLabel(portLabel: string): string {
  return getPortCode(portLabel) ?? portLabel.split(' ')[0]
}

// 카드 전체 클릭 핸들러 위에 얹힌 버튼들 — DASHBOARD.md 6.3장: stopPropagation 없으면
// 버튼을 눌렀는데 지도 표시 토글까지 함께 발동한다.
function stopClick(e: MouseEvent) {
  e.stopPropagation()
}

interface VesselGaugeCardProps {
  row: FleetGaugeRow
  selected: boolean
  onToggle: () => void
}

function VesselGaugeCard({ row, selected, onToggle }: VesselGaugeCardProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'w-80 shrink-0 cursor-pointer rounded-lg border px-3 py-1',
        selected
          ? 'border-[#6366f1] bg-[#6366f1]/5'
          : 'border-slate-200 opacity-50 hover:opacity-80 dark:border-slate-700',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {row.vessel.name}
        </span>
        <VoyageBadge status={row.voyage.status} className="px-1.5 py-0 text-[9px]" />
        <button
          type="button"
          title="현재 위치로 이동"
          onClick={stopClick}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        >
          <LocateFixed size={14} />
        </button>
        <button
          type="button"
          onClick={stopClick}
          className="flex shrink-0 items-center gap-0.5 rounded bg-[#6366f1] px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-[#4f46e5]"
        >
          <Gauge size={12} />
          Knot
        </button>
        <button
          type="button"
          onClick={stopClick}
          className="flex shrink-0 items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <BrainCircuit size={12} />
          AI
        </button>
      </div>

      <div className="text-[9px] text-slate-500 dark:text-slate-400">
        {portShortLabel(row.voyage.departurePort)} → {portShortLabel(row.voyage.arrivalPort)}
      </div>

      <div className="flex items-stretch gap-2 py-1">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <HorizontalGauge
            icon={Fuel}
            label="연료 소모"
            value={`${row.fuelTonPerDay.toFixed(1)}t/일`}
            percent={row.fuelCapacityPercent}
            barClassName="bg-[#6366f1]"
          />
          <HorizontalGauge
            icon={Leaf}
            label="탄소 배출"
            value={`${row.co2TonPerDay.toFixed(1)}t/일`}
            percent={row.co2FleetPercent}
            barClassName="bg-orange-500"
          />
          <HorizontalGauge
            icon={TrendingDown}
            label="연료 절감"
            value={`${row.fuelSavingPercent.toFixed(0)}%`}
            percent={row.fuelSavingPercent}
            barClassName="bg-green-500"
          />
        </div>
        <div className="flex w-28 shrink-0 flex-col justify-center gap-1 border-l border-slate-200 pl-2 text-[11px] dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">현재 속도</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{row.position.speedKnots.toFixed(1)}kt</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">ETA</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatShortDateTime(row.voyage.eta)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">권장 속도</span>
            <span className="font-semibold text-green-600">{row.voyage.recommendedSpeedKnots.toFixed(1)}kt</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface FleetGaugeCardProps {
  rows: FleetGaugeRow[]
  selectedVoyageIds: Set<string>
  onToggleVoyage: (voyageId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  expanded: boolean
  onToggleExpanded: () => void
}

export function FleetGaugeCard({
  rows,
  selectedVoyageIds,
  onToggleVoyage,
  onSelectAll,
  onDeselectAll,
  expanded,
  onToggleExpanded,
}: FleetGaugeCardProps) {
  const [search, setSearch] = useState('')

  const selectedCount = rows.filter((r) => selectedVoyageIds.has(r.voyage.id)).length
  const visibleRows = search.trim() ? rows.filter((r) => r.vessel.name.toLowerCase().includes(search.trim().toLowerCase())) : rows

  return (
    <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-2 dark:border-slate-800 dark:bg-slate-800">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
        >
          <Fuel size={14} className="text-slate-400" />
          운항 중 선박 연료·탄소 현황
          <ChevronDown size={14} className={cn('transition-transform', !expanded && '-rotate-90')} />
        </button>

        {expanded && (
          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="선박명 검색"
              className="w-32 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-[#6366f1] focus:outline-none dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="button" onClick={onSelectAll} className="text-xs font-medium text-[#6366f1] hover:text-[#4f46e5]">
              전체 선택
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button type="button" onClick={onDeselectAll} className="text-xs font-medium text-slate-500 hover:text-slate-700">
              전체 해제
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedCount}/{rows.length}개 지도 표시 중
            </span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {visibleRows.map((row) => (
            <VesselGaugeCard
              key={row.voyage.id}
              row={row}
              selected={selectedVoyageIds.has(row.voyage.id)}
              onToggle={() => onToggleVoyage(row.voyage.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FleetGaugeCard
