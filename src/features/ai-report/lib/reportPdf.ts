import { jsPDF } from 'jspdf'
import type { Vessel, Voyage, EcoSpeedReport } from '@/shared/types'
import type { Translations } from '@/features/i18n/translations'
import type { ReportViewBase } from './reportView'
import type { WeatherPointState } from './openMeteo'
import {
  formatDecimal,
  formatInt,
  formatLocalTime,
  formatSavingValue,
  getPortUtcOffset,
} from './format'

let cachedFontBase64: string | null = null

// jsPDF 기본 폰트에는 한글 글리프가 없어 그대로 쓰면 깨진다 — public/fonts의 NotoSansKR을 임베딩한다
// (docs/specs/AI_REPORT.md 9.2장, docs/specs/KNOWN_PITFALLS.md 7.4). Regular 한 가지 굵기만 있으므로
// 강조는 폰트 굵기가 아니라 크기·색으로만 표현한다(certificatePdf.ts와 동일한 제약).
async function loadKoreanFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64
  const res = await fetch('/fonts/NotoSansKR-Regular.ttf')
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  cachedFontBase64 = btoa(binary)
  return cachedFontBase64
}

export interface ReportPdfParams {
  vessel: Vessel
  voyage: Voyage
  report: EcoSpeedReport
  view: ReportViewBase
  weather: { current: WeatherPointState; arrival: WeatherPointState }
  t: Translations
}

const LEFT = 15
const RIGHT = 195
const CONTENT_WIDTH = RIGHT - LEFT
const PAGE_BOTTOM = 280
const VALUE_X = 105

function savingLabels(t: Translations) {
  return { saved: t.aiReport.savingSuffix, increase: t.aiReport.increaseSuffix }
}

// NotoSansKR-Regular에는 아래첨자(₂)·화살표(→) 글리프가 없어 렌더링 시 조용히 사라진다
// (docs/specs/KNOWN_PITFALLS.md 7.4, certificatePdf.ts와 동일한 제약). PDF 텍스트는 ASCII로 치환한다.
function pdfSafe(s: string): string {
  return s.replace(/₂/g, '2').replace(/→/g, '->')
}

