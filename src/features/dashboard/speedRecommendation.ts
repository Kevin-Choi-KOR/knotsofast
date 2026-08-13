// DASHBOARD.md 6.4장 — Knot 버튼과 지도 팝업(9.11장)의 버튼이 같은 API를 호출한다.

export interface SpeedRecommendationPayload {
  vesselId: string
  vesselName: string
  imo: string
  voyageId: string
  departurePort: string
  arrivalPort: string
  currentSpeedKnots: number
  recommendedSpeedKnots: number
  plannedSpeedKnots: number
  eta: string
}

export interface SpeedRecommendationResult {
  success: true
  targetUrl: string
  sentAt: string
}

export async function sendSpeedRecommendation(payload: SpeedRecommendationPayload): Promise<SpeedRecommendationResult> {
  const res = await fetch('/api/vessel-commands/speed-recommendation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`speed recommendation request failed: ${res.status}`)
  return (await res.json()) as SpeedRecommendationResult
}

export function formatSpeedRecommendationSuccessAlert(
  payload: SpeedRecommendationPayload,
  result: SpeedRecommendationResult,
): string {
  return [
    '✅ 제안속도 전송 완료',
    '',
    `선박: ${payload.vesselName} (IMO ${payload.imo})`,
    `항로: ${payload.departurePort} → ${payload.arrivalPort}`,
    `현재 속도: ${payload.currentSpeedKnots} kts`,
    `제안 속도: ${payload.recommendedSpeedKnots} kts`,
    `ETA: ${new Date(payload.eta).toLocaleString('ko-KR')}`,
    `전송 시각: ${new Date(result.sentAt).toLocaleString('ko-KR')}`,
    `전송처: ${result.targetUrl}`,
  ].join('\n')
}

export const SPEED_RECOMMENDATION_FAIL_ALERT = '❌ 제안속도 전송 실패'
