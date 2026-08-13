import { PORTS } from '@/mocks/ports'

/**
 * 표시 전용 포맷 함수 — 계산 로직(calculations.ts)과 분리한다.
 * 날짜/숫자는 UI 언어와 무관하게 항상 ko-KR 로케일로 고정한다(docs/specs/AI_REPORT.md 12장 엣지케이스 #1).
 */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 항구명 문자열(예: "부산 (Busan)")로 항구 사전의 utcOffset을 찾는다. 못 찾으면 9(KST)로 폴백한다. */
export function getPortUtcOffset(portLabel: string): number {
  const normalized = portLabel.toLowerCase()
  const port = PORTS.find((p) => portLabel.includes(p.name) || normalized.includes(p.nameEn.toLowerCase()))
  return port?.utcOffset ?? 9
}

/** 항구가 아닌 좌표(선박 현재 위치 등)는 경도 ÷ 15로 오프셋을 어림한다. */
export function getCoordUtcOffset(lng: number): number {
  return Math.round(lng / 15)
}

/** "부산 (Busan)" → "부산" — 공백 기준 첫 토큰만 노출. */
export function portFirstToken(portLabel: string): string {
  return portLabel.split(' ')[0]
}

function shiftToOffset(iso: string, utcOffsetHours: number): Date {
  return new Date(new Date(iso).getTime() + utcOffsetHours * 3_600_000)
}

/** `YYYY-MM-DD HH:mm LT (UTC±X)` — Date.getTime()은 항상 절대 UTC이므로 계산은 안전하고, 표시만 바꾼다. */
export function formatLocalTime(iso: string, utcOffsetHours: number): string {
  const d = shiftToOffset(iso, utcOffsetHours)
  const y = d.getUTCFullYear()
  const mo = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())
  const h = pad(d.getUTCHours())
  const mi = pad(d.getUTCMinutes())
  const sign = utcOffsetHours >= 0 ? '+' : '-'
  return `${y}-${mo}-${day} ${h}:${mi} LT (UTC${sign}${Math.abs(utcOffsetHours)})`
}

/** AI 분석 일시 전용 자연어 포맷: "2026년 8월 2일 6시 0분" */
export function formatLocalTimeNatural(iso: string, utcOffsetHours: number): string {
  const d = shiftToOffset(iso, utcOffsetHours)
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${d.getUTCHours()}시 ${pad(d.getUTCMinutes())}분`
}

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString('ko-KR')
}

export function formatDecimal(n: number, decimals = 1): string {
  return n.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export interface SavingLabels {
  saved: string
  increase: string
}

export interface SavingFormat {
  text: string
  increase: boolean
  absValue: number
}

/**
 * 연료·CO2 절감량은 음수(=증가)일 수 있다. 항상 절댓값으로 표시하고 방향은 접미사로만 구분한다
 * (docs/specs/AI_REPORT.md 6.9장). PDF 내보내기에도 동일하게 적용한다.
 */
export function formatSavingValue(n: number, decimals: number, unit: string, labels: SavingLabels): SavingFormat {
  const increase = n < 0
  const absValue = Math.abs(n)
  const text = `${formatDecimal(absValue, decimals)}${unit} ${increase ? labels.increase : labels.saved}`
  return { text, increase, absValue }
}
