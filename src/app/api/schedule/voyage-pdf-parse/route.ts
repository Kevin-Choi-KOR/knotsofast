import { NextResponse } from 'next/server'
import { Type } from '@google/genai'
import { buildGeminiClient } from '@/shared/lib/gemini'
import type { VoyagePdfParseRequest, VoyagePdfParseResponse } from '@/features/schedule/lib/voyagePdfParse'
import type { FuelType } from '@/shared/types'

export const runtime = 'nodejs'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const FUEL_TYPES = new Set(['HFO', 'MGO', 'LNG'])
const MAX_BASE64_LENGTH = 14 * 1024 * 1024

function isValidRequest(body: unknown): body is VoyagePdfParseRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (b.lang !== 'ko' && b.lang !== 'en') return false
  if (typeof b.fileBase64 !== 'string' || b.fileBase64.length === 0 || b.fileBase64.length > MAX_BASE64_LENGTH) return false
  if (!Array.isArray(b.vessels)) return false
  if (!Array.isArray(b.ports)) return false
  return true
}

function buildPrompt(body: VoyagePdfParseRequest): string {
  const vesselLines = body.vessels.map((v) => `- id="${v.id}" | name="${v.name}" | IMO ${v.imo}`).join('\n')
  const portLines = body.ports.map((p) => `- code="${p.code}" | ${p.name} / ${p.nameEn}`).join('\n')
  const langName = body.lang === 'ko' ? 'Korean' : 'English'

  return `You are a maritime logistics operations assistant. You are given a PDF document (a voyage order, booking
confirmation, shipping instruction, or fixture recap) for a single ocean voyage. Extract the voyage
registration fields listed below EXACTLY as stated in the document. Never invent a value that is not present
in or clearly derivable from the document.

Known vessel roster (pick the "id" of the entry whose name or IMO number matches the vessel named in the
document; if no entry matches with reasonable confidence, output an empty string for vesselId):
${vesselLines}

Known port list (pick the "code" of the entry whose name/city matches the load port and discharge port
named in the document; match loosely across capitalization, English/Korean naming, and common
abbreviations; if truly no match, output an empty string):
${portLines}

Extract:
1. "vesselId": the id from the roster above, or "" if no confident match.
2. "departurePortCode" / "arrivalPortCode": codes from the port list above, or "" if no confident match.
3. "etd": the vessel's departure date/time (ETD / laycan commencement / sailing date) as an ISO 8601
   datetime WITH a numeric timezone offset, e.g. "2026-08-25T09:00:00+09:00" -- never use a timezone
   abbreviation like "KST" inside the ISO string itself, always convert to +HH:MM. If only a date is given
   with no time, use 00:00:00 in a timezone reasonable for that port.
4. "rta": the customer/consignee/charterer's REQUIRED or REQUESTED arrival deadline (look for terms like
   RTA, Required/Requested Time of Arrival, cancelling date, delivery deadline) as ISO 8601 with numeric
   timezone offset.
5. "sta": the carrier's own SCHEDULED/estimated arrival date if separately stated (e.g. STA, Line Schedule
   ETA), as ISO 8601 with numeric timezone offset. If the document does not distinguish this from RTA,
   output "".
6. "rtaConfirmed": true only if the document explicitly marks the RTA/deadline as confirmed, fixed, or firm
   (e.g. "[CONFIRMED]", "firm", "fixed"); false if tentative, estimated, or not stated.
7. "cargoDescription": a concise description of the cargo/commodity.
8. "cargoTon": total cargo weight in metric tons as a plain number (convert units if necessary).
9. "fuelType": one of "HFO", "MGO", "LNG" -- map the closest bunker grade mentioned (e.g. "IFO380",
   "VLSFO", "HSFO" -> "HFO"; "MDO", "gasoil" -> "MGO"; "LNG" -> "LNG"). Default to "HFO" if nothing is
   mentioned.
10. "plannedSpeedKnots": the instructed/planned service speed in knots as a plain number. Use the midpoint
    if a range is given. Default to 14 if nothing is mentioned.

The document may be in Korean or English regardless of which language you respond in -- respond
with the JSON fields only, values as specified above (not translated prose). Write in ${langName} only
where the field itself is free text (cargoDescription).`
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<VoyagePdfParseResponse>({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  if (!isValidRequest(body)) {
    return NextResponse.json<VoyagePdfParseResponse>({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  const ai = buildGeminiClient()
  if (!ai) {
    return NextResponse.json<VoyagePdfParseResponse>({ ok: false, reason: 'no_api_key' })
  }

  const model = process.env.VOYAGE_PDF_PARSE_MODEL || DEFAULT_MODEL

  let raw: Record<string, unknown>
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ text: buildPrompt(body) }, { inlineData: { mimeType: 'application/pdf', data: body.fileBase64 } }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vesselId: { type: Type.STRING },
            departurePortCode: { type: Type.STRING },
            arrivalPortCode: { type: Type.STRING },
            etd: { type: Type.STRING },
            rta: { type: Type.STRING },
            sta: { type: Type.STRING },
            rtaConfirmed: { type: Type.BOOLEAN },
            cargoDescription: { type: Type.STRING },
            cargoTon: { type: Type.NUMBER },
            fuelType: { type: Type.STRING, enum: ['HFO', 'MGO', 'LNG'] },
            plannedSpeedKnots: { type: Type.NUMBER },
          },
          required: [
            'vesselId',
            'departurePortCode',
            'arrivalPortCode',
            'etd',
            'rta',
            'sta',
            'rtaConfirmed',
            'cargoDescription',
            'cargoTon',
            'fuelType',
            'plannedSpeedKnots',
          ],
        },
      },
    })
    const text = response.text
    if (!text) throw new Error('empty response')
    raw = JSON.parse(text)
  } catch {
    return NextResponse.json<VoyagePdfParseResponse>({ ok: false, reason: 'upstream_error' })
  }

  // 핵심 필드(etd/rta) — 파싱 실패 시 전체 실패. 항차 등록 자체가 성립하지 않는다.
  const etd = typeof raw.etd === 'string' && !Number.isNaN(Date.parse(raw.etd)) ? raw.etd : ''
  const rta = typeof raw.rta === 'string' && !Number.isNaN(Date.parse(raw.rta)) ? raw.rta : ''
  if (!etd || !rta) {
    return NextResponse.json<VoyagePdfParseResponse>({ ok: false, reason: 'upstream_error' })
  }

  // 보조 필드 — 화이트리스트(클라이언트가 보낸 실재 목록) 재검증, 실패 시 빈 값으로 완화.
  const vesselId = typeof raw.vesselId === 'string' && body.vessels.some((v) => v.id === raw.vesselId) ? raw.vesselId : ''
  const departurePortCode =
    typeof raw.departurePortCode === 'string' && body.ports.some((p) => p.code === raw.departurePortCode)
      ? raw.departurePortCode
      : ''
  const arrivalPortCode =
    typeof raw.arrivalPortCode === 'string' && body.ports.some((p) => p.code === raw.arrivalPortCode)
      ? raw.arrivalPortCode
      : ''
  const sta = typeof raw.sta === 'string' && !Number.isNaN(Date.parse(raw.sta)) ? raw.sta : ''

  // 수치 필드 — 0 이상으로 clamp만. 화면 폼 검증이 최종 방어선.
  const cargoTon = isFiniteNumber(raw.cargoTon) ? Math.max(0, raw.cargoTon) : 0
  const plannedSpeedKnots = isFiniteNumber(raw.plannedSpeedKnots) ? Math.max(0, raw.plannedSpeedKnots) : 0
  const fuelType: FuelType = typeof raw.fuelType === 'string' && FUEL_TYPES.has(raw.fuelType) ? (raw.fuelType as FuelType) : 'HFO'
  const rtaConfirmed = raw.rtaConfirmed === true
  const cargoDescription = typeof raw.cargoDescription === 'string' ? raw.cargoDescription : ''

  const isPartial = !vesselId || !departurePortCode || !arrivalPortCode || !sta

  return NextResponse.json<VoyagePdfParseResponse>({
    ok: true,
    status: isPartial ? 'partial' : 'success',
    vesselId,
    departurePortCode,
    arrivalPortCode,
    etd,
    rta,
    sta,
    rtaConfirmed,
    cargoDescription,
    cargoTon,
    fuelType,
    plannedSpeedKnots,
  })
}
