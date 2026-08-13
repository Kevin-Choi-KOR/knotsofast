import { OWN_COMPANY_NAME } from '@/shared/constants'
import { MOCK_FLEET_ECO_RANKING } from '@/mocks/carbon'
import { computeScope3Savings, computeVoyageEmissions } from '@/shared/utils/carbon'
import type { Vessel, Voyage } from '@/shared/types'

export interface EcoRankingEntry {
  vesselId: string
  vesselName: string
  savedPct: number
}

// CARBON.md 5.4장과 동일한 규칙: 운항 중·지연 항차 우선, 없으면 첫 항차.
// 탄소 배출 화면의 에코 랭킹 딥링크(10.3장)도 같은 규칙으로 대표 항차를 골라야
// 대시보드에서 보이는 절감률과 탄소 배출 화면에서 열리는 항차가 일치한다.
export function pickRepresentativeVoyage(vesselId: string, voyages: Voyage[]): Voyage | undefined {
  const vesselVoyages = voyages.filter((v) => v.vesselId === vesselId)
  return vesselVoyages.find((v) => v.status === 'underway' || v.status === 'delayed') ?? vesselVoyages[0]
}

// 탄소 배출 화면과 computeScope3Savings()를 공유해 두 화면의 랭킹·절감률이 어긋나지 않게 한다.
export function computeEcoRanking(vessels: Vessel[], voyages: Voyage[]): EcoRankingEntry[] {
  const ownVessels = vessels.filter((v) => v.company === OWN_COMPANY_NAME)

  const entries = ownVessels.map((vessel) => {
    const voyage = pickRepresentativeVoyage(vessel.id, voyages)
    if (!voyage) {
      const mock = MOCK_FLEET_ECO_RANKING.find((m) => m.vesselId === vessel.id)
      return { vesselId: vessel.id, vesselName: vessel.name, savedPct: mock?.co2SavedPct ?? 0 }
    }

    const { totalCo2Ton } = computeVoyageEmissions(vessel.fuelCurve, voyage.recommendedSpeedKnots, voyage.distanceNm, voyage.fuelType)
    const { savedPct } = computeScope3Savings(voyage, vessel, vessels, totalCo2Ton)
    return { vesselId: vessel.id, vesselName: vessel.name, savedPct }
  })

  return entries.sort((a, b) => b.savedPct - a.savedPct)
}
