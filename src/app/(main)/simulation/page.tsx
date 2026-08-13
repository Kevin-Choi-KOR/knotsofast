'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useVessels } from '@/shared/hooks/useVessels'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { getFleetType } from '@/shared/utils/fleet'
import type { PortCongestion } from '@/mocks/simulation'
import { AVG_BERTH_UNLOAD_HOURS, CONGESTION_WAIT_HOURS, WAIT_COST_USD_PER_HOUR } from '@/mocks/simulation'
import type { SimInputs, SimRoute } from '@/shared/utils/simulation'
import {
  computeHistoricalResult,
  computePlannedResult,
  computeSaving,
  computeSimulatedResult,
  draftFactor,
  routeDistanceOf,
} from '@/shared/utils/simulation'
import { interpolateFuelTonPerDay } from '@/shared/utils/format'
import { SimulationForm } from './components/SimulationForm'
import { SavingsCard } from './components/SavingsCard'
import { EtaCard } from './components/EtaCard'
import { ComparisonChart } from './components/ComparisonChart'
import { SpeedCurveChart } from './components/SpeedCurveChart'
import { generateSimulationPdf } from './components/simulationPdf'

export default function SimulationPage() {
  const { t } = useLanguage()
  const { vessels } = useVessels()
  const { voyages } = useVoyages()
  // 대상 항차 후보: preparing·underway + 자사 선박만 (delayed·타사/파트너선 제외)
  const ownVoyages = useMemo(
    () =>
      voyages.filter(
        (v) =>
          (v.status === 'preparing' || v.status === 'underway') &&
          getFleetType(vessels.find((ves) => ves.id === v.vesselId)) === 'own',
      ),
    [voyages, vessels],
  )
  const completedVoyages = useMemo(() => voyages.filter((v) => v.status === 'completed'), [voyages])

  // 초안/적용 구분 없이, 조건을 바꾸면 즉시 결과에 반영된다 — 이 8개 상태가 곧 "현재 조건"이다.
  const [voyageId, setVoyageId] = useState('')
  const [departureOffset, setDepartureOffset] = useState(0)
  const [speedKnots, setSpeedKnots] = useState(14)
  const [cargoPercent, setCargoPercent] = useState(80)
  const [route, setRoute] = useState<SimRoute>('suez')
  const [portCongestion, setPortCongestion] = useState<PortCongestion>('medium')
  const [berthProgress, setBerthProgress] = useState(60)
  const [compareVoyageId, setCompareVoyageId] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized || voyages.length === 0) return
    const defaultVoyage = ownVoyages[0]
    const defaultCompareVoyageId = completedVoyages[0]?.id ?? ''
    // 데이터 로딩 완료 시점에 딱 한 번만 기본값을 채우는 초기화라 effect에서 직접 갱신한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoyageId(defaultVoyage?.id ?? '')
    // 첫 화면부터 그 항차의 실제 계획 속도로 슬라이더를 맞춘다(고정 14가 아니라 실데이터 기준).
    if (defaultVoyage) setSpeedKnots(defaultVoyage.plannedSpeedKnots)
    setCompareVoyageId(defaultCompareVoyageId)
    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyages.length])

  const selectedVoyage = ownVoyages.find((v) => v.id === voyageId) ?? ownVoyages[0]
  const selectedVessel = selectedVoyage ? vessels.find((v) => v.id === selectedVoyage.vesselId) : undefined

  if (!initialized || !selectedVoyage || !selectedVessel) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title={t.simulation.title} subtitle={t.simulation.subtitle} />
        <div className="p-6 text-xs text-slate-500 dark:text-slate-400">{t.common.loading}</div>
      </div>
    )
  }

  const current: SimInputs = {
    voyageId,
    departureOffset,
    speedKnots,
    cargoPercent,
    route,
    portCongestion,
    berthProgress,
    compareVoyageId,
  }

  const compareVoyage = completedVoyages.find((v) => v.id === compareVoyageId)
  const compareVessel = compareVoyage ? vessels.find((v) => v.id === compareVoyage.vesselId) : undefined

  const congestionWaitHours = CONGESTION_WAIT_HOURS[portCongestion]
  const berthWaitHours = Math.max(0, ((100 - berthProgress) / 100) * AVG_BERTH_UNLOAD_HOURS)
  const portWaitHours = congestionWaitHours + berthWaitHours

  const planned = computePlannedResult(selectedVoyage, selectedVessel, current)
  const simulated = computeSimulatedResult(selectedVoyage, selectedVessel, current, portWaitHours)
  const historical = compareVoyage && compareVessel ? computeHistoricalResult(compareVoyage, compareVessel) : null
  const saving = computeSaving(planned, simulated)

  const defaultVoyageId = ownVoyages[0]?.id ?? ''
  const defaultCompareVoyageId = completedVoyages[0]?.id ?? ''

  // 항차를 바꾸면 그 항차의 실제 계획 속도로 속도 슬라이더를 맞춘다 — 그러지 않으면
  // 항차를 바꿔도 이전 항차의 속도값이 그대로 남아 결과가 체감상 안 바뀐 것처럼 보인다.
  const handleVoyageIdChange = (id: string) => {
    setVoyageId(id)
    const nextVoyage = ownVoyages.find((v) => v.id === id)
    if (nextVoyage) setSpeedKnots(nextVoyage.plannedSpeedKnots)
  }

  const resetToDefaults = () => {
    setVoyageId(defaultVoyageId)
    setDepartureOffset(0)
    setSpeedKnots(ownVoyages[0]?.plannedSpeedKnots ?? 14)
    setCargoPercent(80)
    setRoute('suez')
    setPortCongestion('medium')
    setBerthProgress(60)
    setCompareVoyageId(defaultCompareVoyageId)
  }

  // AI 추천: 선박의 AI 권장 속도 + 표준 적재율(80%, 흘수 보정 계수가 1이 되는 기준점) +
  // 두 항로 중 예상 비용이 더 낮은 노선을 자동 계산해 적용한다. 출발 시점은 변경하지 않는다.
  const applyAiRecommendation = () => {
    const recommendedSpeed = selectedVoyage.recommendedSpeedKnots
    const recommendedCargo = 80
    const costFor = (r: SimRoute) =>
      computeSimulatedResult(
        selectedVoyage,
        selectedVessel,
        { ...current, departureOffset: 0, speedKnots: recommendedSpeed, cargoPercent: recommendedCargo, route: r },
        portWaitHours,
      ).cost
    const recommendedRoute: SimRoute = costFor('cape') < costFor('suez') ? 'cape' : 'suez'

    setDepartureOffset(0)
    setSpeedKnots(recommendedSpeed)
    setCargoPercent(recommendedCargo)
    setRoute(recommendedRoute)
  }

  const downloadPdf = () => {
    const doc = generateSimulationPdf({
      voyage: selectedVoyage,
      vessel: selectedVessel,
      applied: current,
      compareVoyage: compareVoyage ?? null,
      planned,
      simulated,
      historical,
      saving,
      portWaitHours,
      portWaitCostUsd: portWaitHours * WAIT_COST_USD_PER_HOUR,
    })
    doc.save(`KSF-Simulation-${selectedVoyage.id}-${Date.now()}.pdf`)
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.simulation.title} subtitle={t.simulation.subtitle} />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <SimulationForm
            ownVoyages={ownVoyages}
            completedVoyages={completedVoyages}
            vessels={vessels}
            selectedVoyage={selectedVoyage}
            voyageId={voyageId}
            onVoyageIdChange={handleVoyageIdChange}
            departureOffset={departureOffset}
            onDepartureOffsetChange={setDepartureOffset}
            speedKnots={speedKnots}
            onSpeedKnotsChange={setSpeedKnots}
            cargoPercent={cargoPercent}
            onCargoPercentChange={setCargoPercent}
            route={route}
            onRouteChange={setRoute}
            portCongestion={portCongestion}
            onPortCongestionChange={setPortCongestion}
            berthProgress={berthProgress}
            onBerthProgressChange={setBerthProgress}
            compareVoyageId={compareVoyageId}
            onCompareVoyageIdChange={setCompareVoyageId}
            onDownloadPdf={downloadPdf}
            onReset={resetToDefaults}
            onApplyAiRecommendation={applyAiRecommendation}
          />

          <div className="space-y-4">
            <SavingsCard saving={saving} />
            <EtaCard
              plannedEta={selectedVoyage.eta}
              plannedDays={planned.days}
              simEta={simulated.eta}
              simDays={simulated.days}
              portWaitHours={portWaitHours}
              portWaitCostUsd={portWaitHours * WAIT_COST_USD_PER_HOUR}
            />
            <ComparisonChart planned={planned} simulated={simulated} historical={historical} />
            <SpeedCurveChart
              routeDistance={routeDistanceOf(selectedVoyage, route)}
              baseFuelPerDay={interpolateFuelTonPerDay(selectedVessel.fuelCurve, 14)}
              draftFactor={draftFactor(cargoPercent)}
              plannedSpeedKnots={selectedVoyage.plannedSpeedKnots}
              simSpeedKnots={speedKnots}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
