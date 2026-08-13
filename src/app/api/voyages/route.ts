import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import type { Prisma } from '@/generated/prisma/client'

export async function GET() {
  const voyages = await prisma.voyage.findMany()
  return NextResponse.json(voyages)
}

// createdAt/updatedAt은 서버가 최종 기준이다 — 클라이언트가 보낸 값은 무시한다(docs/specs/SCHEDULE.md 5.12장).
export async function POST(request: Request) {
  const voyage = (await request.json()) as Prisma.VoyageUncheckedCreateInput
  const now = new Date().toISOString()
  const created = await prisma.voyage.create({ data: { ...voyage, createdAt: now, updatedAt: now } })
  return NextResponse.json(created, { status: 201 })
}
