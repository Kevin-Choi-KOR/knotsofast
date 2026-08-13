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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = (await request.json()) as UserRequestBody

  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email)) {
      return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
    }
    const existing = await prisma.user.findFirst({
      where: { email: { equals: body.email, mode: 'insensitive' }, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 })
    }
  }

  if (body.role !== undefined && (typeof body.role !== 'string' || !ROLES.includes(body.role))) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  // 비밀번호를 비워두면 필드를 아예 보내지 않아 기존 값을 유지한다.
  const { password, ...rest } = body
  const data = { ...rest } as Prisma.UserUncheckedUpdateInput

  if (typeof password === 'string' && password.length > 0) {
    if (password.length < 8) {
      return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
    }
    data.passwordHash = hashPassword(password)
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data, omit: { passwordHash: true } })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
