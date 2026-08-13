import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import type { Prisma } from '@/generated/prisma/client'

// updatedAt은 서버가 최종 기준이다 — createdAt은 보존하고 클라이언트가 보낸 값은 무시한다(SCHEDULE.md 5.12장).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = (await request.json()) as Prisma.VoyageUncheckedUpdateInput
  delete data.createdAt
  const updated = await prisma.voyage.update({ where: { id }, data: { ...data, updatedAt: new Date().toISOString() } })
  return NextResponse.json(updated)
}

// 연결된 EcoSpeedReport도 함께 삭제된다 (onDelete: Cascade).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.voyage.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
