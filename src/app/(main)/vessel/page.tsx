'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { useVessels } from '@/shared/hooks/useVessels'
import { useVoyages } from '@/shared/hooks/useVoyages'
import { getFleetType, type FleetType } from '@/shared/utils/fleet'
import { findActiveVoyage } from '@/shared/utils/vessel'
import { VesselFilterBar } from './_components/VesselFilterBar'
import { VesselCard } from './_components/VesselCard'
import { VesselDetailPanel } from './_components/VesselDetailPanel'
import { VesselModal } from './_components/VesselModal'
import type { Vessel, VesselType } from '@/shared/types'

interface ModalState {
  open: boolean
  mode: 'create' | 'view'
}

export default function Page() {
  const { t } = useLanguage()
  const { vessels, mutate: mutateVessels } = useVessels()
  const { voyages } = useVoyages()

  const [search, setSearch] = useState('')
  const [fleetFilter, setFleetFilter] = useState<Set<FleetType>>(new Set(['own']))
  const [typeFilter, setTypeFilter] = useState<VesselType | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' })

  const fleetFiltered = useMemo(
    () => vessels.filter((v) => fleetFilter.has(getFleetType(v))),
    [vessels, fleetFilter],
  )

  const typeCounts = useMemo(() => {
    const counts: Record<VesselType | 'all', number> = {
      all: fleetFiltered.length,
      container: 0,
      bulk: 0,
      tanker: 0,
      roro: 0,
    }
    for (const v of fleetFiltered) counts[v.type]++
    return counts
  }, [fleetFiltered])

  const filtered = useMemo(() => {
    return fleetFiltered.filter((v) => {
      const matchesType = typeFilter === 'all' || v.type === typeFilter
      const matchesSearch = search === '' || v.name.includes(search) || v.imo.includes(search)
      return matchesType && matchesSearch
    })
  }, [fleetFiltered, typeFilter, search])

  const selectedVessel = vessels.find((v) => v.id === selectedId) ?? null
  const selectedActiveVoyage = selectedVessel ? findActiveVoyage(voyages, selectedVessel.id) : undefined

  function toggleFleet(value: FleetType) {
    setFleetFilter((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function toggleCard(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  async function handleModalSubmit(vessel: Vessel) {
    if (modal.mode === 'create') {
      await fetch('/api/vessels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vessel),
      })
      await mutateVessels()
      setModal({ open: false, mode: 'create' })
    } else {
      await fetch(`/api/vessels/${vessel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vessel),
      })
      await mutateVessels()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.vessel.title} subtitle={t.vessel.subtitle}>
        <button
          type="button"
          onClick={() => setModal({ open: true, mode: 'create' })}
          className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4f46e5]"
        >
          <Plus className="h-4 w-4" />
          {t.vessel.addVessel}
        </button>
      </PageHeader>

      <VesselFilterBar
        search={search}
        onSearchChange={setSearch}
        fleetFilter={fleetFilter}
        onToggleFleet={toggleFleet}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        typeCounts={typeCounts}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((v) => (
              <VesselCard
                key={v.id}
                vessel={v}
                selected={v.id === selectedId}
                activeVoyage={findActiveVoyage(voyages, v.id)}
                onClick={() => toggleCard(v.id)}
              />
            ))}
          </div>
        </div>

        {selectedVessel && (
          <VesselDetailPanel
            vessel={selectedVessel}
            activeVoyage={selectedActiveVoyage}
            onEdit={() => setModal({ open: true, mode: 'view' })}
          />
        )}
      </div>

      {modal.open && (
        <VesselModal
          mode={modal.mode}
          vessel={modal.mode === 'view' ? selectedVessel : null}
          hasActiveVoyage={!!selectedActiveVoyage}
          onClose={() => setModal({ open: false, mode: modal.mode })}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  )
}
