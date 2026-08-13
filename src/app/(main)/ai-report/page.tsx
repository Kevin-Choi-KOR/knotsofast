'use client'

import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/Spinner'
import { Button } from '@/shared/components/Button'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { useReports } from '@/shared/hooks/useReports'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { useVessels } from '@/shared/hooks/useVessels'
import { usePositions } from '@/shared/hooks/usePositions'
import { ReportCard } from '@/features/ai-report/components/ReportCard'
import { buildReportView } from '@/features/ai-report/lib/reportView'
import { useReanalyze } from '@/features/ai-report/hooks/useReanalyze'
import type { Vessel, Voyage, EcoSpeedReport, AisPosition } from '@/shared/types'

interface ReportRow {
  report: EcoSpeedReport
  voyage: Voyage
  vessel: Vessel
  position: AisPosition | undefined
}

export default function Page() {
  const { t, lang } = useLanguage()
  const { reports, isLoading: reportsLoading, mutate: mutateReports } = useReports()
  const { voyages, isLoading: voyagesLoading } = useVoyages()
  const { vessels, isLoading: vesselsLoading } = useVessels()
  const { positions, isLoading: positionsLoading } = usePositions()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { pendingIds, errors, reanalyzeOne, reanalyzeAll } = useReanalyze(mutateReports)
  const [reanalyzingAll, setReanalyzingAll] = useState(false)

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

  const handleReanalyzeAll = async () => {
    setReanalyzingAll(true)
    try {
      await reanalyzeAll(
        rows.map(({ vessel, voyage, report, position }) => ({
          row: { vessel, voyage, report },
          view: buildReportView(vessel, voyage, report, position),
        })),
        lang,
      )
    } finally {
      setReanalyzingAll(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.aiReport.title} subtitle={t.aiReport.subtitle}>
        <Button
          variant="secondary"
          size="sm"
          disabled={reanalyzingAll || rows.length === 0}
          onClick={handleReanalyzeAll}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={reanalyzingAll ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
          {t.aiReport.reanalyzeAll}
        </Button>
      </PageHeader>
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
                onToggle={() => setExpandedId(row.report.id === effectiveExpandedId ? '' : row.report.id)}
                isReanalyzing={pendingIds.has(row.report.id)}
                reanalyzeError={errors[row.report.id]}
                onReanalyze={() =>
                  reanalyzeOne(
                    { vessel: row.vessel, voyage: row.voyage, report: row.report },
                    buildReportView(row.vessel, row.voyage, row.report, row.position),
                    lang,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
