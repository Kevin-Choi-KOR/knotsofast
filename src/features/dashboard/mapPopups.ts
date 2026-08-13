import { OWN_COMPANY_NAME } from '@/shared/constants'
import { formatDate, formatDateTime } from '@/shared/utils/format'
import { formatPortLabel, type Port } from '@/mocks/ports'
import type { RegionalIssue, TyphoonWarning } from '@/mocks/map-overlays'
import type { PortAggregate, PortVesselEntry } from '@/features/dashboard/portAggregation'
import type { MapLabels } from '@/features/dashboard/mapLabels'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function vesselAttributionHtml(entry: PortVesselEntry, labels: MapLabels): string {
  return entry.vessel.company === OWN_COMPANY_NAME
    ? `<span style="color:#6366f1;">${escapeHtml(labels.ownFleet)}</span>`
    : `<span style="color:#64748b;">${escapeHtml(entry.vessel.company)}</span>`
}

function portRowDetail(entry: PortVesselEntry, section: 'berthed' | 'departing' | 'arriving', labels: MapLabels): string {
  const { voyage } = entry
  if (section === 'berthed') {
    return voyage.status === 'preparing'
      ? labels.portEtd(formatDateTime(voyage.etd))
      : `${labels.eta}: ${formatDateTime(voyage.eta)}`
  }
  if (section === 'departing') {
    return labels.portBoundFor(voyage.arrivalPort.split(' ')[0], formatDate(voyage.eta))
  }
  return labels.portFrom(voyage.departurePort.split(' ')[0], formatDateTime(voyage.eta))
}

function portSectionHtml(
  title: string,
  color: string,
  entries: PortVesselEntry[],
  section: 'berthed' | 'departing' | 'arriving',
  labels: MapLabels,
): string {
  if (entries.length === 0) return ''
  const rows = entries
    .map(
      (entry) => `<div style="margin-top:4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:600;">${escapeHtml(entry.vessel.name)}</span>
          <span style="font-size:11px;">${vesselAttributionHtml(entry, labels)}</span>
        </div>
        <div style="font-size:10px;color:#64748b;">${escapeHtml(portRowDetail(entry, section, labels))}</div>
      </div>`,
    )
    .join('')

  return `<div style="margin-top:8px;">
    <div style="font-size:11px;font-weight:700;color:${color};">${escapeHtml(title)} (${entries.length})</div>
    ${rows}
  </div>`
}

export function buildPortPopupHtml(port: Port, agg: PortAggregate | undefined, labels: MapLabels): string {
  const berthed = agg?.berthed ?? []
  const departing = agg?.departing ?? []
  const arriving = agg?.arriving ?? []
  const total = berthed.length + departing.length + arriving.length

  const body =
    total === 0
      ? `<div style="margin-top:8px;font-size:11px;color:#94a3b8;">${escapeHtml(labels.portNoVessels)}</div>`
      : [
          portSectionHtml(labels.portBerthed, '#16a34a', berthed, 'berthed', labels),
          portSectionHtml(labels.portDeparting, '#f59e0b', departing, 'departing', labels),
          portSectionHtml(labels.portArriving, '#6366f1', arriving, 'arriving', labels),
        ].join('')

  return `<div style="width:240px;max-height:240px;overflow-y:auto;">
    <div style="font-size:14px;font-weight:700;">${escapeHtml(formatPortLabel(port))}</div>
    <div style="font-size:10px;color:#94a3b8;">${port.code}</div>
    ${body}
  </div>`
}

const TYPHOON_INTENSITY_COLOR: Record<TyphoonWarning['intensity'], string> = {
  TD: '#94a3b8',
  TS: '#f59e0b',
  TY: '#ef4444',
  STY: '#7c3aed',
}

export function buildTyphoonPopupHtml(typhoon: TyphoonWarning, labels: MapLabels): string {
  const color = TYPHOON_INTENSITY_COLOR[typhoon.intensity]
  return `<div style="width:200px;">
    <div style="font-size:14px;font-weight:700;color:${color};">🌀 ${escapeHtml(typhoon.name)}</div>
    <table style="margin-top:6px;font-size:11px;width:100%;">
      <tr><td style="color:#64748b;">${escapeHtml(labels.intensity)}</td><td style="text-align:right;">${escapeHtml(labels.typhoonIntensity(typhoon.intensity))}</td></tr>
      <tr><td style="color:#64748b;">${escapeHtml(labels.maxWind)}</td><td style="text-align:right;">${typhoon.windSpeedKnots}kt</td></tr>
      <tr><td style="color:#64748b;">${escapeHtml(labels.radius)}</td><td style="text-align:right;">${typhoon.radiusKm}km</td></tr>
      <tr><td style="color:#64748b;">${escapeHtml(labels.movingDir)}</td><td style="text-align:right;">${escapeHtml(typhoon.movingDir)} ${typhoon.movingSpeedKnots}kt</td></tr>
    </table>
  </div>`
}

const SEVERITY_EMOJI: Record<RegionalIssue['severity'], string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
}

export function buildIssuePopupHtml(issue: RegionalIssue, labels: MapLabels): string {
  return `<div style="width:220px;">
    <div style="font-size:13px;font-weight:700;">${SEVERITY_EMOJI[issue.severity]} ${escapeHtml(issue.title)}</div>
    <div style="margin-top:4px;font-size:11px;color:#334155;">${escapeHtml(issue.description)}</div>
    <div style="margin-top:4px;font-size:10px;color:#94a3b8;">${escapeHtml(labels.source)}: ${escapeHtml(issue.source)}</div>
  </div>`
}
