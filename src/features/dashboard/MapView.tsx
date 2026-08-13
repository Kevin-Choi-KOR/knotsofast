'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, LayerGroup, Marker, TileLayer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PORTS } from '@/mocks/ports'
import { MOCK_DANGER_ZONES, MOCK_REGIONAL_ISSUES, generateMockWeatherPoints, type TyphoonWarning } from '@/mocks/map-overlays'
import { WORLD_BOUNDS, wrapLng } from '@/features/dashboard/mapCoords'
import { buildIssueIcon, buildPortIcon, buildTyphoonIcon, buildWeatherIcon, TYPHOON_INTENSITY_COLOR } from '@/features/dashboard/mapIcons'
import { buildIssuePopupHtml, buildPortPopupHtml, buildTyphoonPopupHtml } from '@/features/dashboard/mapPopups'
import type { MapLayers } from '@/features/dashboard/filters'
import type { PortAggregate } from '@/features/dashboard/portAggregation'

const ERROR_TILE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const BASEMAP_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
const SEAMARK_URL = 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'

const DEFAULT_CENTER: [number, number] = [20, 100]
const DEFAULT_ZOOM = 3

// DASHBOARD.md 3.4장 — 태풍은 목업을 두지 않는다. GDACS 실시간 API(11.2장, L4)가 붙기 전까지는
// 항상 빈 배열이며, 태풍 레이어에는 아무것도 그려지지 않는 것이 정상이다.
const NO_TYPHOONS: TyphoonWarning[] = []

// DASHBOARD.md 9.9장 — 리스트·게이지 카드 등 외부에서 지도를 이동시키는 인터페이스.
export interface MapFocusTarget {
  lat: number
  lng: number
  zoom: number
  token: number // 매 클릭마다 증가 — 같은 좌표 재클릭도 반응하게 한다
  marker?: { kind: 'issue' | 'port'; id: string } // 이동 후 이 마커 팝업을 자동으로 연다
  direct?: boolean // true면 setView, false/undefined면 flyTo
}

export interface MapViewProps {
  portAggregates: Map<string, PortAggregate> // 9.6장 — page.tsx에서 한 번만 계산해 지도·리스트가 공유
  layers: MapLayers
  focusTarget?: MapFocusTarget
}

// DASHBOARD.md 9.3장 — 세계지도가 반복되는 건 가로 방향뿐이다. 세로까지 맞추면
// 화면 비율에 따라 과도한 최소 줌이 잡혀 좌우가 잘린다(KNOWN_PITFALLS.md 2.3).
function applyMinZoom(map: LeafletMap, container: HTMLDivElement) {
  const width = container.clientWidth
  if (width <= 0) return
  const minZoom = Math.ceil(Math.log2(width / 256))
  map.setMinZoom(minZoom)
  if (map.getZoom() < minZoom) map.setZoom(minZoom)
}

