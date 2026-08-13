'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/features/theme/ThemeContext'
import type { FuelPoint } from '@/shared/types'

// App Router에서 정적 import하면 서버 렌더링 단계에서 window 참조로 깨진다.
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const THEME_COLORS = {
  light: { axis: '#e2e8f0', label: '#64748b', tooltipBg: '#ffffff', tooltipBorder: '#e2e8f0', tooltipText: '#334155', areaTop: 'rgba(99,102,241,0.15)' },
  dark: { axis: '#334155', label: '#94a3b8', tooltipBg: '#1e293b', tooltipBorder: '#334155', tooltipText: '#e2e8f0', areaTop: 'rgba(99,102,241,0.35)' },
}

export function FuelCurveChart({ fuelCurve, foulingFactor }: { fuelCurve: FuelPoint[]; foulingFactor: number }) {
  const { theme } = useTheme()
  const c = THEME_COLORS[theme]

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    grid: { top: 12, right: 12, bottom: 28, left: 12, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
      formatter: (params: { name: string; value: number }[]) =>
        `${params[0].name} kts<br/><b>${params[0].value} ton/day</b>`,
    },
    xAxis: {
      type: 'category',
      data: fuelCurve.map((p) => p.speedKnots),
      axisLabel: { fontSize: 10, formatter: (v: string) => `${v}kts`, color: c.label },
      axisLine: { lineStyle: { color: c.axis } },
      axisTick: { show: false },
      name: '속도',
      nameLocation: 'middle',
      nameGap: 22,
      nameTextStyle: { fontSize: 10, color: c.label },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: c.axis } },
      axisLabel: { fontSize: 10, formatter: (v: number) => `${v}t`, color: c.label },
    },
    series: [
      {
        type: 'line',
        data: fuelCurve.map((p) => p.fuelTonPerDay),
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#6366f1', width: 2.5 },
        itemStyle: { color: '#6366f1', borderColor: theme === 'dark' ? '#1e293b' : '#fff', borderWidth: 2 },
        label: { show: true, position: 'top', fontSize: 10 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: c.areaTop },
              { offset: 1, color: 'rgba(99,102,241,0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.5 },
          data: [
            {
              type: 'average',
              label: {
                formatter: `×${foulingFactor.toFixed(2)}`,
                color: '#f59e0b',
                fontSize: 10,
                position: 'insideEndTop',
              },
            },
          ],
        },
      },
    ],
  }

  return (
    <div className="mb-3 h-44">
      <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
