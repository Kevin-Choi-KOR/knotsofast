import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Cloud SQL의 서버 인증서는 Google 관리 CA로 서명되어 있어 Node 기본 신뢰 저장소에 없다.
// 인스턴스가 SSL_MODE=ENCRYPTED_ONLY이므로 체인 검증만 건너뛰고 암호화는 그대로 적용한다.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
