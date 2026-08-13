export type VesselType = 'container' | 'bulk' | 'tanker' | 'roro'
export type VesselStatus = 'active' | 'maintenance' | 'idle'

export interface FuelPoint {
  speedKnots: number
  fuelTonPerDay: number
}

export interface Vessel {
  id: string
  name: string
  imo: string
  type: VesselType
  flag: string
  company: string
  grossTonnage: number
  lengthOverall: number
  beam: number
  maxDraft: number
  currentDraft: number
  enginePower: number
  fuelCurve: FuelPoint[]
  designSpeedKnots: number
  designSpeedFuelTon: number
  foulingFactor: number
  status: VesselStatus
  buildYear: number
}
