import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import type { Prisma } from '@/generated/prisma/client'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = (await request.json()) as Prisma.EcoSpeedReportUncheckedUpdateInput
  const updated = await prisma.ecoSpeedReport.update({ where: { id }, data })
  return NextResponse.json(updated)
}
