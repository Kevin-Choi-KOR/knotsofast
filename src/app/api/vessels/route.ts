import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import type { Prisma } from '@/generated/prisma/client'

export async function GET() {
  const vessels = await prisma.vessel.findMany()
  return NextResponse.json(vessels)
}

export async function POST(request: Request) {
  const vessel = (await request.json()) as Prisma.VesselUncheckedCreateInput
  const created = await prisma.vessel.create({ data: vessel })
  return NextResponse.json(created, { status: 201 })
}
