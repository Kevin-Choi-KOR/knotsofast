'use client'

import { useState } from 'react'
import type { Vessel, Voyage, EcoSpeedReport } from '@/shared/types'
import { computeSpeedPlan } from '../lib/calculations'
import type { ReportViewBase } from '../lib/reportView'
import type { AiReanalyzeFailureReason, AiReanalyzeRequest, AiReanalyzeResponse } from '../lib/reanalyzeTypes'

type ReanalyzeViewInput = ReportViewBase

interface ReanalyzeRow {
  vessel: Vessel
  voyage: Voyage
  report: EcoSpeedReport
}

/**
 * 카드별 재분석 상태(로딩·에러)를 페이지 레벨에서 소유한다 — "전체 재분석"과 개별 재분석
 * 버튼이 같은 상태를 공유해야 두 경로 모두에서 카드에 "분석 중" 배너가 뜬다(7.1장).
 */
export function useReanalyze(mutateReports: () => Promise<unknown> | unknown) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, AiReanalyzeFailureReason>>({})

  async function reanalyzeOne(row: ReanalyzeRow, view: ReanalyzeViewInput, lang: 'ko' | 'en') {
    const { vessel, voyage, report } = row
    setPendingIds((prev) => new Set(prev).add(report.id))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[report.id]
      return next
    })

    try {
      const payload: AiReanalyzeRequest = {
        lang,
        vessel: { name: vessel.name, type: vessel.type, imo: vessel.imo },
        route: {
          departurePort: voyage.departurePort,
          arrivalPort: voyage.arrivalPort,
          cargoDescription: voyage.cargoDescription,
        },
        deadlineTerm: view.deadline.term,
        deadlineAt: view.deadline.deadlineIso,
        nowIso: report.generatedAt,
        baselineEtaAt: report.etaIfRecommended,
        progress: {
          totalNm: voyage.distanceNm,
          traveledNm: view.progress.traveledNm,
          remainingNm: view.progress.remainingNm,
          progressPercent: view.progress.percent,
        },
        currentPos: view.currentPos,
        arrivalPos: view.arrivalPos,
        currentSpeedKnots: view.currentSpeedKnots,
        currentSpeedProbabilityPercent: 0,
        marginHoursAtCurrentSpeed: 0,
        planSpeedKnots: report.currentPlanSpeed,
        baselineRecommendedSpeedKnots: report.recommendedSpeed,
        speedRangeKnots: view.speedRange,
        fuelCurve: vessel.fuelCurve,
        congestion: {
          level: view.congestionTier,
          score: view.congestion.congestionScore,
          avgWaitHours: view.congestion.avgWaitHours,
          berthsAvailable: view.congestion.berthsAvailable,
          berthsTotal: view.congestion.berthsTotal,
          trend: view.congestion.trend,
        },
        nearbyIssues: view.issues.map((issue) => ({
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
        })),
      }

      const speedPlanForPayload = computeSpeedPlan({
        vessel,
        voyage,
        report,
        remainingNm: view.progress.remainingNm,
        currentSpeedKnots: view.currentSpeedKnots,
        nowIso: report.generatedAt,
        deadlineIso: view.deadline.deadlineIso,
        congestionWaitHours: view.congestion.avgWaitHours,
      })
      payload.currentSpeedProbabilityPercent = speedPlanForPayload.currentSpeedProbability.percent
      payload.marginHoursAtCurrentSpeed = speedPlanForPayload.currentSpeedProbability.marginHours

      const res = await fetch('/api/ai-report/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data: AiReanalyzeResponse = await res.json()

      if (!data.ok) {
        setErrors((prev) => ({ ...prev, [report.id]: data.reason }))
        return
      }

      const finalPlan = computeSpeedPlan({
        vessel,
        voyage,
        report,
        remainingNm: view.progress.remainingNm,
        currentSpeedKnots: view.currentSpeedKnots,
        nowIso: report.generatedAt,
        deadlineIso: view.deadline.deadlineIso,
        congestionWaitHours: view.congestion.avgWaitHours,
        aiRecommendedSpeedKnots: data.recommendedSpeedKnots,
      })

      await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendedSpeed: data.recommendedSpeedKnots,
          etaIfRecommended: finalPlan.etaAtRecommended,
          fuelSavingPercent: finalPlan.fuelSavingPercent,
          co2SavedTon: finalPlan.co2SavedTon,
          canMeetRta: finalPlan.recommendedSpeedProbability.percent === 100,
          reasoning: data.reasoning,
          risks: data.risks,
          aiAnalyzedAt: new Date().toISOString(),
        }),
      })
      await mutateReports()
    } catch {
      setErrors((prev) => ({ ...prev, [report.id]: 'upstream_error' }))
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(report.id)
        return next
      })
    }
  }

  async function reanalyzeAll(rows: { row: ReanalyzeRow; view: ReanalyzeViewInput }[], lang: 'ko' | 'en') {
    await Promise.all(rows.map(({ row, view }) => reanalyzeOne(row, view, lang)))
  }

  return { pendingIds, errors, reanalyzeOne, reanalyzeAll }
}
