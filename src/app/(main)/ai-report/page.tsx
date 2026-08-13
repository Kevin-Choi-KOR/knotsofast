'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/Spinner'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { useReports } from '@/shared/hooks/useReports'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { useVessels } from '@/shared/hooks/useVessels'
import { usePositions } from '@/shared/hooks/usePositions'
import { ReportCard } from '@/features/ai-report/components/ReportCard'
import type { Vessel, Voyage, EcoSpeedReport, AisPosition } from '@/shared/types'

interface ReportRow {
  report: EcoSpeedReport
  voyage: Voyage
  vessel: Vessel
  position: AisPosition | undefined
}

export default function Page() {
  const { t } = useLanguage()
  const { reports, isLoading: reportsLoading } = useReports()
  const { voyages, isLoading: voyagesLoading } = useVoyages()
  const { vessels, isLoading: vesselsLoading } = useVessels()
  const { positions, isLoading: positionsLoading } = usePositions()

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isLoading = reportsLoading || voyagesLoading || vesselsLoading || positionsLoading

  const rows = useMemo<ReportRow[]>(() => {
    return reports
      .map((report) => {
        const voyage = voyages.find((v) => v.id === report.voyageId)
        const vessel = voyage ? vessels.find((v) => v.id === voyage.vesselId) : undefined
        if (!voyage || !vessel) return null
        const position = positions.find((p) => p.vesselId === vessel.id)
        return { report, voyage, vessel, position }
      })
      .filter((row): row is ReportRow => row !== null)
      // API가 정렬 없이 조회하므로(findMany), 재검증마다 행 순서가 바뀌지 않도록 여기서 고정 정렬한다.
      .sort((a, b) => a.report.id.localeCompare(b.report.id))
  }, [reports, voyages, vessels, positions])

  const effectiveExpandedId = expandedId ?? rows[0]?.report.id ?? null

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.aiReport.title} subtitle={t.aiReport.subtitle} />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <ReportCard
                key={row.report.id}
                vessel={row.vessel}
                voyage={row.voyage}
                report={row.report}
                position={row.position}
                expanded={row.report.id === effectiveExpandedId}
                onToggle={() =>
                  setExpandedId(row.report.id === effectiveExpandedId ? '' : row.report.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