function MapView({ portAggregates, layers, focusTarget }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const leafletModuleRef = useRef<typeof import('leaflet') | null>(null)
  const baseLayerRef = useRef<TileLayer | null>(null)
  const voyageLayerRef = useRef<LayerGroup | null>(null)
  const portLayerRef = useRef<LayerGroup | null>(null)
  const overlayLayerRef = useRef<LayerGroup | null>(null)
  // 9.6/9.8장 — 리스트 클릭 시 팝업을 열 수 있도록 코드/id로 마커를 보관해둔다.
  const portMarkersRef = useRef<Map<string, Marker>>(new Map())
  const issueMarkersRef = useRef<Map<string, Marker>>(new Map())
  const [mapReady, setMapReady] = useState(false)

  const weatherPoints = useMemo(() => generateMockWeatherPoints(), [])

  useEffect(() => {
    // StrictMode에서 effect가 두 번 실행되는 것을 막는 가드.
    let active = true
    let handleResize: (() => void) | undefined
    const portMarkers = portMarkersRef.current
    const issueMarkers = issueMarkersRef.current

    void (async () => {
      const L = await import('leaflet')
      if (!active || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        maxZoom: 15,
        worldCopyJump: false,
        maxBoundsViscosity: 1.0,
        zoomAnimationThreshold: 20,
      })
      map.setMaxBounds(WORLD_BOUNDS)
      mapRef.current = map
      leafletModuleRef.current = L

      baseLayerRef.current = L.tileLayer(BASEMAP_URL, {
        maxZoom: 18,
        maxNativeZoom: 17,
        errorTileUrl: ERROR_TILE_URL,
      }).addTo(map)

      // 해도(OpenSeaMap) — 지원 범위를 넘는 줌에서 오류 문구가 그려진 이미지를 200으로
      // 반환하므로 errorTileUrl로는 걸러지지 않는다. maxZoom을 낮게 고정해 요청 자체를 막는다.
      L.tileLayer(SEAMARK_URL, {
        opacity: 0.7,
        maxZoom: 12,
        errorTileUrl: ERROR_TILE_URL,
      }).addTo(map)

      // 기상 카드를 선박 마커(markerPane, z-index 600) 아래에 두기 위한 커스텀 pane.
      const weatherPane = map.createPane('weatherPane')
      weatherPane.style.zIndex = '400'
      weatherPane.style.pointerEvents = 'none'

      voyageLayerRef.current = L.layerGroup().addTo(map)
      portLayerRef.current = L.layerGroup().addTo(map)
      overlayLayerRef.current = L.layerGroup().addTo(map)

      applyMinZoom(map, containerRef.current)
      requestAnimationFrame(() => {
        if (!active || !containerRef.current) return
        applyMinZoom(map, containerRef.current)
        map.invalidateSize()
      })

      handleResize = () => {
        if (!containerRef.current) return
        applyMinZoom(map, containerRef.current)
        map.invalidateSize()
      }
      window.addEventListener('resize', handleResize)

      setMapReady(true)
    })().catch((err) => {
      console.error('[MapView] failed to initialize', err)
    })

    return () => {
      active = false
      setMapReady(false)
      if (handleResize) window.removeEventListener('resize', handleResize)

      mapRef.current?.remove()
      mapRef.current = null
      leafletModuleRef.current = null
      baseLayerRef.current = null
      voyageLayerRef.current = null
      portLayerRef.current = null
      overlayLayerRef.current = null
      portMarkers.clear()
      issueMarkers.clear()
    }
  }, [])

  // DASHBOARD.md 9.6장 — 항구 레이어. layers.ports가 꺼지면 아무것도 그리지 않는다.
  // effect는 항상 clearLayers()로 비운 뒤 다시 그린다(9.5장).
  useEffect(() => {
    const L = leafletModuleRef.current
    const layerGroup = portLayerRef.current
    if (!mapReady || !L || !layerGroup) return

    layerGroup.clearLayers()
    portMarkersRef.current.clear()
    if (!layers.ports) return

    for (const port of PORTS) {
      const agg = portAggregates.get(port.code)
      const count = (agg?.berthed.length ?? 0) + (agg?.departing.length ?? 0) + (agg?.arriving.length ?? 0)

      const marker = L.marker([port.lat, wrapLng(port.lng)], { icon: buildPortIcon(L, count) })
      marker.bindPopup(buildPortPopupHtml(port, agg))
      marker.addTo(layerGroup)
      portMarkersRef.current.set(port.code, marker)
    }
  }, [mapReady, portAggregates, layers.ports])

  // DASHBOARD.md 9.8장 — 오버레이 레이어(위험구역·태풍·지역 이슈·기상). 카테고리별로 layers
  // 플래그를 확인해가며 하나의 overlayLayer에 다시 그린다(9.5장).
  useEffect(() => {
    const L = leafletModuleRef.current
    const layerGroup = overlayLayerRef.current
    if (!mapReady || !L || !layerGroup) return

    layerGroup.clearLayers()
    issueMarkersRef.current.clear()

    if (layers.dangerZones) {
      for (const zone of MOCK_DANGER_ZONES) {
        L.circle([zone.center[0], wrapLng(zone.center[1])], {
          radius: zone.radiusKm * 1000,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '8,4',
        })
          .bindTooltip(zone.label, { sticky: true })
          .addTo(layerGroup)
      }
    }

    if (layers.typhoon) {
      for (const typhoon of NO_TYPHOONS) {
        const color = TYPHOON_INTENSITY_COLOR[typhoon.intensity]
        L.circle([typhoon.lat, wrapLng(typhoon.lng)], {
          radius: typhoon.radiusKm * 1000,
          color,
          fillColor: color,
          fillOpacity: 0.07,
          weight: 2,
          dashArray: '10,5',
        }).addTo(layerGroup)

        L.marker([typhoon.lat, wrapLng(typhoon.lng)], { icon: buildTyphoonIcon(L, typhoon.intensity) })
          .bindPopup(buildTyphoonPopupHtml(typhoon))
          .addTo(layerGroup)
      }
    }

    if (layers.issues) {
      for (const issue of MOCK_REGIONAL_ISSUES) {
        const marker = L.marker([issue.lat, wrapLng(issue.lng)], { icon: buildIssueIcon(L, issue.type) })
        marker.bindPopup(buildIssuePopupHtml(issue))
        marker.addTo(layerGroup)
        issueMarkersRef.current.set(issue.id, marker)
      }
    }

    if (layers.weather) {
      for (const point of weatherPoints) {
        L.marker([point.lat, wrapLng(point.lng)], { icon: buildWeatherIcon(L, point), pane: 'weatherPane' }).addTo(layerGroup)
      }
    }
  }, [mapReady, layers.dangerZones, layers.typhoon, layers.issues, layers.weather, weatherPoints])

  // DASHBOARD.md 9.9장 — 지도 이동(focus) 처리. 의존성은 [mapReady, focusTarget?.token]뿐이다 —
  // 좌표가 같아도 token만 바뀌면 재실행되게 하기 위해, 실제 좌표는 ref로 최신값만 읽는다.
  const focusTargetRef = useRef(focusTarget)
  useEffect(() => {
    focusTargetRef.current = focusTarget
  }, [focusTarget])

  useEffect(() => {
    const map = mapRef.current
    const target = focusTargetRef.current
    if (!mapReady || !map || !target) return

    const point: [number, number] = [target.lat, wrapLng(target.lng)]
    if (target.direct) {
      map.setView(point, target.zoom, { animate: true })
    } else {
      map.flyTo(point, target.zoom, { duration: 0.8 })
    }

    if (target.marker) {
      const { kind, id } = target.marker
      map.once('moveend', () => {
        const markers = kind === 'issue' ? issueMarkersRef.current : portMarkersRef.current
        markers.get(id)?.openPopup()
      })
    }
  }, [mapReady, focusTarget?.token])

  return <div ref={containerRef} className="absolute inset-0" />
}

export default MapView
