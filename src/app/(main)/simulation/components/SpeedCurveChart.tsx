'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/features/theme/ThemeContext'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { SPEED_RANGE } from '@/mocks/simulation'
import { calcFuel } from '@/shared/utils/simulation'

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

interface SpeedCurveChartProps {
  routeDistance: number
  baseFuelPerDay: number
  draftFactor: number
  plannedSpeedKnots: number
  simSpeedKnots: number
}

export function SpeedCurveChart({
  routeDistance,
  baseFuelPerDay,
  draftFactor,
  plannedSpeedKnots,
  simSpeedKnots,
}: SpeedCurveChartProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const dark = theme === 'dark'
  const c = chartAxisColors(dark)

  const fuelAt = (speed: number) => Math.round(calcFuel(routeDistance, speed, baseFuelPerDay, draftFactor))
  const curveData = SPEED_RANGE.map((s) => [s, fuelAt(s)])

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    // top 16 → 34: markLine의 2줄 라벨("계획 속도\n15.5kts")이 잘리지 않도록 여유를 둔다.
    grid: { top: 34, right: 16, bottom: 36, left: 16, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
      formatter: (params: { value: [number, number] }[]) => {
        const [speed, fuel] = params[0].value
        return `${speed} kts<br/>연료: <b>${fuel.toLocaleString('ko-KR')} ton</b>`
      },
    },
    xAxis: {
      type: 'value',
      name: 'Speed (kts)',
      nameLocation: 'middle',
      nameGap: 26,
      min: 10,
      max: 20,
      interval: 2,
      splitLine: { show: false },
      axisLabel: { fontSize: 11, color: c.axisLabel },
      axisLine: { lineStyle: { color: c.axisLine } },
    },
    yAxis: {
      type: 'value',
      name: 'Fuel (ton)',
      nameLocation: 'middle',
      nameGap: 44,
      splitLine: { lineStyle: { type: 'dashed', color: c.axisLine } },
      axisLabel: { fontSize: 11, color: c.axisLabel },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: curveData,
        lineStyle: { color: '#6366f1', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `rgba(99,102,241,${dark ? 0.3 : 0.12})` },
              { offset: 1, color: 'rgba(99,102,241,0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { fontSize: 10, lineHeight: 13, position: 'insideEndTop', rotate: 0, align: 'left' },
          lineStyle: { type: 'dashed', width: 2 },
          data: [
            {
              xAxis: plannedSpeedKnots,
              lineStyle: { color: '#f59e0b' },
              label: {
                formatter: () => `${t.simulation.planSpeed}\n${plannedSpeedKnots}kts`,
                color: '#f59e0b',
                rotate: 0,
              },
            },
            {
              xAxis: simSpeedKnots,
              lineStyle: { color: '#10b981' },
              // 이 라벨만 다국어 사전을 거치지 않는 영문 고정 문자열이다.
              label: { formatter: () => `Sim\n${simSpeedKnots}kts`, color: '#10b981', rotate: 0 },
            },
          ],
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 10,
          label: { show: false },
          data: [
            { coord: [plannedSpeedKnots, fuelAt(plannedSpeedKnots)], itemStyle: { color: '#f59e0b' } },
            { coord: [simSpeedKnots, fuelAt(simSpeedKnots)], itemStyle: { color: '#10b981' } },
          ],
        },
      },
    ],
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{t.simulation.speedCurve}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-amber-500" />
            {t.simulation.planSpeed}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-[#10b981]" />
            {t.simulation.simResult}
          </span>
        </div>
      </div>
      <ReactECharts option={option} notMerge style={{ height: 192 }} />
    </div>
  )
}

export default SpeedCurveChart
