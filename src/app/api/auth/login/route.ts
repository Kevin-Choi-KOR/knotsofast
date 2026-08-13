import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db'
import { verifyPassword } from '@/shared/utils/password'

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (
    typeof body.email !== 'string' ||
    typeof body.password !== 'string' ||
    !body.email ||
    !body.password
  ) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: body.email, mode: 'insensitive' } },
  })

  // 이메일 미존재 / 비밀번호 불일치 / 비활성 계정을 모두 같은 401로 취급한다 —
  // "이 이메일은 존재한다"는 정보를 응답 차이로 흘리지 않기 위한 표준 관행이다.
  if (!user || !user.active || !verifyPassword(body.password, user.passwordHash)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { id, name, email, role, assignedVesselIds, department, active } = user
  return NextResponse.json({
    ok: true,
    user: { id, name, email, role, assignedVesselIds, department, active },
  })
}
