import {
  getPortUtcOffset,
  getCoordUtcOffset,
  portFirstToken,
  formatLocalTime,
  formatLocalTimeNatural,
  formatInt,
  formatDecimal,
} from '@/shared/lib/localTime'

/**
 * 표시 전용 포맷 함수 — 계산 로직(calculations.ts)과 분리한다.
 * 날짜/숫자는 UI 언어와 무관하게 항상 ko-KR 로케일로 고정한다(docs/specs/AI_REPORT.md 12장 엣지케이스 #1).
 *
 * 현지시각(LT) 포맷은 물류 일정 관리 화면과 공유하므로 shared/lib/localTime에 있다 — 여기서는 재수출만 한다.
 */
export { getPortUtcOffset, getCoordUtcOffset, portFirstToken, formatLocalTime, formatLocalTimeNatural, formatInt, formatDecimal }

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
