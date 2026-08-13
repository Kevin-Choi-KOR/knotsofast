'use client'

import { useState, type ReactNode } from 'react'
import { AlertTriangle, Anchor, Sparkles, X } from 'lucide-react'
import { MOCK_DANGER_ZONES, MOCK_REGIONAL_ISSUES, type DangerZone, type RegionalIssue } from '@/mocks/map-overlays'
import { findPort, type Port } from '@/mocks/ports'
import { RiskBadge } from '@/shared/components/StatusBadge'
import { ISSUE_TYPE_COLOR, ISSUE_TYPE_LABEL } from '@/features/dashboard/issueTypes'
import type { PortAggregate } from '@/features/dashboard/portAggregation'

const SEVERITY_ORDER = ['high', 'medium', 'low'] as const

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#6366f1]" />
          <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        <div className="mt-3 space-y-3 text-xs text-slate-700 dark:text-slate-300">{children}</div>
      </div>
    </div>
  )
}

// DASHBOARD.md 8.3장 — 이슈 요약 본문.
function IssueSummaryModal({ onClose }: { onClose: () => void }) {
  const bySeverity: Record<RegionalIssue['severity'], number> = { high: 0, medium: 0, low: 0 }
  for (const issue of MOCK_REGIONAL_ISSUES) bySeverity[issue.severity]++

  const byType = new Map<RegionalIssue['type'], number>()
  for (const issue of MOCK_REGIONAL_ISSUES) byType.set(issue.type, (byType.get(issue.type) ?? 0) + 1)

  const highIssues = MOCK_REGIONAL_ISSUES.filter((issue) => issue.severity === 'high')

  return (
    <ModalShell title="지역 이슈 요약" onClose={onClose}>
      <p>
        현재 지도에 총 <strong>{MOCK_REGIONAL_ISSUES.length}건</strong>의 지역 이슈가 표시되고 있습니다.
      </p>

      <div className="flex items-center gap-3">
        {SEVERITY_ORDER.map((level) => (
          <span key={level} className="flex items-center gap-1">
            <RiskBadge level={level} />
            {bySeverity[level]}건
          </span>
        ))}
      </div>

      <div className="space-y-1">
        {[...byType.entries()].map(([type, count]) => (
          <div key={type} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ISSUE_TYPE_COLOR[type] }} />
              {ISSUE_TYPE_LABEL[type]}
            </span>
            <span>{count}건</span>
          </div>
        ))}
      </div>

      {highIssues.length > 0 && (
        <div>
          <p className="font-semibold text-red-600">⚠ 심각도 높음 — 우선 확인 필요</p>
          <ul className="mt-1 list-disc pl-4">
            {highIssues.map((issue) => (
              <li key={issue.id}>{issue.title}</li>
            ))}
          </ul>
        </div>
      )}
    </ModalShell>
  )
}

interface PortEntry {
  code: string
  port: Port
  agg: PortAggregate
}

// DASHBOARD.md 8.3장 — 항구 요약 본문.
function PortSummaryModal({ entries, onClose }: { entries: PortEntry[]; onClose: () => void }) {
  let totalBerthed = 0
  let totalDeparting = 0
  let totalArriving = 0
  let busiest: { code: string; port: Port; total: number } | null = null

  for (const entry of entries) {
    totalBerthed += entry.agg.berthed.length
    totalDeparting += entry.agg.departing.length
    totalArriving += entry.agg.arriving.length
    const total = entry.agg.berthed.length + entry.agg.departing.length + entry.agg.arriving.length
    if (!busiest || total > busiest.total) busiest = { code: entry.code, port: entry.port, total }
  }

  return (
    <ModalShell title="항구 현황 요약" onClose={onClose}>
      <p>
        현재 <strong>{entries.length}개</strong> 항구에 선박이 집계되고 있습니다.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '정박', value: totalBerthed },
          { label: '출항', value: totalDeparting },
          { label: '입항예정', value: totalArriving },
        ].map((item) => (
          <div key={item.label} className="rounded bg-slate-100 p-2 text-center dark:bg-slate-700">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.value}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.label}</div>
          </div>
        ))}
      </div>

      {busiest && (
        <p>
          가장 붐비는 항구: <strong>{busiest.port.name} ({busiest.code})</strong> — 총 {busiest.total}척
        </p>
      )}
    </ModalShell>
  )
}

interface IssueSectionProps {
  onFocusIssue: (issue: RegionalIssue) => void
  onFocusDangerZone: (zone: DangerZone) => void
}

