'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useVessels } from '@/shared/hooks/useVessels'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { getFleetType } from '@/shared/utils/fleet'
import {
  ANCHOR_REFERENCE_CO2_TON,
  CARBON_COMPARISON_LABELS,
  CARBON_HIST_MULTIPLIER,
  CII_SCORE_BENCHMARK_MULTIPLIER,
  CII_SCORE_HIST_MULTIPLIER,
  CII_TREND_MONTHS,
  CO2_CAR_TON_PER_KM,
  CO2_CHICKEN_TON,
  CO2_TREE_ABSORB_TON_PER_YEAR,
  COMPLIANCE_BASE_KRW,
  EARTH_CIRCUMFERENCE_KM,
  MOCK_CII_SCORE_BY_VOYAGE,
  MOCK_FLEET_ECO_RANKING,
} from '@/mocks/carbon'
import { CII_GRADES, ciiGradeFromScore, computeScope3Savings, computeVoyageEmissions } from '@/shared/utils/carbon'
import { StatCards } from './components/StatCards'
import { ComparisonTable, type ComparisonRow } from './components/ComparisonTable'
import { CiiGauge } from './components/CiiGauge'
import { CiiTrendChart } from './components/CiiTrendChart'
import { CiiSimulator } from './components/CiiSimulator'
import { AnchorCarbon } from './components/AnchorCarbon'
import { FunFacts } from './components/FunFacts'
import { EcoRanking, type EcoRankingRow } from './components/EcoRanking'

