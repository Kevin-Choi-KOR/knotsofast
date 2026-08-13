import { OWN_COMPANY_NAME } from '@/shared/constants'
import { OTHER_COMPANIES } from '@/mocks/otherFleet'
import type { Vessel } from '@/shared/types'

export type FleetType = 'own' | 'partner' | 'other'

function isAlliancePartnerCompany(company: string): boolean {
  return OTHER_COMPANIES.some((c) => c.name === company && c.partner)
}

export function getFleetType(vessel?: Vessel): FleetType {
  if (!vessel) return 'other'
  if (vessel.company === OWN_COMPANY_NAME) return 'own'
  return isAlliancePartnerCompany(vessel.company) ? 'partner' : 'other'
}
