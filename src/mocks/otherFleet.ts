import type { Vessel, Voyage, AisPosition, VesselType, FuelType, VoyageStatus, Waypoint } from '@/shared/types'
import { findPort, formatPortLabel, type Port } from '@/mocks/ports'
import ROUTES_JSON from '@/mocks/routes.json'

// 대시보드 지도에 표시할 "타사" 배경 트래픽(AIS 유사 목업). 자사 선단(MOCK_VESSELS)과는
// 완전히 분리된 데이터셋으로, 다른 페이지(선박관리·일정관리 등)에는 영향을 주지 않는다.
//
// 항로는 scripts/generate_routes.py(searoute-py)로 사전 계산된 실제 해상 항로
// (routes.json의 ovoyN 항목)를 사용한다. 스크립트를 재실행할 경우 ROUTE_PAIRS와
// generate_routes.py의 OTHER_VOYAGES 목록을 함께 갱신해야 한다.

export interface OtherCompany {
  name: string
  code: string
  shipPrefix: string
  // true인 회사는 얼라이언스/슬롯공유 등 협력관계에 있는 "파트너선"으로 분류된다
  // (일정 관리 페이지의 운항선/타사선/파트너선 필터가 이 값을 기준으로 구분한다).
  // 나머지는 아무 관계도 없는 순수 경쟁사("타사선")로 취급한다.
  partner: boolean
}

export const OTHER_COMPANIES: OtherCompany[] = [
  { name: 'Pacific Rim Carriers',     code: 'PRC', shipPrefix: 'PACIFIC RIM',     partner: false },
  { name: 'Nordic Star Line',         code: 'NSL', shipPrefix: 'NORDIC STAR',     partner: true  },
  { name: 'Global Ocean Lines',       code: 'GOL', shipPrefix: 'GLOBAL OCEAN',    partner: true  },
  { name: 'Atlantic Bridge Shipping', code: 'ABS', shipPrefix: 'ATLANTIC BRIDGE', partner: false },
  { name: 'Blue Horizon Marine',      code: 'BHM', shipPrefix: 'BLUE HORIZON',    partner: false },
  { name: 'Golden Wave Shipping',     code: 'GWS', shipPrefix: 'GOLDEN WAVE',     partner: true  },
  { name: 'Meridian Sea Transport',   code: 'MST', shipPrefix: 'MERIDIAN',        partner: false },
  { name: 'Silver Compass Lines',     code: 'SCL', shipPrefix: 'SILVER COMPASS',  partner: false },
]

const SHIP_SUFFIXES = [
  'PIONEER', 'VOYAGER', 'ENDEAVOR', 'HORIZON', 'MARINER', 'SUMMIT', 'LEGACY',
  'FRONTIER', 'ODYSSEY', 'ATLAS', 'ZENITH', 'LIBERTY', 'UNITY', 'PROGRESS',
  'VANGUARD', 'EXPLORER', 'NAVIGATOR', 'CRUSADER', 'TRIUMPH', 'VICTORY',
  'CENTURY', 'PHOENIX', 'COMPASS', 'BEACON', 'CRESCENT', 'ECLIPSE', 'HERITAGE',
  'INTEGRITY', 'MOMENTUM', 'RESOLUTE', 'SOVEREIGN', 'STARLIGHT', 'TRADEWIND',
  'ASCENT',
]

// 실제 컨테이너·벌크·탱커 서비스에서 흔히 쓰이는 주요 항로(출발지 코드, 도착지 코드)
const ROUTE_PAIRS: [string, string][] = [
  ['PUS', 'LAX'], ['SHA', 'LAX'], ['SHA', 'LGB'], ['HKG', 'LAX'], ['KHH', 'OAK'],
  ['SIN', 'RTM'], ['SHA', 'HAM'], ['HKG', 'ANT'], ['PUS', 'RTM'], ['YOK', 'SEA'],
  ['TYO', 'VAN'], ['SIN', 'DXB'], ['HKG', 'SIN'], ['SHA', 'SIN'], ['PUS', 'SIN'],
  ['MNL', 'PUS'], ['KHH', 'SHA'], ['DXB', 'ULS'], ['RTN', 'ULS'], ['PHE', 'GGY'],
  ['PHE', 'SHA'], ['SIN', 'FEL'], ['SIN', 'PIR'], ['PIR', 'BCN'], ['RTM', 'NYC'],
  ['HAM', 'SAV'], ['ANT', 'NYC'], ['AKL', 'PUS'], ['SYD', 'SHA'], ['MEL', 'SIN'],
  ['VAN', 'TYO'], ['SEA', 'YOK'], ['NYC', 'RTM'], ['INC', 'LAX'],
]

