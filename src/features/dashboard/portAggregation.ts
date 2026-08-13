import type { Vessel, Voyage } from '@/shared/types'
import { getPortCode } from '@/mocks/ports'

export interface PortVesselEntry {
  vessel: Vessel
  voyage: Voyage
}

export interface PortAggregate {
  berthed: PortVesselEntry[]
  departing: PortVesselEntry[]
  arriving: PortVesselEntry[]
}

function emptyAggregate(): PortAggregate {
  return { berthed: [], departing: [], arriving: [] }
}

// DASHBOARD.md 9.6장 — 선박 필터·선택과 무관하게 항상 전체 항차를 기준으로 집계한다.
export function aggregateByPort(voyages: Voyage[], vessels: Vessel[]): Map<string, PortAggregate> {
  const result = new Map<string, PortAggregate>()

  const get = (code: string): PortAggregate => {
    let agg = result.get(code)
    if (!agg) {
      agg = emptyAggregate()
      result.set(code, agg)
    }
    return agg
  }

  for (const voyage of voyages) {
    if (voyage.status === 'cancelled') continue
    const vessel = vessels.find((v) => v.id === voyage.vesselId)
    if (!vessel) continue

    const entry: PortVesselEntry = { vessel, voyage }
    const depCode = getPortCode(voyage.departurePort)
    const arrCode = getPortCode(voyage.arrivalPort)

    if (depCode) {
      if (voyage.status === 'preparing') get(depCode).berthed.push(entry)
      else if (voyage.status === 'underway' || voyage.status === 'delayed') get(depCode).departing.push(entry)
    }

    if (arrCode) {
      if (voyage.status === 'completed') get(arrCode).berthed.push(entry)
      else if (voyage.status === 'underway' || voyage.status === 'delayed') get(arrCode).arriving.push(entry)
    }
  }

  return result
}
