import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { computeRequiredSpeedKnots } from '@/features/ai-report/lib/calculations'
import { fetchPointWeather } from '@/features/ai-report/lib/openMeteo'
import { normalizeLineBreaks } from '@/features/ai-report/lib/textNormalize'
import { getPortUtcOffset, formatLocalTime } from '@/features/ai-report/lib/format'
import type { AiReanalyzeRequest, AiReanalyzeResponse } from '@/features/ai-report/lib/reanalyzeTypes'
import type { RiskItem } from '@/shared/types'

export const runtime = 'nodejs'

const RISK_LEVELS = new Set(['high', 'medium', 'low'])
const RISK_CATEGORIES = new Set(['weather', 'port', 'geopolitical', 'mechanical'])
const DEFAULT_MODEL = 'gemini-2.5-pro'

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isValidRequest(body: unknown): body is AiReanalyzeRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (b.lang !== 'ko' && b.lang !== 'en') return false
  if (b.deadlineTerm !== 'RTA' && b.deadlineTerm !== 'STA') return false
  if (typeof b.deadlineAt !== 'string' || Number.isNaN(Date.parse(b.deadlineAt))) return false
  if (typeof b.nowIso !== 'string' || Number.isNaN(Date.parse(b.nowIso))) return false
  if (typeof b.baselineEtaAt !== 'string' || Number.isNaN(Date.parse(b.baselineEtaAt))) return false
  if (!isFiniteNumber(b.currentSpeedKnots)) return false
  if (!isFiniteNumber(b.planSpeedKnots)) return false
  if (!isFiniteNumber(b.baselineRecommendedSpeedKnots)) return false

  const vessel = b.vessel as Record<string, unknown> | undefined
  if (!vessel || typeof vessel.name !== 'string' || typeof vessel.type !== 'string' || typeof vessel.imo !== 'string') {
    return false
  }
  const route = b.route as Record<string, unknown> | undefined
  if (!route || typeof route.departurePort !== 'string' || typeof route.arrivalPort !== 'string') return false
  const speedRange = b.speedRangeKnots as Record<string, unknown> | undefined
  if (!speedRange || !isFiniteNumber(speedRange.min) || !isFiniteNumber(speedRange.max)) return false
  if (!Array.isArray(b.fuelCurve)) return false
  const congestion = b.congestion as Record<string, unknown> | undefined
  if (!congestion || !isFiniteNumber(congestion.avgWaitHours)) return false
  if (!Array.isArray(b.nearbyIssues)) return false
  const progress = b.progress as Record<string, unknown> | undefined
  if (!progress || !isFiniteNumber(progress.remainingNm) || !isFiniteNumber(progress.traveledNm)) return false

  return true
}

