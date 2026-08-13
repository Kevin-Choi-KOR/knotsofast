import type { User } from '@/shared/types'

export const MOCK_USERS: User[] = [
  {
    id: 'u001',
    name: '관리자',
    email: 'admin@knotsofas.kr',
    role: 'ADMIN',
    department: '시스템 관리팀',
    active: true,
  },
  {
    id: 'u002',
    name: '김물류',
    email: 'logistics1@knotsofas.kr',
    role: 'LOGISTICS',
    department: '물류기획팀',
    active: true,
  },
  {
    id: 'u003',
    name: '이담당',
    email: 'logistics2@knotsofas.kr',
    role: 'LOGISTICS',
    department: '물류기획팀',
    active: true,
  },
  {
    id: 'u004',
    name: '박선장',
    email: 'captain1@knotsofas.kr',
    role: 'CAPTAIN',
    assignedVesselIds: ['v001'],
    department: '운항팀',
    active: true,
  },
  {
    id: 'u005',
    name: '최선장',
    email: 'captain2@knotsofas.kr',
    role: 'CAPTAIN',
    assignedVesselIds: ['v002'],
    department: '운항팀',
    active: true,
  },
  {
    id: 'u006',
    name: '정선장',
    email: 'captain3@knotsofas.kr',
    role: 'CAPTAIN',
    assignedVesselIds: ['v003', 'v004'],
    department: '운항팀',
    active: false,
  },
  {
    id: 'u007',
    name: '화주A',
    email: 'client1@shipping.co.kr',
    role: 'CLIENT',
    department: '외부 화주',
    active: true,
  },
]

export const DEMO_ACCOUNTS = [
  { email: 'admin@knotsofas.kr',      password: 'Ksf@Ocean2026!', role: 'ADMIN',     name: '관리자' },
  { email: 'logistics1@knotsofas.kr', password: 'Ksf@Ocean2026!', role: 'LOGISTICS', name: '김물류' },
  { email: 'captain1@knotsofas.kr',   password: 'Ksf@Ocean2026!', role: 'CAPTAIN',   name: '박선장' },
  { email: 'client1@shipping.co.kr', password: 'Ksf@Ocean2026!', role: 'CLIENT', name: '화주A' },
] as const