export async function generateReportPdf(params: ReportPdfParams): Promise<jsPDF> {
  const { vessel, voyage, report, view, weather, t } = params
  const fontBase64 = await loadKoreanFontBase64()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64)
  doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal')
  doc.setFont('NotoSansKR', 'normal')
  doc.setTextColor(15, 23, 42)

  const arrivalOffset = getPortUtcOffset(voyage.arrivalPort)

  let y = 20

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_BOTTOM) {
      doc.addPage()
      y = 20
    }
  }

  const sectionTitle = (title: string) => {
    ensureSpace(14)
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(pdfSafe(title), LEFT, y)
    y += 2
    doc.setDrawColor(203, 213, 225)
    doc.line(LEFT, y, RIGHT, y)
    y += 6
  }

  const row = (label: string, value: string) => {
    ensureSpace(6)
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(pdfSafe(label), LEFT, y)
    doc.setTextColor(15, 23, 42)
    doc.text(pdfSafe(value), VALUE_X, y)
    y += 6
  }

  const paragraph = (lines: string[], fontSize = 10, color: [number, number, number] = [51, 65, 85]) => {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    for (const raw of lines) {
      const wrapped: string[] = doc.splitTextToSize(pdfSafe(raw), CONTENT_WIDTH)
      for (const line of wrapped) {
        ensureSpace(5.5)
        doc.text(line, LEFT, y)
        y += 5.5
      }
    }
    doc.setTextColor(15, 23, 42)
  }

  // 1. 제목
  doc.setFontSize(16)
  doc.text('KSF Line — AI 운항 리포트', LEFT, y)
  y += 7
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`${t.aiReport.generated}: ${new Date().toLocaleString('ko-KR')}`, LEFT, y)
  doc.setTextColor(15, 23, 42)
  y += 8

  // 2. 선박명(IMO) + 항로
  doc.setFontSize(11)
  doc.text(`${vessel.name} (IMO ${vessel.imo})`, LEFT, y)
  y += 6
  doc.text(`${voyage.departurePort} -> ${voyage.arrivalPort}`, LEFT, y)
  y += 10

  // 3. 항해 진행 상황
  sectionTitle(t.aiReport.progressLineTitle)
  row(t.aiReport.totalDistance, `${formatInt(voyage.distanceNm)} nm`)
  row(t.aiReport.traveledDistance, `${formatInt(view.progress.traveledNm)} nm`)
  row(t.aiReport.remainingDistance, `${formatInt(view.progress.remainingNm)} nm`)
  row(`${t.aiReport.currentPosition}`, `${formatDecimal(view.progress.percent, 0)}%`)
  y += 4

  // 4. 속도 & RTA/STA 준수
  const term = view.deadline.term
  sectionTitle(`${t.aiReport.speedComparison} & ${t.aiReport.rtaProbability(term)}`)
  row(t.aiReport.liveSpeed, `${formatDecimal(view.currentSpeedKnots)} kts`)
  row(t.aiReport.recSpeed, `${formatDecimal(view.speedPlan.recommendedSpeedKnots)} kts`)
  row(t.aiReport.sta, formatLocalTime(voyage.sta, arrivalOffset))
  row(t.aiReport.rta, voyage.rtaConfirmed ? formatLocalTime(voyage.rta, arrivalOffset) : t.aiReport.rtaUnconfirmedValue)
  row(t.aiReport.etaAtCurrentSpeed, formatLocalTime(view.speedPlan.etaAtCurrent, arrivalOffset))
  row(t.aiReport.etaAtRecommendedSpeed, formatLocalTime(view.speedPlan.etaAtRecommended, arrivalOffset))
  const prob = view.speedPlan.currentSpeedProbability
  const confidenceLabel = { high: t.aiReport.confidenceHigh, medium: t.aiReport.confidenceMedium, low: t.aiReport.confidenceLow }[
    prob.confidence
  ]
  row(`${t.aiReport.rtaProbability(term)} (${t.aiReport.rtaProbabilityDesc})`, `${Math.round(prob.percent)}% · ${confidenceLabel}`)
  row(
    prob.marginHours >= 0 ? t.aiReport.marginBuffer(term, formatDecimal(prob.marginHours)) : t.aiReport.marginDeficit(term, formatDecimal(Math.abs(prob.marginHours))),
    '',
  )
  row(
    '',
    view.speedPlan.recommendedSpeedProbability.percent === 100
      ? t.aiReport.recommendedGuarantee(term)
      : t.aiReport.recommendedInfeasible(term, String(Math.round(view.speedPlan.recommendedSpeedProbability.percent))),
  )
  ensureSpace(6)
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(
    pdfSafe(
      t.aiReport.requiredSpeedFormula(
        formatInt(view.progress.remainingNm),
        formatDecimal(view.speedPlan.hoursUntilDeadline),
        formatDecimal(view.speedPlan.requiredSpeedKnots),
      ),
    ),
    LEFT,
    y,
  )
  doc.setTextColor(15, 23, 42)
  y += 8

  // 5. 연료 절감 & CO2 절감
  sectionTitle(`${t.aiReport.fuelSaving} & ${t.aiReport.co2Saving}`)
  row(
    `${t.aiReport.co2SavingCumulative} (${t.aiReport.vsOriginalPlan})`,
    formatSavingValue(view.speedPlan.co2SavedTon, 1, 'ton', savingLabels(t)).text,
  )
  row(
    `${t.aiReport.co2SavingAdjustment} (${t.aiReport.vsCurrentSpeed})`,
    formatSavingValue(view.speedPlan.co2SavedTonFromCurrent, 1, 'ton', savingLabels(t)).text,
  )
  row(
    `${t.aiReport.fuelSavingCumulative} (${t.aiReport.vsOriginalPlan})`,
    formatSavingValue(view.speedPlan.fuelSavingPercent, 1, '%', savingLabels(t)).text,
  )
  row(
    `${t.aiReport.fuelSavingAdjustment} (${t.aiReport.vsCurrentSpeed})`,
    formatSavingValue(view.speedPlan.fuelSavingPercentFromCurrent, 1, '%', savingLabels(t)).text,
  )
  y += 4

  // 6. 도착항 예상 혼잡도
  sectionTitle(t.aiReport.portCongestionTitle)
  const congestionLabel = { high: t.aiReport.congestionHigh, medium: t.aiReport.congestionMedium, low: t.aiReport.congestionLow }[
    view.congestionTier
  ]
  row(t.aiReport.portCongestionTitle, `${congestionLabel} (${view.congestion.congestionScore}/100)`)
  row(t.aiReport.p75WaitHours, `${formatDecimal(view.congestion.avgWaitHours)}h`)
  row(t.aiReport.berthAvailability, t.aiReport.berthCount(String(view.congestion.berthsAvailable), String(view.congestion.berthsTotal)))
  const trendLabel = { rising: t.aiReport.trendRising, stable: t.aiReport.trendStable, falling: t.aiReport.trendFalling }[
    view.congestion.trend
  ]
  row('', trendLabel)
  if (weather.current.status === 'success') {
    row(t.aiReport.currentAreaWeather, `${weather.current.windSpeedMs.toFixed(1)} m/s · ${weather.current.waveHeightM.toFixed(1)}m`)
  }
  if (weather.arrival.status === 'success') {
    row(t.aiReport.arrivalPortWeather, `${weather.arrival.windSpeedMs.toFixed(1)} m/s · ${weather.arrival.waveHeightM.toFixed(1)}m`)
  }
  y += 4

  // 7. AI 분석 근거
  sectionTitle(t.aiReport.reasoning)
  paragraph(report.reasoning.split('\n').filter((line) => line.trim().length > 0))
  y += 4

  // 8. 운항 고려사항
  sectionTitle(t.aiReport.risks)
  const riskLevelLabel = { high: t.status.high, medium: t.status.medium, low: t.status.low }
  const categoryLabel = {
    weather: t.aiReport.catWeather,
    port: t.aiReport.catPort,
    geopolitical: t.aiReport.catGeopolitical,
    mechanical: t.aiReport.catMechanical,
  }
  for (const risk of report.risks) {
    ensureSpace(10)
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(pdfSafe(`[${riskLevelLabel[risk.level]}] ${risk.title}`), LEFT, y)
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(pdfSafe(categoryLabel[risk.category]), RIGHT, y, { align: 'right' })
    y += 5.5
    paragraph(risk.description.split('\n').filter((line) => line.trim().length > 0), 9, [71, 85, 105])
    y += 2
  }
  y += 2

  // 9. 남은 항로 인근 지역 이슈
  sectionTitle(t.aiReport.regionalIssuesTitle)
  if (view.issues.length === 0) {
    paragraph([t.aiReport.noNearbyIssues], 10, [100, 116, 139])
  } else {
    const severityLabel = { high: t.status.high, medium: t.status.medium, low: t.status.low }
    for (const issue of view.issues) {
      ensureSpace(10)
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text(pdfSafe(`[${severityLabel[issue.severity]}] ${issue.title}`), LEFT, y)
      y += 5.5
      paragraph([issue.description], 9, [71, 85, 105])
      paragraph([`${t.aiReport.source}: ${issue.source}`], 8, [148, 163, 184])
      y += 2
    }
  }

  // 10. 하단 문구
  ensureSpace(10)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('KSF Line — AI 운항 리포팅 생성 (데모 데이터, 참고용).', LEFT, PAGE_BOTTOM + 7)

  return doc
}
