'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/Spinner'
import { Button } from '@/shared/components/Button'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { useVessels } from '@/shared/hooks/useVessels'
import { usePositions } from '@/shared/hooks/usePositions'
import type { Voyage, VoyageStatus } from '@/shared/types'
import type { FleetType } from '@/shared/utils/fleet'
import { SCHEDULE_CALENDAR_DATE_STORAGE_KEY } from '@/shared/constants'
import { FilterBar, type ViewTab } from '@/features/schedule/components/FilterBar'
import { VoyageTable } from '@/features/schedule/components/VoyageTable'
import { ScheduleCalendar } from '@/features/schedule/components/ScheduleCalendar'
import { VoyageModal } from '@/features/schedule/components/VoyageModal'
import { applyFleetDateFilter, applyStatusSearchFilter, sortVoyages, type DateBasis } from '@/features/schedule/lib/schedule'

type ModalState = { mode: 'create' } | { mode: 'view'; voyage: Voyage }

export default function Page() {
  const { t } = useLanguage()
  const { voyages, isLoading: voyagesLoading, mutate: mutateVoyages } = useVoyages()
  const { vessels, isLoading: vesselsLoading } = useVessels()
  const { positions, isLoading: positionsLoading } = usePositions()

  const [viewTab, setViewTab] = useState<ViewTab>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VoyageStatus | 'all'>('all')
  const [fleetTypes, setFleetTypes] = useState<ReadonlySet<FleetType>>(() => new Set<FleetType>(['own']))
  const [dateBasis, setDateBasis] = useState<DateBasis>('eta')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [calendarFocusDate, setCalendarFocusDate] = useState<Date | null>(null)

  // 대시보드 "이번 주 일정" 카드 → 캘린더 딥링크(선택, 8장). 1회성 sessionStorage 키.
  useEffect(() => {
    const dateStr = sessionStorage.getItem(SCHEDULE_CALENDAR_DATE_STORAGE_KEY)
    if (!dateStr) return
    sessionStorage.removeItem(SCHEDULE_CALENDAR_DATE_STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCalendarFocusDate(new Date(dateStr))
    setViewTab('calendar')
  }, [])

  const isLoading = voyagesLoading || vesselsLoading || positionsLoading

  const dateFleetFiltered = useMemo(
    () => applyFleetDateFilter(voyages, vessels, { fleetTypes, dateBasis, dateFrom, dateTo }),
    [voyages, vessels, fleetTypes, dateBasis, dateFrom, dateTo],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<VoyageStatus | 'all', number> = {
      all: dateFleetFiltered.length,
      preparing: 0,
      underway: 0,
      delayed: 0,
      completed: 0,
      cancelled: 0,
    }
    for (const v of dateFleetFiltered) counts[v.status] += 1
    return counts
  }, [dateFleetFiltered])

  const visibleVoyages = useMemo(() => {
    const filtered = applyStatusSearchFilter(dateFleetFiltered, vessels, statusFilter, search)
    return sortVoyages(filtered)
  }, [dateFleetFiltered, vessels, statusFilter, search])

  function toggleFleetType(type: FleetType) {
    setFleetTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.schedule.title} subtitle={t.schedule.subtitle}>
        <Button size="sm" className="flex items-center gap-1.5" onClick={() => setModalState({ mode: 'create' })}>
          <Plus className="h-4 w-4" />
          {t.schedule.addVoyage}
        </Button>
      </PageHeader>

      <FilterBar
        viewTab={viewTab}
        onViewTabChange={setViewTab}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={statusCounts}
        fleetTypes={fleetTypes}
        onToggleFleetType={toggleFleetType}
        dateBasis={dateBasis}
        onDateBasisChange={setDateBasis}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <LoadingState />
        ) : viewTab === 'list' ? (
          <VoyageTable
            voyages={visibleVoyages}
            vessels={vessels}
            positions={positions}
            onRowClick={(voyage) => setModalState({ mode: 'view', voyage })}
          />
        ) : (
          <ScheduleCalendar
            voyages={visibleVoyages}
            vessels={vessels}
            onEventClick={(voyage) => setModalState({ mode: 'view', voyage })}
            focusDate={calendarFocusDate}
          />
        )}
      </div>

      {modalState && (
        <VoyageModal
          mode={modalState.mode}
          voyage={modalState.mode === 'view' ? modalState.voyage : null}
          vessels={vessels}
          onClose={() => setModalState(null)}
          mutateVoyages={mutateVoyages}
        />
      )}
    </div>
  )
}
