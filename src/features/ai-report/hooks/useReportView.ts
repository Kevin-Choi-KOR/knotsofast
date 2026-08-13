'use client'

import { useMemo } from 'react'
import type { Vessel, Voyage, EcoSpeedReport, AisPosition } from '@/shared/types'
import { buildReportView } from '../lib/reportView'
import { useReportWeather } from './useReportWeather'

/**
 * 리포트 카드 하나를 펼쳤을 때 필요한 모든 파생 데이터를 한 곳에서 계산한다(계산 자체는
 * buildReportView, 기상만 이 훅에서 추가로 조회).
 */
export function useReportView(
  vessel: Vessel,
  voyage: Voyage,
  report: EcoSpeedReport,
  position: AisPosition | undefined,
) {
  const view = useMemo(
    () => buildReportView(vessel, voyage, report, position),
    [vessel, voyage, report, position],
  )

  // aiAnalyzedAt이 바뀌면(=재분석 성공으로 DB가 갱신되면) 좌표가 그대로여도 기상을 강제로 다시 조회한다.
  const weather = useReportWeather(view.currentPos, view.arrivalPos, report.aiAnalyzedAt ?? report.generatedAt)

  return {
    ...view,
    weather,
  }
}

export type ReportView = ReturnType<typeof useReportView>
