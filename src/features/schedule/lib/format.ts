/**
 * ko-KR 고정 날짜·숫자 포맷(docs/specs/SCHEDULE.md 6.6장). UI 언어와 무관하게 항상 이 로케일을 쓴다.
 * 목록·모달의 ETD/ETA/RTA/STA 시각 표시는 이 함수가 아니라 항구 기준 현지시각
 * (@/shared/lib/localTime의 formatLocalTime, 6.8장)을 쓴다 — 이 함수는 브라우저 타임존 기준이라 다르다.
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: decimals })
}

export function formatNm(n: number): string {
  return `${formatNumber(n, 0)} nm`
}