const VESSEL_TYPES: VesselType[] = ['container', 'bulk', 'tanker', 'roro']
const FLAGS = ['PA', 'LR', 'MH', 'SG', 'HK', 'MT', 'CY']
const FUEL_TYPES: FuelType[] = ['HFO', 'HFO', 'MGO', 'LNG']
const CARGO_BY_TYPE: Record<VesselType, string> = {
  container: '컨테이너 화물',
  bulk:      '벌크 화물 (곡물·광물)',
  tanker:    '원유·석유제품',
  roro:      '자동차·중장비',
}

const NOW = new Date('2026-07-27T09:00:00Z')

interface LatLng { lat: number; lng: number }
type RouteEntry = { points: LatLng[]; distanceNm: number; waypoints: number } | null
const ROUTES = ROUTES_JSON as Record<string, RouteEntry>

// 시드 고정 PRNG (mulberry32) — SSR/CSR 간 동일한 목업 데이터 보장
function mulberry32(seed: number) {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260727)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const range = (min: number, max: number) => min + rand() * (max - min)

function haversineNm(a: LatLng, b: LatLng): number {
  const R = 3440.065 // 지구 반경 (해리)
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function bearing(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

// 날짜변경선을 넘는 구간을 고려한 위경도 선형 보간 (직선 폴백 전용)
function interpolateStraight(a: LatLng, b: LatLng, t: number): LatLng {
  let lngB = b.lng
  const diff = lngB - a.lng
  if (diff > 180) lngB -= 360
  if (diff < -180) lngB += 360
  let lng = a.lng + (lngB - a.lng) * t
  if (lng > 180) lng -= 360
  if (lng < -180) lng += 360
  return { lat: a.lat + (b.lat - a.lat) * t, lng }
}

// searoute-py 결과는 날짜변경선을 넘어도 경도를 unwrap된 연속값으로 반환하므로
// 별도 보정 없이 누적거리 기준으로 구간 보간하면 된다.
function pointAtFraction(points: LatLng[], t: number): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 }
  if (points.length === 1) return points[0]
  const segLens = points.slice(0, -1).map((p, i) => haversineNm(p, points[i + 1]))
  const total = segLens.reduce((a, b) => a + b, 0)
  let target = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const localT = segLens[i] === 0 ? 0 : Math.min(1, target / segLens[i])
      const a = points[i], b = points[i + 1]
      return { lat: a.lat + (b.lat - a.lat) * localT, lng: a.lng + (b.lng - a.lng) * localT }
    }
    target -= segLens[i]
  }
  return points[points.length - 1]
}

function buildStraightRoute(dep: Port, arr: Port): Waypoint[] {
  const steps = [0, 0.25, 0.5, 0.75, 1]
  return steps.map((t, i) => ({
    ...interpolateStraight(dep, arr, t),
    name: i === 0 ? dep.name : i === steps.length - 1 ? arr.name : undefined,
  }))
}

interface Generated {
  vessel: Vessel
  voyage: Voyage
  position: AisPosition
}

