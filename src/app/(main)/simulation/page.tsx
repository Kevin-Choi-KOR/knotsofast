'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
} from '@/shared/utils/simulation'
import { SimulationForm } from './components/SimulationForm'
import { SavingsCard } from './components/SavingsCard'
import { EtaCard } from './components/EtaCard'
import { ComparisonChart } from './components/ComparisonChart'

export default function SimulationPage() {
  const { t } = useLanguage()
  const { vessels } = useVessels()
  const { voyages } = useVoyages()
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const [voyageId, setVoyageId] = useState('')
  const [departureOffset, setDepartureOffset] = useState(0)
  const [speedKnots, setSpeedKnots] = useState(14)
  const [cargoPercent, setCargoPercent] = useState(80)
  const [route, setRoute] = useState<SimRoute>('suez')
  const [portCongestion, setPortCongestion] = useState<PortCongestion>('medium')
  const [berthProgress, setBerthProgress] = useState(60)
  const [compareVoyageId, setCompareVoyageId] = useState('')
  const [applied, setApplied] = useState<SimInputs | null>(null)

  useEffect(() => {
    if (applied || voyages.length === 0) return
    const defaultVoyageId = ownVoyages[0]?.id ?? ''
    const defaultCompareVoyageId = completedVoyages[0]?.id ?? ''
    const defaults: SimInputs = {
      voyageId: defaultVoyageId,
      departureOffset: 0,
      speedKnots: 14,
      cargoPercent: 80,
      route: 'suez',
      portCongestion: 'medium',
      berthProgress: 60,
      compareVoyageId: defaultCompareVoyageId,
    }
    // 데이터 로딩 완료 시점에 딱 한 번만 초안·적용 상태를 채우는 초기화라 effect에서 직접 갱신한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoyageId(defaultVoyageId)
    setCompareVoyageId(defaultCompareVoyageId)
    setApplied(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyages.length])

  const isDirty =
    applied !== null &&
    (voyageId !== applied.voyageId ||
      departureOffset !== applied.departureOffset ||
      speedKnots !== applied.speedKnots ||
      cargoPercent !== applied.cargoPercent ||
      route !== applied.route ||
      portCongestion !== applied.portCongestion ||
      berthProgress !== applied.berthProgress ||
      compareVoyageId !== applied.compareVoyageId)

  const runSimulation = () => {
    setApplied({
      voyageId,
      departureOffset,
      speedKnots,
      cargoPercent,
      route,
      portCongestion,
      berthProgress,
      compareVoyageId,
    })
    // window가 아니라 내부 overflow-y-auto 컨테이너를 직접 참조해 스크롤한다 — 페이지 자체는 스크롤되지 않는다.
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectedVoyage = ownVoyages.find((v) => v.id === voyageId) ?? ownVoyages[0]

  // 결과·차트는 오직 applied만 참조한다 — 초안 값을 섞어 쓰면 "실행을 눌러야 반영"이라는 핵심 규칙이 깨진다.
  const appliedVoyage = applied ? (ownVoyages.find((v) => v.id === applied.voyageId) ?? selectedVoyage) : undefined
  const appliedVessel = appliedVoyage ? vessels.find((v) => v.id === appliedVoyage.vesselId) : undefined

  if (!applied || !selectedVoyage || !appliedVoyage || !appliedVessel) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title={t.simulation.title} subtitle={t.simulation.subtitle} />
        <div className="p-6 text-xs text-slate-500 dark:text-slate-400">{t.common.loading}</div>
      </div>
    )
  }

  const compareVoyage = completedVoyages.find((v) => v.id === applied.compareVoyageId)
  const compareVessel = compareVoyage ? vessels.find((v) => v.id === compareVoyage.vesselId) : undefined

  const congestionWaitHours = CONGESTION_WAIT_HOURS[applied.portCongestion]
  const berthWaitHours = Math.max(0, ((100 - applied.berthProgress) / 100) * AVG_BERTH_UNLOAD_HOURS)
  const portWaitHours = congestionWaitHours + berthWaitHours

  const planned = computePlannedResult(appliedVoyage, appliedVessel, applied)
  const simulated = computeSimulatedResult(appliedVoyage, appliedVessel, applied, portWaitHours)
  const historical = compareVoyage && compareVessel ? computeHistoricalResult(compareVoyage, compareVessel) : null
  const saving = computeSaving(planned, simulated)

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.simulation.title} subtitle={t.simulation.subtitle} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <SimulationForm
            ownVoyages={ownVoyages}
            completedVoyages={completedVoyages}
            vessels={vessels}
            selectedVoyage={selectedVoyage}
            voyageId={voyageId}
            onVoyageIdChange={setVoyageId}
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
            isDirty={isDirty}
            onRun={runSimulation}
            onDownloadPdf={() => {}}
          />

          <div className="space-y-4">
            <SavingsCard saving={saving} />
            <EtaCard
              plannedEta={appliedVoyage.eta}
              plannedDays={planned.days}
              simEta={simulated.eta}
              simDays={simulated.days}
              portWaitHours={portWaitHours}
              portWaitCostUsd={portWaitHours * WAIT_COST_USD_PER_HOUR}
            />
            <ComparisonChart planned={planned} simulated={simulated} historical={historical} />
          </div>
        </div>
      </div>
    </div>
  )
}