function buildPrompt(body: AiReanalyzeRequest, requiredSpeedKnots: number, deadlineAtLocal: string, weather: {
  current: { windSpeedMs: number | null; waveHeightM: number | null }
  arrival: { windSpeedMs: number | null; waveHeightM: number | null }
}): string {
  const { vessel, route, speedRangeKnots, fuelCurve, congestion, nearbyIssues } = body
  const hoursUntilDeadline = Math.max(0, (Date.parse(body.deadlineAt) - Date.parse(body.nowIso)) / 3_600_000)

  const fuelCurveStr = fuelCurve.map((p) => `${p.speedKnots}kts -> ${p.fuelTonPerDay} ton/day`).join(', ')

  const requiredSpeedNote =
    requiredSpeedKnots > speedRangeKnots.max
      ? `Required average speed to meet the deadline is ${requiredSpeedKnots}kts, which EXCEEDS this vessel's max feasible speed (${speedRangeKnots.max}kts) -- the deadline cannot be met even at full speed. In this case you MUST recommend exactly ${speedRangeKnots.max}kts (the max feasible speed) as the best effort, and explain in the reasoning that even max speed cannot meet the deadline.`
      : `Required average speed to meet the deadline is ${requiredSpeedKnots}kts (feasible). Your recommendedSpeedKnots MUST be >= ${requiredSpeedKnots}kts so the deadline is met with zero or positive margin -- never recommend a speed below this, even to save fuel.`

  const issuesStr =
    nearbyIssues.length > 0
      ? nearbyIssues.map((i) => `- [${i.severity}] ${i.title}: ${i.description}`).join('\n')
      : '(none reported)'

  const windCurrent = weather.current.windSpeedMs != null ? `${weather.current.windSpeedMs} m/s` : 'unknown'
  const waveCurrent = weather.current.waveHeightM != null ? `${weather.current.waveHeightM} m` : 'unknown'
  const windArrival = weather.arrival.windSpeedMs != null ? `${weather.arrival.windSpeedMs} m/s` : 'unknown'
  const waveArrival = weather.arrival.waveHeightM != null ? `${weather.arrival.waveHeightM} m` : 'unknown'

  const langName = body.lang === 'ko' ? 'Korean' : 'English'

  return `You are a maritime voyage-optimization analyst for a shipping line. Given the following REAL-TIME voyage
data, recommend an optimal speed and produce a concise, grounded operational analysis. Only reference facts
given below -- do not invent vessel incidents, ports, or figures not present here. Treat the numbers below
(especially the required-speed constraint) as ground truth -- do not recompute them differently yourself.

Vessel: ${vessel.name} (${vessel.type}, IMO ${vessel.imo})
Feasible speed range: ${speedRangeKnots.min}-${speedRangeKnots.max}kts
Fuel consumption curve (speed -> daily fuel use, lower speed = more efficient): ${fuelCurveStr}
Route: ${route.departurePort} -> ${route.arrivalPort}
Cargo: ${route.cargoDescription}
Original planned speed: ${body.planSpeedKnots}kts
Rule-based baseline recommended speed (for reference only, you may deviate from it as long as you respect
the required-speed constraint below): ${body.baselineRecommendedSpeedKnots}kts
Deadline (${body.deadlineTerm}): ${deadlineAtLocal} (${hoursUntilDeadline.toFixed(1)}h from now)
Progress: ${body.progress.traveledNm}nm traveled / ${body.progress.remainingNm}nm remaining of ${body.progress.totalNm}nm total (${body.progress.progressPercent}%)
Current speed: ${body.currentSpeedKnots}kts -- ${body.deadlineTerm} compliance probability at current speed:
${body.currentSpeedProbabilityPercent}% (margin ${body.marginHoursAtCurrentSpeed}h)
${requiredSpeedNote}
Current position weather: wind ${windCurrent}, wave height ${waveCurrent}
Arrival port weather: wind ${windArrival}, wave height ${waveArrival}
Arrival port congestion: ${congestion.level} (score ${congestion.score}/100), expected berth-wait ${congestion.avgWaitHours}h (P75 basis -- call it "expected" or "P75", NOT "average"), berths available
${congestion.berthsAvailable}/${congestion.berthsTotal}, trend ${congestion.trend}
Regional issues near the remaining route:
${issuesStr}

Recommend a speed (knots, within the feasible range above) that balances:
- Meeting the ${body.deadlineTerm} deadline per the required-speed constraint above (this is a hard floor, not a
  suggestion).
- Above that floor, minimizing fuel burn per the fuel curve -- do not recommend faster than necessary if
  there is schedule slack above the floor, especially if the arrival port is congested (arriving early into
  a congested port wastes fuel for no benefit).
- Weather/sea-state safety -- if wave height is high, mention the tradeoff, but you may still need to stay
  at or above the required-speed floor to meet the deadline.

Write the response in ${langName}.
Produce:
1. "recommendedSpeedKnots": the single recommended speed in knots (a number, within the feasible range,
   respecting the required-speed constraint above).
2. "reasoning": a THOROUGH operational analysis covering ALL SIX of the following, in this exact order,
   ONE PER LINE (use \\n between them). Do not repeat the same point in different words.
   - Why this exact speed was chosen relative to the deadline constraint and the schedule margin/deficit.
   - The fuel-vs-schedule trade-off implied by the fuel curve.
   - How the CURRENT real-time weather (at the vessel's position) affects the recommendation.
   - How the ARRIVAL PORT weather affects the recommendation.
   - How arrival port congestion factors in -- state explicitly whether arriving earlier would help or
     just add unproductive waiting.
   - How each regional issue near the remaining route concretely affects this voyage; reference each
     relevant one by name.
   Where data supports it, write 3-5 sentences citing the real figures above (exact speeds, margin hours,
   wind speed, wave height, congestion score, distances). The speed you state MUST match
   recommendedSpeedKnots exactly.
3. "risks": 1-4 risk items synthesized strictly from the weather/congestion/regional-issue data above (skip
   categories with nothing to report; never invent unrelated risks). Each item needs a level
   (high/medium/low), a category (weather/port/geopolitical/mechanical), a short title, and a
   "description" of 2-3 detailed sentences -- explain both the concrete operational impact on THIS voyage
   and a specific mitigation or watch-item. Put each sentence on its own line (use \\n).`
}

