import { NextResponse } from 'next/server'
import type { TyphoonWarning } from '@/mocks/map-overlays'

const GDACS_RSS_URL = 'https://www.gdacs.org/xml/rss.xml'

function extractTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return match?.[1]?.trim()
}

// DASHBOARD.md 11.2장 — 속성명은 units가 아니라 unit(단수), 값은 텍스트가 아니라 value 속성.
// 한 글자 때문에 태풍이 전혀 표시되지 않은 적이 있다(KNOWN_PITFALLS.md 6.1).
function parseSeverity(xml: string): { unit: string; value: number } | undefined {
  const tagMatch = xml.match(/<gdacs:severity\b([^>]*)\/?>/)
  if (!tagMatch) return undefined
  const attrs = tagMatch[1]
  const unit = attrs.match(/\bunit="([^"]*)"/)?.[1]
  const valueStr = attrs.match(/\bvalue="([^"]*)"/)?.[1]
  if (!unit || !valueStr) return undefined
  const value = Number(valueStr)
  if (Number.isNaN(value)) return undefined
  return { unit, value }
}

function parsePoint(xml: string): { lat: number; lng: number } | undefined {
  const pointText = extractTag(xml, 'georss:point')
  if (pointText) {
    const [lat, lng] = pointText.split(/\s+/).map(Number)
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
  }
  const lat = Number(extractTag(xml, 'geo:lat'))
  const lng = Number(extractTag(xml, 'geo:long'))
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
  return undefined
}

function classify(windSpeedKnots: number): { intensity: TyphoonWarning['intensity']; radiusKm: number } {
  if (windSpeedKnots >= 100) return { intensity: 'STY', radiusKm: 400 }
  if (windSpeedKnots >= 64) return { intensity: 'TY', radiusKm: 300 }
  if (windSpeedKnots >= 34) return { intensity: 'TS', radiusKm: 200 }
  return { intensity: 'TD', radiusKm: 120 }
}

function parseItem(itemXml: string): TyphoonWarning | undefined {
  const eventType = extractTag(itemXml, 'gdacs:eventtype')
  if (eventType !== 'TC') return undefined

  const point = parsePoint(itemXml)
  if (!point) return undefined

  const severity = parseSeverity(itemXml)
  if (!severity) return undefined

  const windSpeedKnots = /km\/?h|kph/i.test(severity.unit) ? severity.value * 0.539957 : severity.value
  const { intensity, radiusKm } = classify(windSpeedKnots)

  const name = extractTag(itemXml, 'gdacs:eventname') ?? 'UNKNOWN'
  const id = extractTag(itemXml, 'gdacs:eventid') ?? String(Date.now())

  return {
    id,
    name,
    lat: point.lat,
    lng: point.lng,
    intensity,
    windSpeedKnots: Math.round(windSpeedKnots * 10) / 10,
    radiusKm,
    movingDir: '—',
    movingSpeedKnots: 0,
  }
}

export async function GET() {
  try {
    const res = await fetch(GDACS_RSS_URL, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'KSF-Line-Dashboard/1.0' },
    })
    if (!res.ok) return NextResponse.json([])

    const xml = await res.text()
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
    const typhoons = items.flatMap((item) => {
      const parsed = parseItem(item)
      return parsed ? [parsed] : []
    })

    return NextResponse.json(typhoons)
  } catch {
    // 실패 시 빈 배열을 200으로 반환한다 — 클라이언트는 목업이 아니라 빈 배열로 폴백한다(11.2장).
    return NextResponse.json([])
  }
}
