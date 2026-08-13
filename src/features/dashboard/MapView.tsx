'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, LayerGroup, TileLayer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { WORLD_BOUNDS } from '@/features/dashboard/mapCoords'

const ERROR_TILE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const BASEMAP_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
const SEAMARK_URL = 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'

// DASHBOARD.md 9.3장 — 세계지도가 반복되는 건 가로 방향뿐이다. 세로까지 맞추면
// 화면 비율에 따라 과도한 최소 줌이 잡혀 좌우가 잘린다(KNOWN_PITFALLS.md 2.3).
function applyMinZoom(map: LeafletMap, container: HTMLDivElement) {
  const width = container.clientWidth
  if (width <= 0) return
  const minZoom = Math.ceil(Math.log2(width / 256))
  map.setMinZoom(minZoom)
  if (map.getZoom() < minZoom) map.setZoom(minZoom)
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const baseLayerRef = useRef<TileLayer | null>(null)
  const voyageLayerRef = useRef<LayerGroup | null>(null)
  const portLayerRef = useRef<LayerGroup | null>(null)
  const overlayLayerRef = useRef<LayerGroup | null>(null)

  useEffect(() => {
    // StrictMode에서 effect가 두 번 실행되는 것을 막는 가드.
    let active = true
    let handleResize: (() => void) | undefined

    void (async () => {
      const L = await import('leaflet')
      if (!active || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [20, 100],
        zoom: 3,
        zoomControl: true,
        maxZoom: 15,
        worldCopyJump: false,
        maxBoundsViscosity: 1.0,
        zoomAnimationThreshold: 20,
      })
      map.setMaxBounds(WORLD_BOUNDS)
      mapRef.current = map

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
    })().catch((err) => {
      console.error('[MapView] failed to initialize', err)
    })

    return () => {
      active = false
      if (handleResize) window.removeEventListener('resize', handleResize)

      mapRef.current?.remove()
      mapRef.current = null
      baseLayerRef.current = null
      voyageLayerRef.current = null
      portLayerRef.current = null
      overlayLayerRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
