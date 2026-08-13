import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'

export async function GET() {
  const reports = await prisma.ecoSpeedReport.findMany()
  return NextResponse.json(reports)
}
