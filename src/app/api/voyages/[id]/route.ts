import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import type { Prisma } from '@/generated/prisma/client'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = (await request.json()) as Prisma.VoyageUncheckedUpdateInput
  const updated = await prisma.voyage.update({ where: { id }, data })
  return NextResponse.json(updated)
}

// 연결된 EcoSpeedReport도 함께 삭제된다 (onDelete: Cascade).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.voyage.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
