import { OWN_COMPANY_NAME } from '@/shared/constants'
import { formatDate, formatDateTime } from '@/shared/utils/format'
import { formatPortLabel, type Port } from '@/mocks/ports'
import type { RegionalIssue, TyphoonWarning } from '@/mocks/map-overlays'
import type { PortAggregate, PortVesselEntry } from '@/features/dashboard/portAggregation'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function vesselAttributionHtml(entry: PortVesselEntry): string {
  return entry.vessel.company === OWN_COMPANY_NAME
    ? `<span style="color:#6366f1;">자사 선박</span>`
    : `<span style="color:#64748b;">${escapeHtml(entry.vessel.company)}</span>`
}

function portRowDetail(entry: PortVesselEntry, section: 'berthed' | 'departing' | 'arriving'): string {
  const { voyage } = entry
  if (section === 'berthed') {
    return voyage.status === 'preparing'
      ? `출항 예정: ${formatDateTime(voyage.etd)}`
      : `ETA: ${formatDateTime(voyage.eta)}`
  }
  if (section === 'departing') {
    return `목적지: ${voyage.arrivalPort.split(' ')[0]} · ETA ${formatDate(voyage.eta)}`
  }
  return `출발: ${voyage.departurePort.split(' ')[0]} · ETA ${formatDateTime(voyage.eta)}`
}

function portSectionHtml(title: string, color: string, entries: PortVesselEntry[], section: 'berthed' | 'departing' | 'arriving'): string {
  if (entries.length === 0) return ''
  const rows = entries
    .map(
      (entry) => `<div style="margin-top:4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:600;">${escapeHtml(entry.vessel.name)}</span>
          <span style="font-size:11px;">${vesselAttributionHtml(entry)}</span>
        </div>
        <div style="font-size:10px;color:#64748b;">${escapeHtml(portRowDetail(entry, section))}</div>
      </div>`,
    )
    .join('')

  return `<div style="margin-top:8px;">
    <div style="font-size:11px;font-weight:700;color:${color};">${title} (${entries.length})</div>
    ${rows}
  </div>`
}

export function buildPortPopupHtml(port: Port, agg: PortAggregate | undefined): string {
  const berthed = agg?.berthed ?? []
  const departing = agg?.departing ?? []
  const arriving = agg?.arriving ?? []
  const total = berthed.length + departing.length + arriving.length

  const body =
    total === 0
      ? `<div style="margin-top:8px;font-size:11px;color:#94a3b8;">이 항구에 등록된 선박이 없습니다</div>`
      : [
          portSectionHtml('정박', '#16a34a', berthed, 'berthed'),
          portSectionHtml('출항', '#f59e0b', departing, 'departing'),
          portSectionHtml('입항 예정', '#6366f1', arriving, 'arriving'),
        ].join('')

  return `<div style="width:240px;max-height:240px;overflow-y:auto;">
    <div style="font-size:14px;font-weight:700;">${escapeHtml(formatPortLabel(port))}</div>
    <div style="font-size:10px;color:#94a3b8;">${port.code}</div>
    ${body}
  </div>`
}

const TYPHOON_INTENSITY_LABEL: Record<TyphoonWarning['intensity'], string> = {
  TD: '열대저압부(TD)',
  TS: '열대폭풍(TS)',
  TY: '태풍(TY)',
  STY: '강한 태풍(STY)',
}

const TYPHOON_INTENSITY_COLOR: Record<TyphoonWarning['intensity'], string> = {
  TD: '#94a3b8',
  TS: '#f59e0b',
  TY: '#ef4444',
  STY: '#7c3aed',
}

export function buildTyphoonPopupHtml(typhoon: TyphoonWarning): string {
  const color = TYPHOON_INTENSITY_COLOR[typhoon.intensity]
  return `<div style="width:200px;">
    <div style="font-size:14px;font-weight:700;color:${color};">🌀 ${escapeHtml(typhoon.name)}</div>
    <table style="margin-top:6px;font-size:11px;width:100%;">
      <tr><td style="color:#64748b;">강도</td><td style="text-align:right;">${TYPHOON_INTENSITY_LABEL[typhoon.intensity]}</td></tr>
      <tr><td style="color:#64748b;">최대 풍속</td><td style="text-align:right;">${typhoon.windSpeedKnots}kt</td></tr>
      <tr><td style="color:#64748b;">반경</td><td style="text-align:right;">${typhoon.radiusKm}km</td></tr>
      <tr><td style="color:#64748b;">이동</td><td style="text-align:right;">${escapeHtml(typhoon.movingDir)} ${typhoon.movingSpeedKnots}kt</td></tr>
    </table>
  </div>`
}

const SEVERITY_EMOJI: Record<RegionalIssue['severity'], string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
}

export function buildIssuePopupHtml(issue: RegionalIssue): string {
  return `<div style="width:220px;">
    <div style="font-size:13px;font-weight:700;">${SEVERITY_EMOJI[issue.severity]} ${escapeHtml(issue.title)}</div>
    <div style="margin-top:4px;font-size:11px;color:#334155;">${escapeHtml(issue.description)}</div>
    <div style="margin-top:4px;font-size:10px;color:#94a3b8;">출처: ${escapeHtml(issue.source)}</div>
  </div>`
}
