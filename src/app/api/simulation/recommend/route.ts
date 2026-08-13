import { NextResponse } from 'next/server'
import { buildGeminiClient, normalizeLineBreaks } from '@/shared/lib/gemini'
import type { AiSimulationRecommendRequest, AiSimulationRecommendResponse } from '@/app/(main)/simulation/components/recommendTypes'

export const runtime = 'nodejs'

const DEFAULT_MODEL = 'gemini-2.5-pro'
const ROUTE_LABEL: Record<'suez' | 'cape', string> = { suez: '수에즈 운하', cape: '희망봉 우회' }

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isValidRoute(v: unknown): v is 'suez' | 'cape' {
  return v === 'suez' || v === 'cape'
}

function isValidRequest(body: unknown): body is AiSimulationRecommendRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (b.lang !== 'ko' && b.lang !== 'en') return false
  if (b.deadlineTerm !== 'RTA' && b.deadlineTerm !== 'STA') return false
  if (typeof b.deadlineAt !== 'string' || Number.isNaN(Date.parse(b.deadlineAt))) return false
  if (typeof b.etdBaseAt !== 'string' || Number.isNaN(Date.parse(b.etdBaseAt))) return false
  if (!isFiniteNumber(b.portWaitHours)) return false

  const vessel = b.vessel as Record<string, unknown> | undefined
  if (!vessel || typeof vessel.name !== 'string' || typeof vessel.type !== 'string' || typeof vessel.imo !== 'string') {
    return false
  }
  const route = b.route as Record<string, unknown> | undefined
  if (!route || typeof route.departurePort !== 'string' || typeof route.arrivalPort !== 'string') return false

  const distanceNm = b.distanceNm as Record<string, unknown> | undefined
  if (!distanceNm || !isFiniteNumber(distanceNm.suez) || !isFiniteNumber(distanceNm.cape)) return false
  if (!Array.isArray(b.fuelCurve)) return false

  const plan = b.plan as Record<string, unknown> | undefined
  if (
    !plan ||
    !isFiniteNumber(plan.speedKnots) ||
    !isValidRoute(plan.route) ||
    !isFiniteNumber(plan.fuelTon) ||
    !isFiniteNumber(plan.costUsd) ||
    !isFiniteNumber(plan.co2Ton) ||
    typeof plan.etaAt !== 'string'
  ) {
    return false
  }

  const rec = b.recommendation as Record<string, unknown> | undefined
  if (
    !rec ||
    !isValidRoute(rec.route) ||
    !isFiniteNumber(rec.departureOffsetH) ||
    !isFiniteNumber(rec.speedKnots) ||
    !isFiniteNumber(rec.cargoPercent) ||
    !isFiniteNumber(rec.requiredSpeedKnots) ||
    typeof rec.feasible !== 'boolean' ||
    !isFiniteNumber(rec.marginHours) ||
    typeof rec.etdAt !== 'string' ||
    typeof rec.etaAt !== 'string' ||
    !isFiniteNumber(rec.fuelTon) ||
    !isFiniteNumber(rec.costUsd) ||
    !isFiniteNumber(rec.co2Ton)
  ) {
    return false
  }

  const saving = b.savingVsPlan as Record<string, unknown> | undefined
  if (!saving || !isFiniteNumber(saving.fuelTon) || !isFiniteNumber(saving.costUsd) || !isFiniteNumber(saving.co2Ton)) {
    return false
  }

  return true
}