function generateOne(i: number): Generated {
  const id       = `ov${i + 1}`
  const voyageId = `ovoy${i + 1}`
  const company  = OTHER_COMPANIES[i % OTHER_COMPANIES.length]
  const suffix   = SHIP_SUFFIXES[i % SHIP_SUFFIXES.length]
  const type     = pick(VESSEL_TYPES)

  const [depCode, arrCode] = ROUTE_PAIRS[i % ROUTE_PAIRS.length]
  const dep = findPort(depCode)!
  const arr = findPort(arrCode)!

  // searoute-py로 사전 계산된 실제 해상 항로 (없으면 직선 폴백)
  const routeEntry = ROUTES[voyageId]
  const routePoints: LatLng[] = routeEntry?.points ?? [dep, arr]
  const plannedRoute: Waypoint[] = routeEntry
    ? routePoints.map((p, idx) => ({
        ...p,
        name: idx === 0 ? dep.name : idx === routePoints.length - 1 ? arr.name : undefined,
      }))
    : buildStraightRoute(dep, arr)

  const scale = type === 'container' ? range(0.8, 1.4) : type === 'tanker' ? range(0.6, 1.2) : range(0.4, 1.0)
  const grossTonnage   = Math.round((type === 'container' ? 70000 : type === 'tanker' ? 55000 : 40000) * scale)
  const lengthOverall  = Math.round((type === 'container' ? 260 : 210) * (0.85 + scale * 0.15))
  const beam           = Math.round(lengthOverall * 0.155 * 10) / 10
  const maxDraft        = Math.round(range(11, 15) * 10) / 10
  const currentDraft    = Math.round((maxDraft - range(0.5, 2.2)) * 10) / 10
  const enginePower     = Math.round((type === 'container' ? 60000 : 14000) * scale)
  const foulingFactor   = Math.round(range(1.0, 1.1) * 100) / 100
  const buildYear       = Math.floor(range(2008, 2024))
  const imo             = String(9100000 + i * 37 + Math.floor(rand() * 30)).slice(0, 7)

  const designSpeed = type === 'container' ? range(16, 20) : range(11, 14)
  const designFuel  = Math.round((type === 'container' ? 180 : 60) * scale)
  const fuelCurve = [-4, -2, 0, 2].map(o => {
    const speedKnots = Math.round((designSpeed + o) * 10) / 10
    return {
      speedKnots,
      fuelTonPerDay: Math.max(1, Math.round(designFuel * (speedKnots / designSpeed) ** 3)),
    }
  }).filter(pt => pt.speedKnots > 0)

  const vessel: Vessel = {
    id, name: `${company.shipPrefix} ${suffix}`, imo, type,
    flag: pick(FLAGS), company: company.name,
    grossTonnage, lengthOverall, beam, maxDraft, currentDraft, enginePower,
    fuelCurve, designSpeedKnots: Math.round(designSpeed * 10) / 10, designSpeedFuelTon: designFuel,
    foulingFactor, status: 'active', buildYear,
  }

  const distanceNm = Math.round(routeEntry?.distanceNm ?? haversineNm(dep, arr))
  const speedKnots = Math.round(range(11, type === 'container' ? 19 : 15) * 10) / 10
  const totalDays  = distanceNm / (speedKnots * 24)
  const etd        = new Date(NOW.getTime() - range(0.5, 8) * 86400000)
  const rtaDate    = new Date(etd.getTime() + totalDays * 86400000)
  const status: VoyageStatus = rand() < 0.15 ? 'delayed' : 'underway'
  const etaDate    = status === 'delayed'
    ? new Date(rtaDate.getTime() + range(0.5, 3) * 86400000)
    : new Date(rtaDate.getTime() + range(-0.2, 0.3) * 86400000)

  // 실제 항로 폴리라인을 따라 진행률(t)만큼 이동한 지점을 현재 위치로 사용
  const progress = range(0.08, 0.9)
  const current  = pointAtFraction(routePoints, progress)
  const ahead    = pointAtFraction(routePoints, Math.min(1, progress + 0.02))
  const actualRoute: Waypoint[] = [
    ...plannedRoute.filter((_, idx) => idx / (plannedRoute.length - 1) <= progress),
    current,
  ]

  const voyage: Voyage = {
    id: voyageId,
    vesselId: id,
    cargoDescription: CARGO_BY_TYPE[type],
    departurePort: formatPortLabel(dep),
    arrivalPort: formatPortLabel(arr),
    etd: etd.toISOString(),
    sta: rtaDate.toISOString(),
    rta: rtaDate.toISOString(),
    rtaConfirmed: true,
    eta: etaDate.toISOString(),
    status,
    plannedRoute,
    actualRoute,
    plannedSpeedKnots: speedKnots,
    recommendedSpeedKnots: Math.round((speedKnots - range(0.5, 2)) * 10) / 10,
    fuelType: pick(FUEL_TYPES),
    cargoTon: Math.round(grossTonnage * range(0.5, 0.85)),
    distanceNm,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  }

  const position: AisPosition = {
    vesselId: id,
    lat: current.lat,
    lng: current.lng,
    speedKnots: Math.round((speedKnots + range(-0.8, 0.8)) * 10) / 10,
    cogDegrees: Math.round(bearing(current, ahead)),
    updatedAt: NOW.toISOString(),
  }

  return { vessel, voyage, position }
}

const GENERATED = ROUTE_PAIRS.map((_, i) => generateOne(i))

export const MOCK_OTHER_VESSELS: Vessel[]        = GENERATED.map(g => g.vessel)
export const MOCK_OTHER_VOYAGES: Voyage[]        = GENERATED.map(g => g.voyage)
export const MOCK_OTHER_POSITIONS: AisPosition[] = GENERATED.map(g => g.position)
