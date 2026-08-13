import type * as Leaflet from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { Container, Skull, ShieldAlert, Tornado, Waves } from 'lucide-react'
import type { RegionalIssue, TyphoonWarning } from '@/mocks/map-overlays'

const ISSUE_TYPE_COLOR: Record<RegionalIssue['type'], string> = {
  piracy: '#ef4444',
  port_congestion: '#f59e0b',
  geopolitical: '#8b5cf6',
  canal_control: '#6366f1',
}

const ISSUE_TYPE_ICON: Record<RegionalIssue['type'], typeof Skull> = {
  piracy: Skull,
  port_congestion: Container,
  geopolitical: ShieldAlert,
  canal_control: Waves,
}

export const TYPHOON_INTENSITY_COLOR: Record<TyphoonWarning['intensity'], string> = {
  TD: '#94a3b8',
  TS: '#f59e0b',
  TY: '#ef4444',
  STY: '#7c3aed',
}

// DASHBOARD.md 9.6장 — 30×30px 하늘색 라운드 사각형 + ⚓ + (관련 선박 1척 이상이면) 우상단 빨간 배지.
export function buildPortIcon(L: typeof Leaflet, vesselCount: number): Leaflet.DivIcon {
  const badge =
    vesselCount > 0
      ? `<span style="position:absolute;top:-6px;right:-6px;min-width:16px;height:16px;padding:0 3px;border-radius:9999px;background:#ef4444;color:white;font-size:9px;font-weight:700;line-height:16px;text-align:center;">${vesselCount}</span>`
      : ''

  const html = `<div style="position:relative;width:30px;height:30px;">
    <div style="width:30px;height:30px;border-radius:8px;background:#0ea5e9;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;">⚓</div>
    ${badge}
  </div>`

  return L.divIcon({ html, className: '', iconSize: [30, 30], iconAnchor: [15, 15] })
}

// DASHBOARD.md 9.8장 ② — 36×36px 3중 동심원(0.25 → inset 5px/0.45 → inset 10px 불투명+흰 테두리)
// 안에 강도별 아이콘. 깜빡임 클래스(map-marker-alert)는 Leaflet 래퍼가 아니라 이 html의
// 루트 div(자식)에 붙인다 — KNOWN_PITFALLS.md 2.6.
export function buildTyphoonIcon(L: typeof Leaflet, intensity: TyphoonWarning['intensity']): Leaflet.DivIcon {
  const color = TYPHOON_INTENSITY_COLOR[intensity]
  const iconSvg = renderToStaticMarkup(<Tornado color="white" size={14} strokeWidth={2.5} />)

  const html = `<div class="map-marker-alert" style="position:relative;width:36px;height:36px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;"></div>
    <div style="position:absolute;inset:5px;border-radius:50%;background:${color};opacity:0.45;"></div>
    <div style="position:absolute;inset:10px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;">
      ${iconSvg}
    </div>
  </div>`

  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] })
}

// DASHBOARD.md 9.8장 ③ — 36×36px 원형 배지(유형색 배경, 흰 2.5px 테두리) + 유형별 흰색 SVG.
// 깜빡임 클래스는 태풍과 동일하게 html 루트 div(자식)에 붙인다.
export function buildIssueIcon(L: typeof Leaflet, type: RegionalIssue['type']): Leaflet.DivIcon {
  const Icon = ISSUE_TYPE_ICON[type]
  const iconSvg = renderToStaticMarkup(<Icon color="white" size={18} strokeWidth={2} />)

  const html = `<div class="map-marker-alert" style="width:36px;height:36px;border-radius:50%;background:${ISSUE_TYPE_COLOR[type]};border:2.5px solid white;display:flex;align-items:center;justify-content:center;">
    ${iconSvg}
  </div>`

  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] })
}

function windColor(speedMs: number): string {
  if (speedMs >= 15) return '#ef4444'
  if (speedMs >= 10) return '#f59e0b'
  return '#6366f1'
}

// DASHBOARD.md 9.8장 ④ — weatherPane에 배치하는 카드형 마커.
// iconSize:[0,0] + iconAnchor:[0,0] + 내부 div의 translate(-50%,-50%)가 클리핑 방지 정석 패턴
// (KNOWN_PITFALLS.md 2.1) — iconSize를 안 주면 Leaflet이 0×0 컨테이너를 만들어 텍스트를 잘라낸다.
export function buildWeatherIcon(
  L: typeof Leaflet,
  point: { name: string; windSpeed: number; windDir: number; waveHeight: number },
): Leaflet.DivIcon {
  const color = windColor(point.windSpeed)

  const html = `<div style="transform:translate(-50%,-50%);background:rgba(248,250,252,0.48);backdrop-filter:blur(6px);border:1px solid rgba(203,213,225,0.35);border-radius:8px;padding:5px 9px;min-width:72px;">
    <div style="display:flex;align-items:center;gap:3px;">
      <svg width="12" height="12" viewBox="0 0 24 24" style="transform:rotate(${point.windDir}deg);flex-shrink:0;">
        <path d="M12 2 L18 14 L12 10.5 L6 14 Z" fill="${color}" />
      </svg>
      <span style="font-size:12px;font-weight:700;color:${color};">${point.windSpeed.toFixed(1)}m/s</span>
    </div>
    <div style="font-size:10px;color:#475569;">파고 ${point.waveHeight.toFixed(1)}m</div>
    <div style="font-size:8px;color:#94a3b8;">${point.name}</div>
  </div>`

  return L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] })
}