function buildPrompt(body: AiSimulationRecommendRequest): string {
  const { vessel, route, plan, recommendation, savingVsPlan, deadlineTerm, deadlineAt, etdBaseAt } = body
  const fuelCurveStr = body.fuelCurve.map((p) => `${p.speedKnots}kts -> ${p.fuelTonPerDay} ton/day`).join(', ')
  const langName = body.lang === 'ko' ? 'Korean' : 'English'

  const feasibilityNote = recommendation.feasible
    ? `This combination MEETS the deadline with ${recommendation.marginHours.toFixed(1)}h of margin to spare.`
    : `IMPORTANT: even at max speed (${recommendation.speedKnots}kts) departing at the earliest allowed offset, this voyage CANNOT meet the ${deadlineTerm} deadline -- it falls short by ${Math.abs(recommendation.marginHours).toFixed(1)}h. This is the best-effort combination, not a deadline-meeting one. You must clearly flag this as a hard constraint violation requiring escalation (e.g. renegotiating the deadline, or accepting the delay), not a minor issue.`

  return `You are a maritime voyage-optimization analyst for a shipping line. A DETERMINISTIC constrained
optimizer (not an LLM) has already searched every combination of route, departure timing, and speed and
selected the single fuel-minimal combination that meets the voyage's ${deadlineTerm} deadline. Your job is
NOT to re-decide the combination -- it is fixed and given below as ground truth. Your job is to explain,
in detail and grounded strictly in the numbers given, WHY this exact combination is optimal, so an
operations planner can trust and act on it without re-deriving the math themselves.

Vessel: ${vessel.name} (${vessel.type}, IMO ${vessel.imo})
Voyage: ${route.departurePort} -> ${route.arrivalPort}, cargo: ${route.cargoDescription}
Fuel consumption curve (speed -> daily fuel use; fuel scales roughly with speed cubed, so small speed cuts
save disproportionately more fuel): ${fuelCurveStr}
Deadline: ${deadlineTerm} at ${deadlineAt}
Originally scheduled departure (ETD baseline before any adjustment): ${etdBaseAt}
Expected port-arrival wait (congestion + berth queue, already included in the ETA below): ${body.portWaitHours}h

CURRENT PLAN (baseline for comparison):
- Route: ${ROUTE_LABEL[plan.route]}, speed ${plan.speedKnots}kts, ETA ${plan.etaAt}
- Fuel ${plan.fuelTon.toFixed(1)}ton, cost $${plan.costUsd.toFixed(0)}, CO2 ${plan.co2Ton.toFixed(1)}ton

OPTIMIZER'S CHOSEN COMBINATION (fixed -- do not second-guess or propose a different one):
- Route: ${ROUTE_LABEL[recommendation.route]}
- Departure timing: ${recommendation.departureOffsetH >= 0 ? `delayed ${recommendation.departureOffsetH}h` : `${Math.abs(recommendation.departureOffsetH)}h earlier`} from the original schedule (new ETD ${recommendation.etdAt})
- Speed: ${recommendation.speedKnots}kts (the mathematically exact minimum required speed to just meet the
  deadline at this route/timing was ${recommendation.requiredSpeedKnots}kts; ${recommendation.speedKnots}kts is
  that value rounded up to the nearest 0.5kts step available on the vessel's speed control)
- Cargo load: ${recommendation.cargoPercent}% (unchanged from the operator's current setting -- cargo volume
  is a real cargo-booking constraint, not a free variable the optimizer adjusts)
- Resulting ETA: ${recommendation.etaAt}
- ${feasibilityNote}
- Result: fuel ${recommendation.fuelTon.toFixed(1)}ton, cost $${recommendation.costUsd.toFixed(0)}, CO2 ${recommendation.co2Ton.toFixed(1)}ton
- Savings vs current plan: fuel ${savingVsPlan.fuelTon >= 0 ? '-' : '+'}${Math.abs(savingVsPlan.fuelTon).toFixed(1)}ton,
  cost ${savingVsPlan.costUsd >= 0 ? '-' : '+'}$${Math.abs(savingVsPlan.costUsd).toFixed(0)},
  CO2 ${savingVsPlan.co2Ton >= 0 ? '-' : '+'}${Math.abs(savingVsPlan.co2Ton).toFixed(1)}ton
  (negative sign = this uses MORE than the current plan; explain clearly if any figure is negative)

Write the response in ${langName}.
Produce "reasoning": a THOROUGH, grounded explanation covering ALL FIVE of the following points, in this
exact order, ONE PER LINE (use \\n between them). Do not repeat the same point in different words, and
never invent numbers not given above.
1. Why this exact speed is optimal: explain the cube-law fuel-vs-speed relationship concretely using the
   fuel curve figures, and state that any slower speed would miss the deadline while any faster speed would
   waste fuel for no scheduling benefit.
2. Why this route was chosen over the alternative: compare the Suez toll vs the Cape's extra distance/fuel
   burn using the actual figures, and state which factor tipped the decision.
3. Why this departure timing was chosen: if delayed or advanced, explain the concrete effect on the speed
   needed to meet the deadline; if unchanged (0h), explain why shifting departure would not have helped.
4. The quantified savings vs the current plan (cite the fuel/cost/CO2 numbers above) -- or if any figure is
   negative, explain plainly why the optimizer still chose this combination (e.g. it is the only way to meet
   the deadline at all).
5. The deadline-compliance status: state the margin/shortfall in hours explicitly, and if infeasible, say so
   clearly and note what should happen next (e.g. escalate to renegotiate the deadline).
Where data supports it, write 2-4 sentences per point citing the real figures above.`
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<AiSimulationRecommendResponse>({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  if (!isValidRequest(body)) {
    return NextResponse.json<AiSimulationRecommendResponse>({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  const ai = buildGeminiClient()
  if (!ai) {
    return NextResponse.json<AiSimulationRecommendResponse>({ ok: false, reason: 'no_api_key' })
  }

  const prompt = buildPrompt(body)
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL

  let reasoning: string
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    })
    const text = response.text
    if (!text) throw new Error('empty response')
    reasoning = normalizeLineBreaks(text.trim())
  } catch {
    return NextResponse.json<AiSimulationRecommendResponse>({ ok: false, reason: 'upstream_error' })
  }

  if (!reasoning) {
    return NextResponse.json<AiSimulationRecommendResponse>({ ok: false, reason: 'upstream_error' })
  }

  return NextResponse.json<AiSimulationRecommendResponse>({ ok: true, reasoning, model })
}
