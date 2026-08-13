'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/features/theme/ThemeContext'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { chartAxisColors } from './chartTheme'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface TooltipParam {
  name: string
  value: number
}

export function CiiTrendChart({ months, scores }: { months: string[]; scores: number[] }) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const dark = theme === 'dark'
  const c = chartAxisColors(dark)

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
      formatter: (params: TooltipParam[]) => {
        const p = params[0]
        return `${p.name}<br/>CII: <b>${p.value.toFixed(2)}</b>`
      },
    },
    xAxis: {
      type: 'category',
      // '2026-02' → '02'
      data: months.map((m) => m.slice(5)),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: c.axisLine } },
      axisLabel: { fontSize: 11, color: c.axisLabel },
    },
    // scale: true — 0부터 그리면 7개월간 18% 개선폭이 거의 평평하게 보인다.
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { type: 'dashed', color: c.axisLine } },
      axisLabel: { fontSize: 11, color: c.axisLabel, formatter: (v: number) => v.toFixed(1) },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: scores,
        lineStyle: { color: '#6366f1', width: 3 },
        itemStyle: { color: '#6366f1', borderColor: dark ? '#1e293b' : '#fff', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `rgba(99,102,241,${dark ? 0.35 : 0.18})` },
              { offset: 1, color: 'rgba(99,102,241,0)' },
            ],
          },
        },
      },
    ],
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 text-sm font-semibold">{t.carbon.trendTitle}</div>
      <ReactECharts option={option} notMerge style={{ height: 160 }} />
    </div>
  )
}

export default CiiTrendChart
