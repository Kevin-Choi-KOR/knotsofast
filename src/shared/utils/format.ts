import type { FuelPoint, FuelType } from '@/shared/types'

// 날짜·숫자 로케일은 UI 언어와 무관하게 항상 ko-KR 고정이다.

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// toLocaleString은 좁은 칸에서 줄바꿈·잘림을 유발하므로 직접 포맷한다.
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}`
}

export function formatNumber(n: number, d = 1): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: d })
}

export function formatKnots(n: number): string {
  return `${formatNumber(n)} kts`
}

export function formatTon(n: number): string {
  return `${formatNumber(n)} ton`
}

// 카운트업 애니메이션 중 레이아웃 흔들림을 막기 위한 자릿수 고정 버전.
export function formatTonFixed(n: number, d = 1): string {
  const fixed = n.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })
  return `${fixed} ton`
}

export function formatNm(n: number): string {
  return `${formatNumber(n, 0)} nm`
}

export function fuelEmissionFactor(type?: FuelType): number {
  switch (type) {
    case 'MGO':
      return 3.206
    case 'LNG':
      return 2.75
    case 'HFO':
    default:
      return 3.114
  }
}

// 커브 범위 밖은 가장 가까운 끝점으로 clamp한다.
export function interpolateFuelTonPerDay(curve: FuelPoint[], speed: number): number {
  if (curve.length === 0) return 0
  const sorted = [...curve].sort((a, b) => a.speedKnots - b.speedKnots)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (speed <= first.speedKnots) return first.fuelTonPerDay
  if (speed >= last.speedKnots) return last.fuelTonPerDay

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (speed >= a.speedKnots && speed <= b.speedKnots) {
      const ratio = (speed - a.speedKnots) / (b.speedKnots - a.speedKnots)
      return a.fuelTonPerDay + ratio * (b.fuelTonPerDay - a.fuelTonPerDay)
    }
  }
  return last.fuelTonPerDay
}
