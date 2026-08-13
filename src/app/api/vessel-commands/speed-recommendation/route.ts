import { NextResponse } from 'next/server'

// DASHBOARD.md 6.4장 — 실제 외부 전송은 하지 않는다. 900~1400ms 인위적 지연 후 성공 응답만
// 돌려주는 데모용 시뮬레이션이다. targetUrl은 placeholder 문자열.
export async function POST() {
  const delayMs = 900 + Math.random() * 500
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  return NextResponse.json({
    success: true,
    targetUrl: 'https://fleet-ops.ksfline.example/api/speed-recommendation',
    sentAt: new Date().toISOString(),
  })
}
