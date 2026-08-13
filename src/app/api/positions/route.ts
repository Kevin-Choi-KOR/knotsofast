import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'

export async function GET() {
  const positions = await prisma.aisPosition.findMany()
  return NextResponse.json(positions)
}