function buildGeminiClient(): GoogleGenAI | null {
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true'
  if (useVertex) {
    const project = process.env.GOOGLE_CLOUD_PROJECT
    if (!project) return null
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    return new GoogleGenAI({ vertexai: true, project, location })
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({ apiKey })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<AiReanalyzeResponse>({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  if (!isValidRequest(body)) {
    return NextResponse.json<AiReanalyzeResponse>({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  const ai = buildGeminiClient()
  if (!ai) {
    return NextResponse.json<AiReanalyzeResponse>({ ok: false, reason: 'no_api_key' })
  }

  const [currentWeather, arrivalWeather] = await Promise.all([
    fetchPointWeather(body.currentPos),
    fetchPointWeather(body.arrivalPos),
  ])

  const requiredSpeedKnots = computeRequiredSpeedKnots(
    body.baselineRecommendedSpeedKnots,
    body.baselineEtaAt,
    body.nowIso,
    body.deadlineAt,
    body.congestion.avgWaitHours,
  )

  const deadlineAtLocal = formatLocalTime(body.deadlineAt, getPortUtcOffset(body.route.arrivalPort))

  const prompt = buildPrompt(body, requiredSpeedKnots, deadlineAtLocal, {
    current: {
      windSpeedMs: currentWeather.status === 'success' ? currentWeather.windSpeedMs : null,
      waveHeightM: currentWeather.status === 'success' ? currentWeather.waveHeightM : null,
    },
    arrival: {
      windSpeedMs: arrivalWeather.status === 'success' ? arrivalWeather.windSpeedMs : null,
      waveHeightM: arrivalWeather.status === 'success' ? arrivalWeather.waveHeightM : null,
    },
  })

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL

  let raw: { recommendedSpeedKnots?: unknown; reasoning?: unknown; risks?: unknown }
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedSpeedKnots: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                  category: { type: Type.STRING, enum: ['weather', 'port', 'geopolitical', 'mechanical'] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['level', 'category', 'title', 'description'],
              },
            },
          },
          required: ['recommendedSpeedKnots', 'reasoning', 'risks'],
        },
      },
    })
    const text = response.text
    if (!text) throw new Error('empty response')
    raw = JSON.parse(text)
  } catch {
    return NextResponse.json<AiReanalyzeResponse>({ ok: false, reason: 'upstream_error' })
  }

  if (!isFiniteNumber(raw.recommendedSpeedKnots) || typeof raw.reasoning !== 'string' || !Array.isArray(raw.risks)) {
    return NextResponse.json<AiReanalyzeResponse>({ ok: false, reason: 'upstream_error' })
  }

  const validRisks: RiskItem[] = raw.risks
    .filter(
      (r): r is RiskItem =>
        !!r &&
        typeof r === 'object' &&
        RISK_LEVELS.has((r as Record<string, unknown>).level as string) &&
        RISK_CATEGORIES.has((r as Record<string, unknown>).category as string) &&
        typeof (r as Record<string, unknown>).title === 'string' &&
        typeof (r as Record<string, unknown>).description === 'string',
    )
    .slice(0, 6)

  if (validRisks.length === 0) {
    return NextResponse.json<AiReanalyzeResponse>({ ok: false, reason: 'upstream_error' })
  }

  // 속도 강제 보정 — 권장 속도는 항상 마감을 지키거나(불가능하면 최고속력) 되도록 서버가 최종 보장한다.
  const modelSpeed = raw.recommendedSpeedKnots
  const clamped = Math.min(body.speedRangeKnots.max, Math.max(body.speedRangeKnots.min, modelSpeed))
  let finalSpeed: number
  if (requiredSpeedKnots > body.speedRangeKnots.max) {
    finalSpeed = Math.round(body.speedRangeKnots.max * 10) / 10
  } else {
    const rounded = Math.round(clamped * 10) / 10
    finalSpeed = Math.min(body.speedRangeKnots.max, Math.max(requiredSpeedKnots, rounded))
  }

  let reasoning = normalizeLineBreaks(raw.reasoning)
  const risks = validRisks.map((r) => ({ ...r, description: normalizeLineBreaks(r.description) }))

  if (Math.abs(finalSpeed - modelSpeed) >= 0.05) {
    const note =
      body.lang === 'ko'
        ? `(참고: ${body.deadlineTerm} 준수를 위해 필요한 속도 기준으로 ${finalSpeed}kts로 자동 보정되었습니다.)`
        : `(Note: automatically adjusted to ${finalSpeed}kts to meet the ${body.deadlineTerm} deadline.)`
    reasoning = `${reasoning}\n${note}`
  }

  return NextResponse.json<AiReanalyzeResponse>({
    ok: true,
    reasoning,
    risks,
    recommendedSpeedKnots: finalSpeed,
    model,
  })
}
