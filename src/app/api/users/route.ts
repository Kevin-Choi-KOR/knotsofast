import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import { hashPassword } from '@/shared/utils/password'
import type { Prisma } from '@/generated/prisma/client'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES = ['ADMIN', 'LOGISTICS', 'CAPTAIN', 'CLIENT']

interface UserRequestBody {
  [key: string]: unknown
  email?: unknown
  role?: unknown
  password?: unknown
}

export async function GET() {
  const users = await prisma.user.findMany({ omit: { passwordHash: true } })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const body = (await request.json()) as UserRequestBody

  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }
  if (typeof body.role !== 'string' || !ROLES.includes(body.role)) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }
  if (typeof body.password !== 'string' || body.password.length < 8) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  // DB unique 제약은 대소문자를 구분하므로, 같은 사람이 두 계정을 만드는 것을 막으려면
  // 대소문자 무관 조회를 한 번 더 해야 한다. unique 제약은 경합 상황의 최후 방어선으로 남긴다.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: body.email, mode: 'insensitive' } },
  })
  if (existing) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 })
  }

  const { password, ...rest } = body
  const data = {
    ...rest,
    passwordHash: hashPassword(password),
  } as Prisma.UserUncheckedCreateInput

  try {
    const created = await prisma.user.create({ data, omit: { passwordHash: true } })
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 })
  }
}
