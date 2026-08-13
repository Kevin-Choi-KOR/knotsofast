import { Shield, Users, Anchor, UserCheck } from 'lucide-react'
import type { UserRole } from '@/shared/types'

export const ROLE_ORDER: UserRole[] = ['ADMIN', 'LOGISTICS', 'CAPTAIN', 'CLIENT']

export const ROLE_ICON: Record<UserRole, typeof Shield> = {
  ADMIN: Shield,
  LOGISTICS: Users,
  CAPTAIN: Anchor,
  CLIENT: UserCheck,
}

export const ROLE_COLOR_CLASS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  LOGISTICS: 'bg-[#6366f1]/15 text-[#6366f1] dark:bg-[#6366f1]/20 dark:text-[#6366f1]',
  CAPTAIN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CLIENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}
