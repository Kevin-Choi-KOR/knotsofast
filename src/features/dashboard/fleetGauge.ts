import type { AisPosition, Vessel, Voyage } from '@/shared/types'
import { fuelEmissionFactor, interpolateFuelTonPerDay } from '@/shared/utils/format'
import { getFleetType } from '@/shared/utils/fleet'

export interface FleetGaugeRow {
  voyage: Voyage
  vessel: Vessel
  position: AisPosition
  fuelTonPerDay: number
  fuelCapacityPercent: number
  co2TonPerDay: number
  fuelSavingPercent: number
  co2FleetPercent: number
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

// DASHBOARD.md 6.1장 — 대상은 own+partner(타사선만 제외), 선박·AIS 위치가 없는 행은 생략한다.
export function computeFleetGaugeRows(vessels: Vessel[], voyages: Voyage[], positions: AisPosition[]): FleetGaugeRow[] {
  const rows = voyages.flatMap((voyage) => {
    if (voyage.status !== 'underway' && voyage.status !== 'delayed') return []

    const vessel = vessels.find((v) => v.id === voyage.vesselId)
    if (!vessel || getFleetType(vessel) === 'other') return []

    const position = positions.find((p) => p.vesselId === voyage.vesselId)
    if (!position) return []

    const fuelRates = vessel.fuelCurve.map((f) => f.fuelTonPerDay)
    const maxFuel = fuelRates.length > 0 ? Math.max(...fuelRates) : 0
    const currentFuel = interpolateFuelTonPerDay(vessel.fuelCurve, position.speedKnots)
    const plannedFuel = interpolateFuelTonPerDay(vessel.fuelCurve, voyage.plannedSpeedKnots)
    const emissionFactor = fuelEmissionFactor(voyage.fuelType)

    const row: FleetGaugeRow = {
      voyage,
      vessel,
      position,
      fuelTonPerDay: currentFuel,
      fuelCapacityPercent: maxFuel > 0 ? Math.min(100, (currentFuel / maxFuel) * 100) : 0,
      co2TonPerDay: currentFuel * emissionFactor,
      fuelSavingPercent: plannedFuel > 0 ? clamp(((plannedFuel - currentFuel) / plannedFuel) * 100, 0, 100) : 0,
      co2FleetPercent: 0,
    }
    return [row]
  })

  const maxCo2 = Math.max(...rows.map((r) => r.co2TonPerDay), 1)
  return rows.map((row) => ({ ...row, co2FleetPercent: Math.min(100, (row.co2TonPerDay / maxCo2) * 100) }))
}
