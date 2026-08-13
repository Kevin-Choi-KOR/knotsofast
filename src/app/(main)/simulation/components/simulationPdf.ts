import { jsPDF } from 'jspdf'
import type { Vessel, Voyage } from '@/shared/types'
import type { SimInputs, SimulationResult } from '@/shared/utils/simulation'
import { CONGESTION_WAIT_HOURS } from '@/mocks/simulation'

// Helvetica가 지원하는 예외 문자 — 이 밖의 non-Latin-1 문자는 '?'로 치환한다.
const WINANSI_SAFE_EXTRA = new Set(['—', '–', '‘', '’', '“', '”', '…', '•', '€'])

export function safeText(str: string): string {
  let replaced = false
  let out = ''
  for (const ch of str) {
    if (ch.codePointAt(0)! <= 0xff || WINANSI_SAFE_EXTRA.has(ch)) {
      out += ch
    } else {
      out += '?'
      replaced = true
    }
  }
  if (replaced && process.env.NODE_ENV !== 'production') {
    console.warn('[simulationPdf] non Latin-1 characters replaced with "?":', str)
  }
  return out
}

// "부산 (Busan)" → "Busan" — 괄호 안이 없으면 원문 그대로.
export function extractEnglishPort(port: string): string {
  const match = port.match(/\(([^)]+)\)/)
  return match ? match[1] : port
}

const CONGESTION_EN: Record<SimInputs['portCongestion'], string> = {
  low: 'Clear',
  medium: 'Moderate',
  high: 'Congested',
  severe: 'Severe',
}

function departureAdjustmentText(offset: number): string {
  if (offset > 0) return `+${offset}h delay`
  if (offset < 0) return `${Math.abs(offset)}h earlier`
  return 'No change'
}

interface SimulationPdfParams {
  voyage: Voyage
  vessel: Vessel
  applied: SimInputs
  compareVoyage: Voyage | null
  planned: SimulationResult
  simulated: SimulationResult & { eta: Date }
  historical: SimulationResult | null
  saving: { fuel: number; cost: number; co2: number }
  portWaitHours: number
  portWaitCostUsd: number
}

export function generateSimulationPdf(params: SimulationPdfParams): jsPDF {
  const { voyage, vessel, applied, compareVoyage, planned, simulated, historical, saving, portWaitHours, portWaitCostUsd } =
    params

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const left = 15
  const right = 195
  let y = 20

  const text = (s: string, x: number, yy: number) => doc.text(safeText(s), x, yy)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  text('KSF Line — Voyage Simulation Report', left, y)
  y += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  text(`Generated: ${new Date().toLocaleString('en-US')}`, left, y)
  doc.setTextColor(0)
  y += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  text(`Vessel: ${vessel.name}  (IMO ${vessel.imo})`, left, y)
  y += 6
  text(`Route: ${extractEnglishPort(voyage.departurePort)} -> ${extractEnglishPort(voyage.arrivalPort)}`, left, y)
  y += 10

  const sectionTitle = (title: string) => {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    text(title, left, y)
    y += 2
    doc.setDrawColor(210)
    doc.line(left, y, right, y)
    y += 6
  }

  const row = (label: string, value: string) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    text(label, left, y)
    text(value, 115, y)
    y += 6
  }

  // 섹션 1 — Simulation Conditions
  sectionTitle('Simulation Conditions')
  row('Departure Adjustment', departureAdjustmentText(applied.departureOffset))
  row('Speed', `${applied.speedKnots} kts`)
  row('Cargo Load', `${applied.cargoPercent}%`)
  row('Route', applied.route === 'suez' ? 'Suez Canal' : 'Cape of Good Hope')
  row(
    'Destination Port Congestion',
    `${CONGESTION_EN[applied.portCongestion]} (~${CONGESTION_WAIT_HOURS[applied.portCongestion]}h wait)`,
  )
  const berthWaitHours = Math.max(0, ((100 - applied.berthProgress) / 100) * 30)
  row('Berth Unloading Progress (vessel ahead)', `${applied.berthProgress}% (~${berthWaitHours.toFixed(1)}h wait)`)
  y += 4

  // 섹션 2 — Results Summary
  sectionTitle('Results Summary')
  const cols = [left, 80, 122, 164]
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  text('Metric', cols[0], y)
  text('Planned', cols[1], y)
  text('Simulated', cols[2], y)
  text('Historical', cols[3], y)
  y += 2
  doc.setDrawColor(230)
  doc.line(left, y, right, y)
  y += 6

  const metricRow = (
    label: string,
    plannedVal: string,
    simulatedVal: string,
    historicalVal: string,
  ) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    text(label, cols[0], y)
    text(plannedVal, cols[1], y)
    text(simulatedVal, cols[2], y)
    text(historicalVal, cols[3], y)
    y += 6
  }

  const dash = '-'
  metricRow(
    'Fuel (ton)',
    Math.round(planned.fuel).toLocaleString('en-US'),
    Math.round(simulated.fuel).toLocaleString('en-US'),
    historical ? Math.round(historical.fuel).toLocaleString('en-US') : dash,
  )
  metricRow(
    'Cost (USD)',
    `$${Math.round(planned.cost).toLocaleString('en-US')}`,
    `$${Math.round(simulated.cost).toLocaleString('en-US')}`,
    historical ? `$${Math.round(historical.cost).toLocaleString('en-US')}` : dash,
  )
  metricRow(
    'CO2 (ton)',
    Math.round(planned.co2).toLocaleString('en-US'),
    Math.round(simulated.co2).toLocaleString('en-US'),
    historical ? Math.round(historical.co2).toLocaleString('en-US') : dash,
  )
  metricRow('Days', planned.days.toFixed(1), simulated.days.toFixed(1), historical ? historical.days.toFixed(1) : dash)

  if (compareVoyage && historical) {
    doc.setFontSize(8)
    doc.setTextColor(120)
    text(
      `Historical reference: ${extractEnglishPort(compareVoyage.departurePort)} -> ${extractEnglishPort(compareVoyage.arrivalPort)} (${compareVoyage.id})`,
      left,
      y,
    )
    doc.setTextColor(0)
    y += 6
  }
  y += 4

  // 섹션 3 — Savings vs Current Plan (부호는 PDF 전용 관례: 절감 "-", 증가 "+")
  sectionTitle('Savings vs Current Plan')
  const signed = (v: number, unit: string) => `${v >= 0 ? '-' : '+'}${Math.abs(v).toFixed(unit === '$' ? 0 : 1)}${unit === '$' ? '' : unit}`
  row('Fuel', `${signed(saving.fuel, ' ton')}`)
  row('Cost', `${saving.cost >= 0 ? '-' : '+'}$${Math.abs(Math.round(saving.cost)).toLocaleString('en-US')}`)
  row('CO2', `${signed(saving.co2, ' ton')}`)
  y += 4

  // 섹션 4 — Arrival & Port Wait
  sectionTitle('Arrival & Port Wait')
  row('Planned ETA', new Date(voyage.eta).toLocaleString('en-US'))
  row('Simulated ETA', simulated.eta.toLocaleString('en-US'))
  row('Expected Port Wait', `${portWaitHours}h`)
  row('Estimated Waiting Cost', `$${Math.round(portWaitCostUsd).toLocaleString('en-US')}`)

  doc.setFontSize(8)
  doc.setTextColor(120)
  text('Generated by KSF Line — Logistics Simulation (demo data, for planning reference only).', left, 287)

  return doc
}
