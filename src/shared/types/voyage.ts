export type VoyageStatus = 'preparing' | 'underway' | 'delayed' | 'completed' | 'cancelled'
export type FuelType = 'HFO' | 'MGO' | 'LNG'

export interface Waypoint {
  lat: number
  lng: number
  name?: string
}

export interface Voyage {
  id: string
  vesselId: string
  cargoDescription: string
  departurePort: string
  arrivalPort: string
  etd: string
  sta: string
  rta: string
  rtaConfirmed: boolean
  eta: string
  status: VoyageStatus
  plannedRoute: Waypoint[]
  actualRoute: Waypoint[]
  plannedSpeedKnots: number
  recommendedSpeedKnots: number
  fuelType: FuelType
  cargoTon: number
  distanceNm: number
  createdAt?: string
  updatedAt?: string
}
