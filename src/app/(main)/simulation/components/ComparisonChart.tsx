'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/features/theme/ThemeContext'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { SimulationResult } from '@/shared/utils/simulation'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

function chartAxisColors(dark: boolean) {
  return {
    axisLine: dark ? '#334155' : '#e2e8f0',
    axisLabel: dark ? '#94a3b8' : '#64748b',
    tooltipBg: dark ? '#1e293b' : '#ffffff',
    tooltipBorder: dark ? '#334155' : '#e2e8f0',
    tooltipText: dark ? '#e2e8f0' : '#334155',
  }
}

interface ComparisonChartProps {
  planned: SimulationResult
  simulated: SimulationResult
  historical: SimulationResult | null
}

export function ComparisonChart({ planned, simulated, historical }: ComparisonChartProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const dark = theme === 'dark'
  const c = chartAxisColors(dark)

  const categories = [t.simulation.curPlan, t.simulation.simResult, ...(historical ? [t.simulation.historicalLabel] : [])]
  const fuelData = [Math.round(planned.fuel), Math.round(simulated.fuel), ...(historical ? [Math.round(historical.fuel)] : [])]
  const costData = [
    Math.round(planned.cost / 1000),
    Math.round(simulated.cost / 1000),
    ...(historical ? [Math.round(historical.cost / 1000)] : []),
  ]
  const co2Data = [Math.round(planned.co2), Math.round(simulated.co2), ...(historical ? [Math.round(historical.co2)] : [])]

  const gradient = (from: string, to: string) => ({
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  })

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 900,
    animationEasing: 'elasticOut',
    grid: { top: 28, right: 8, bottom: 24, left: 8, containLabel: true },
    legend: { top: 4, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11, color: c.axisLabel } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 12, fontWeight: 'bold', color: c.axisLabel },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: c.axisLine } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: c.axisLine } },
      axisLabel: { fontSize: 11, color: c.axisLabel },
    },
    series: [
      {
        name: t.simulation.fuelLegend,
        type: 'bar',
        barMaxWidth: 44,
        barGap: '10%',
        data: fuelData,
        itemStyle: { borderRadius: [6, 6, 0, 0], color: gradient('#67e8f9', '#6366f1') },
        label: { show: true, position: 'top', fontSize: 10, color: c.axisLabel, formatter: '{c}' },
      },
      {
        name: t.simulation.costLegend,
        type: 'bar',
        barMaxWidth: 44,
        data: costData,
        itemStyle: { borderRadius: [6, 6, 0, 0], color: gradient('#c084fc', '#7c3aed') },
        label: { show: true, position: 'top', fontSize: 10, color: c.axisLabel, formatter: '${c}k' },
      },
      {
        // 다국어 사전을 거치지 않는 고정 계열명
        name: 'CO₂ (ton)',
        type: 'bar',
        barMaxWidth: 44,
        data: co2Data,
        itemStyle: { borderRadius: [6, 6, 0, 0], color: gradient('#4ade80', '#16a34a') },
        label: { show: true, position: 'top', fontSize: 10, color: c.axisLabel, formatter: '{c}' },
      },
    ],
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 text-sm font-semibold">{t.simulation.compareTitle}</div>
      <ReactECharts option={option} notMerge style={{ height: 208 }} />
    </div>
  )
}

export default ComparisonChart
