import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import type { Prisma } from '@/generated/prisma/client'

export async function GET() {
  const voyages = await prisma.voyage.findMany()
  return NextResponse.json(voyages)
}

export async function POST(request: Request) {
  const voyage = (await request.json()) as Prisma.VoyageUncheckedCreateInput
  const created = await prisma.voyage.create({ data: voyage })
  return NextResponse.json(created, { status: 201 })
}
