/**
 * 커스텀 날짜·시각 위젯 상태 변환(docs/specs/SCHEDULE.md 5.6장).
 * 네이티브 `datetime-local`의 오전/오후 순서를 웹에서 제어할 수 없어, 날짜 + 12시간제 + 분 +
 * 오전/오후를 직접 조합해 순서를 고정한다.
 */

export type AmPm = 'AM' | 'PM'

export interface LocalDateTimeParts {
  date: string
  hour12: string
  minute: string
  ampm: AmPm
}

function pad2(n: number | string): string {
  return String(n).padStart(2, '0')
}

/** "2026-08-10T14:30" → {date, hour12, minute, ampm}. 비어 있으면 기본값. */
export function splitLocalDateTime(local: string): LocalDateTimeParts {
  if (!local) return { date: '', hour12: '9', minute: '00', ampm: 'AM' }
  const [date, time] = local.split('T')
  const [hStr, mStr] = (time ?? '00:00').split(':')
  const h24 = Number(hStr)
  const ampm: AmPm = h24 >= 12 ? 'PM' : 'AM'
  const hour12 = String(h24 % 12 === 0 ? 12 : h24 % 12)
  return { date, hour12, minute: mStr ?? '00', ampm }
}

/**
 * {date, hour12, minute, ampm} → "YYYY-MM-DDTHH:mm".
 * 날짜를 고르기 전에 시·분·오전오후를 먼저 바꿀 수 있으므로, 날짜가 비어 있으면 오늘 날짜로
 * 채워 항상 완전한 값을 반환한다 — 그러지 않으면 그 선택이 조용히 버려진다.
 */
export function joinLocalDateTime(date: string, hour12: string, minute: string, ampm: AmPm): string {
  const d = date || new Date().toISOString().slice(0, 10)
  const h24 = (Number(hour12) % 12) + (ampm === 'PM' ? 12 : 0)
  return `${d}T${pad2(h24)}:${pad2(minute)}`
}

export function toIso(local: string): string {
  return local ? new Date(local).toISOString() : ''
}

/**
 * ISO → "YYYY-MM-DDTHH:mm". `iso.slice(0, 16)`을 쓰면 안 된다 — UTC 문자열을 그대로 자르면
 * 브라우저 로컬 타임존 변환이 일어나지 않아 목록(toLocaleString)과 모달의 시·분이 어긋난다.
 * 반드시 Date의 로컬 getter로 재구성한다.
 */
export function isoToLocal(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  const h = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  return `${y}-${mo}-${day}T${h}:${mi}`
}