export default function CarbonPage() {
  const { t } = useLanguage()
  const { vessels } = useVessels()
  const { voyages } = useVoyages()
  const [voyageId, setVoyageId] = useState<string | null>(null)

  // 자사(운항선) 항차만 대상 — 남의 배 배출량을 섞으면 규제 대응 자료로서 의미가 없다.
  const ownVoyages = useMemo(
    () => voyages.filter((v) => getFleetType(vessels.find((ves) => ves.id === v.vesselId)) === 'own'),
    [voyages, vessels],
  )

  const selectedVoyage = ownVoyages.find((v) => v.id === voyageId) ?? ownVoyages[0]
  const selectedVessel = vessels.find((v) => v.id === selectedVoyage?.vesselId)

  if (!selectedVoyage || !selectedVessel) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title={t.carbon.title} />
        <div className="p-6 text-xs text-slate-500 dark:text-slate-400">{t.common.loading}</div>
      </div>
    )
  }

  const baseCiiScore = MOCK_CII_SCORE_BY_VOYAGE[selectedVoyage.id] ?? 4.5
  const currentGrade = ciiGradeFromScore(baseCiiScore)
  const current = computeVoyageEmissions(
    selectedVessel.fuelCurve,
    selectedVoyage.recommendedSpeedKnots,
    selectedVoyage.distanceNm,
    selectedVoyage.fuelType,
  )

  const historicalScore = baseCiiScore * CII_SCORE_HIST_MULTIPLIER
  const historical = {
    ciiScore: historicalScore,
    grade: ciiGradeFromScore(historicalScore),
    totalFuelTon: current.totalFuelTon * CARBON_HIST_MULTIPLIER,
    totalCo2Ton: current.totalCo2Ton * CARBON_HIST_MULTIPLIER,
  }

  // 벤치마크는 고정 배수가 아니라 유사 선박(동일 선종·총톤수 ±35%) 실계산이다 — 결과가 음수일 수 있다.
  const scope3 = computeScope3Savings(selectedVoyage, selectedVessel, vessels, current.totalCo2Ton)
  const benchmarkScore = baseCiiScore * CII_SCORE_BENCHMARK_MULTIPLIER
  const benchmark = {
    ciiScore: benchmarkScore,
    grade: ciiGradeFromScore(benchmarkScore),
    totalFuelTon: scope3.benchmarkFuelTon,
    totalCo2Ton: scope3.benchmarkCo2Ton,
  }

  // 7개월치를 현재 점수로 끝나도록 역산 — 7개월에 걸쳐 18% 개선된 것처럼 보이는 우하향 곡선
  const ciiTrendScores = CII_TREND_MONTHS.map((_, i) => Number((baseCiiScore * (1.18 - 0.18 * (i / 6))).toFixed(2)))

  const gradeIdx = CII_GRADES.indexOf(currentGrade)
  const ciiSimOptimizedScore = Number((baseCiiScore * 0.85).toFixed(2))
  const ciiSimOptimizedGrade = ciiGradeFromScore(ciiSimOptimizedScore)
  // 회피 등급 = 감속하지 않았다면 떨어졌을, 현재보다 한 단계 나쁜 등급
  const avoidedGrade = gradeIdx < 4 ? CII_GRADES[gradeIdx + 1] : currentGrade
  const complianceRiskKrw = COMPLIANCE_BASE_KRW * (current.totalCo2Ton / ANCHOR_REFERENCE_CO2_TON)
  const complianceAmountLabel = `${(complianceRiskKrw / 1e8).toFixed(0)}억원`

  // 원본 예시(voy001, CO₂ 3,976.4t)에서 잡은 비율을 선택 항차의 실제 총량에 맞춰 환산한다.
  const anchorScale = current.totalCo2Ton / ANCHOR_REFERENCE_CO2_TON
  const anchorBaseline = {
    sailingCo2Ton: Number((100 * anchorScale).toFixed(1)),
    anchorCo2Ton: Number((30 * anchorScale).toFixed(1)),
  }
  const anchorOptimized = {
    sailingCo2Ton: Number((85 * anchorScale).toFixed(1)),
    anchorCo2Ton: 0,
  }
  const anchorSavedTon =
    anchorBaseline.sailingCo2Ton + anchorBaseline.anchorCo2Ton - (anchorOptimized.sailingCo2Ton + anchorOptimized.anchorCo2Ton)

  // 재미 요소 환산 — 참고용 근사값
  const treeCount = Math.round(scope3.savedTon / CO2_TREE_ABSORB_TON_PER_YEAR)
  const earthLaps = scope3.savedTon / CO2_CAR_TON_PER_KM / EARTH_CIRCUMFERENCE_KM
  const chickenCount = Math.round(scope3.savedTon / CO2_CHICKEN_TON)

  // 선택된 선박은 목업 목록에서 제거한 뒤 실시간 계산값을 앞에 끼워 넣는다 — 결과는 항상 5행.
  const fleetRanking: EcoRankingRow[] = [
    {
      vesselId: selectedVessel.id,
      vesselName: selectedVessel.name,
      co2SavedPct: scope3.savedPct,
      co2SavedTon: scope3.savedTon,
      isCurrent: true,
    },
    ...MOCK_FLEET_ECO_RANKING.filter((r) => r.vesselId !== selectedVessel.id).map((r) => ({
      vesselId: r.vesselId,
      vesselName: vessels.find((v) => v.id === r.vesselId)?.name ?? r.vesselId,
      co2SavedPct: r.co2SavedPct,
      co2SavedTon: r.co2SavedTon,
      isCurrent: false,
    })),
  ].sort((a, b) => b.co2SavedPct - a.co2SavedPct)
  const fleetRank = fleetRanking.findIndex((r) => r.isCurrent) + 1

  const comparisonRows: ComparisonRow[] = [
    {
      label: `${t.carbon.curVoyage} (${selectedVessel.name})`,
      ciiScore: baseCiiScore,
      grade: currentGrade,
      totalFuelTon: current.totalFuelTon,
      totalCo2Ton: current.totalCo2Ton,
      highlight: true,
    },
    {
      label: CARBON_COMPARISON_LABELS.historicalAvg,
      ciiScore: historical.ciiScore,
      grade: historical.grade,
      totalFuelTon: historical.totalFuelTon,
      totalCo2Ton: historical.totalCo2Ton,
    },
    {
      label: CARBON_COMPARISON_LABELS.benchmarkAvg,
      ciiScore: benchmark.ciiScore,
      grade: benchmark.grade,
      totalFuelTon: benchmark.totalFuelTon,
      totalCo2Ton: benchmark.totalCo2Ton,
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.carbon.title} subtitle={t.carbon.subtitle(selectedVessel.name)} />

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.carbon.voyageSelectLabel}
          </label>
          <select
            value={selectedVoyage.id}
            onChange={(e) => setVoyageId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
          >
            {ownVoyages.map((voyage) => {
              const vessel = vessels.find((v) => v.id === voyage.vesselId)
              return (
                <option key={voyage.id} value={voyage.id}>
                  {vessel?.name} · {voyage.departurePort.split(' ')[0]} → {voyage.arrivalPort.split(' ')[0]}
                </option>
              )
            })}
          </select>
        </div>

        <StatCards
          ciiScore={baseCiiScore}
          ciiGrade={currentGrade}
          totalCo2Ton={current.totalCo2Ton}
          totalFuelTon={current.totalFuelTon}
          vsBenchmarkPct={scope3.savedPct}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CiiGauge score={baseCiiScore} grade={currentGrade} />
          <CiiTrendChart months={CII_TREND_MONTHS} scores={ciiTrendScores} />
          <CiiSimulator
            currentGrade={currentGrade}
            optimizedGrade={ciiSimOptimizedGrade}
            plannedSpeedKnots={selectedVoyage.plannedSpeedKnots}
            recommendedSpeedKnots={selectedVoyage.recommendedSpeedKnots}
            avoidedGrade={avoidedGrade}
            complianceAmountLabel={complianceAmountLabel}
          />
        </div>

        <AnchorCarbon baseline={anchorBaseline} optimized={anchorOptimized} savedTon={anchorSavedTon} />

        <ComparisonTable rows={comparisonRows} />

        <div className="grid overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 lg:grid-cols-[580px_1fr]">
          <FunFacts savedTon={scope3.savedTon} treeCount={treeCount} earthLaps={earthLaps} chickenCount={chickenCount} />
          <EcoRanking rows={fleetRanking} rank={fleetRank} total={fleetRanking.length} />
        </div>
      </div>
    </div>
  )
}
