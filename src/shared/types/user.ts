export type UserRole = 'ADMIN' | 'LOGISTICS' | 'CAPTAIN' | 'CLIENT'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  assignedVesselIds?: string[]
  department?: string
  active: boolean
}
