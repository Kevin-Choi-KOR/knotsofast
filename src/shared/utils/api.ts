import { NextResponse } from 'next/server'

// API 라우트 핸들러의 성공/에러 응답을 { data } / { error } 형태로 통일한다.
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(code: string, status = 400) {
  return NextResponse.json({ error: code }, { status })
}

interface ApiErrorBody {
  error?: string
}

// fetcher.ts(SWR용 GET 전용)와 달리 POST/PATCH 등 쓰기 요청 후 에러 코드를 throw로 전달한다.
export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null
    throw new Error(body?.error ?? `request_failed_${res.status}`)
  }

  return res.json() as Promise<T>
}
