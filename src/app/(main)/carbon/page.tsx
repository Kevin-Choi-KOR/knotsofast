'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useVessels } from '@/shared/hooks/useVessels'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { getFleetType } from '@/shared/utils/fleet'
import {
  CARBON_COMPARISON_LABELS,
  CARBON_HIST_MULTIPLIER,
  CII_SCORE_BENCHMARK_MULTIPLIER,
  CII_SCORE_HIST_MULTIPLIER,
  MOCK_CII_SCORE_BY_VOYAGE,
} from '@/mocks/carbon'
import { ciiGradeFromScore, computeScope3Savings, computeVoyageEmissions } from '@/shared/utils/carbon'
import { StatCards } from './components/StatCards'
import { ComparisonTable, type ComparisonRow } from './components/ComparisonTable'

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

        <ComparisonTable rows={comparisonRows} />
      </div>
    </div>
  )
}
