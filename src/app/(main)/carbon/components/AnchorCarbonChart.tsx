'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/features/theme/ThemeContext'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { chartAxisColors } from './chartTheme'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface AnchorScenario {
  label: string
  sailingCo2Ton: number
  anchorCo2Ton: number
}

export function AnchorCarbonChart({ baseline, optimized }: { baseline: AnchorScenario; optimized: AnchorScenario }) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const dark = theme === 'dark'
  const c = chartAxisColors(dark)

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 11, color: c.axisLabel },
    },
    grid: { top: 40, right: 12, bottom: 24, left: 16, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
      formatter: (params: { seriesName: string; value: number; marker: string; name: string }[]) => {
        const total = params.reduce((sum, p) => sum + p.value, 0)
        const lines = params.map((p) => `${p.marker} ${p.seriesName}: <b>${p.value}</b> ton`)
        return [params[0]?.name, ...lines, `${t.carbon.colTotalCo2}: <b>${total}</b> ton`].join('<br/>')
      },
    },
    xAxis: {
      type: 'category',
      data: [baseline.label, optimized.label],
      axisTick: { show: false },
      axisLine: { lineStyle: { color: c.axisLine } },
      axisLabel: { fontSize: 11, color: c.axisLabel },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: c.axisLabel, formatter: (v: number) => `${v}t` },
      splitLine: { lineStyle: { type: 'dashed', color: c.axisLine } },
    },
    series: [
      {
        name: t.carbon.sailingLegend,
        type: 'bar',
        stack: 'co2',
        barMaxWidth: 72,
        data: [baseline.sailingCo2Ton, optimized.sailingCo2Ton],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#67e8f9' },
              { offset: 1, color: '#6366f1' },
            ],
          },
        },
      },
      {
        name: t.carbon.anchorLegend,
        type: 'bar',
        stack: 'co2',
        barMaxWidth: 72,
        data: [baseline.anchorCo2Ton, optimized.anchorCo2Ton],
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          // 0이면 빈 문자열 — 최적화 시나리오에서 "0t"가 찍히지 않게 한다.
          formatter: (p: { value: number }) => (p.value > 0 ? `${p.value}t` : ''),
        },
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#fca5a5' },
              { offset: 1, color: '#dc2626' },
            ],
          },
        },
      },
    ],
  }

  return <ReactECharts option={option} notMerge style={{ height: 256 }} />
}

export default AnchorCarbonChart
