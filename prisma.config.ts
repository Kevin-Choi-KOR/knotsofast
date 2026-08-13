import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

// import "dotenv/config"(기본값)는 `.env`만 읽는다 — 경로를 명시해야 `.env.local`이 잡힌다.
dotenv.config({ path: '.env.local' })

export default defineConfig({
  schema: 'prisma/schema',
  datasource: { url: process.env['DATABASE_URL'] },
})