// DASHBOARD.md 8.1장 — 지역 이슈 리스트.
function IssueSection({ onFocusIssue, onFocusDangerZone }: IssueSectionProps) {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const total = MOCK_REGIONAL_ISSUES.length + MOCK_DANGER_ZONES.length

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={14} className="shrink-0 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">지역 이슈 ({total}건)</span>
        <button
          type="button"
          onClick={() => setSummaryOpen(true)}
          className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Sparkles size={10} />
          요약
        </button>
      </div>

      <div className="mt-1.5 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
        {MOCK_REGIONAL_ISSUES.map((issue) => (
          <button
            key={issue.id}
            type="button"
            title={`${issue.description} (클릭 시 지도에서 위치로 이동 후 상세 정보 표시)`}
            onClick={() => onFocusIssue(issue)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ISSUE_TYPE_COLOR[issue.type] }} />
            <span className="text-xs text-slate-900 dark:text-slate-100">{issue.title}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{ISSUE_TYPE_LABEL[issue.type]}</span>
            <RiskBadge level={issue.severity} />
          </button>
        ))}
        {MOCK_DANGER_ZONES.map((zone) => (
          <button
            key={zone.id}
            type="button"
            title={`${zone.label} (클릭 시 지도에서 위치로 이동, 반경 ${zone.radiusKm}km)`}
            onClick={() => onFocusDangerZone(zone)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: zone.color }} />
            <span className="text-xs text-slate-900 dark:text-slate-100">{zone.label}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">위험구역</span>
          </button>
        ))}
      </div>

      {summaryOpen && <IssueSummaryModal onClose={() => setSummaryOpen(false)} />}
    </div>
  )
}

interface PortSectionProps {
  portAggregates: Map<string, PortAggregate>
  onFocusPort: (code: string) => void
}

// DASHBOARD.md 8.2장 — 항구 현황 리스트. 집계는 9.6장 aggregateByPort를 그대로 재사용(prop으로 전달받음).
function PortSection({ portAggregates, onFocusPort }: PortSectionProps) {
  const [summaryOpen, setSummaryOpen] = useState(false)

  const entries: PortEntry[] = [...portAggregates.entries()].flatMap(([code, agg]) => {
    const port = findPort(code)
    return port ? [{ code, port, agg }] : []
  })

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Anchor size={14} className="shrink-0 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">항구 현황 ({entries.length}곳)</span>
        <button
          type="button"
          onClick={() => setSummaryOpen(true)}
          className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Sparkles size={10} />
          요약
        </button>
      </div>

      <div className="mt-1.5 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
        {entries.map(({ code, port, agg }) => (
          <button
            key={code}
            type="button"
            onClick={() => onFocusPort(code)}
            className="flex shrink-0 flex-col items-start rounded-lg border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {port.name} ({code})
            </span>
            <span className="flex items-center gap-2 text-[10px] font-medium">
              <span className="text-green-600 dark:text-green-400">정박 {agg.berthed.length}</span>
              <span className="text-amber-600 dark:text-amber-400">출항 {agg.departing.length}</span>
              <span className="text-[#6366f1]">입항예정 {agg.arriving.length}</span>
            </span>
          </button>
        ))}
      </div>

      {summaryOpen && <PortSummaryModal entries={entries} onClose={() => setSummaryOpen(false)} />}
    </div>
  )
}

export interface ListPanelProps {
  showIssues: boolean
  showPorts: boolean
  portAggregates: Map<string, PortAggregate>
  onFocusIssue: (issue: RegionalIssue) => void
  onFocusDangerZone: (zone: DangerZone) => void
  onFocusPort: (code: string) => void
}

// DASHBOARD.md 8장 — "이슈" 또는 "항구" 필터가 켜져 있을 때만 렌더링한다. 둘 다 꺼져 있으면
// 빈 공백을 남기지 않도록 아무것도(컨테이너조차) 렌더링하지 않는다.
export function ListPanel({ showIssues, showPorts, portAggregates, onFocusIssue, onFocusDangerZone, onFocusPort }: ListPanelProps) {
  if (!showIssues && !showPorts) return null

  return (
    <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-2 dark:border-slate-800 dark:bg-slate-800">
      {showIssues && <IssueSection onFocusIssue={onFocusIssue} onFocusDangerZone={onFocusDangerZone} />}
      {showPorts && <PortSection portAggregates={portAggregates} onFocusPort={onFocusPort} />}
    </div>
  )
}

export default ListPanel
