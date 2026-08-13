import { GoogleGenAI } from '@google/genai'

/**
 * Gemini 클라이언트 초기화 — Vertex AI(GOOGLE_GENAI_USE_VERTEXAI=true, 프로덕션)와
 * API 키(로컬 개발) 두 경로를 지원한다. AI 운항 리포트 재분석과 물류 일정 관리의
 * PDF 자동 등록 라우트가 공유한다(docs/specs/AI_PROMPTS.md 5장 공통 설계 원칙).
 * 설정이 없으면 null을 반환하고, 호출부는 이를 no_api_key로 우아하게 처리한다.
 */
export function buildGeminiClient(): GoogleGenAI | null {
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true'
  if (useVertex) {
    const project = process.env.GOOGLE_CLOUD_PROJECT
    if (!project) return null
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    return new GoogleGenAI({ vertexai: true, project, location })
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({ apiKey })
}

/**
 * Gemini 응답 줄바꿈 정규화 2단계: ① 리터럴 백슬래시+n을 실제 개행으로 치환
 * ② 그래도 개행이 없으면 문장 종결부호 뒤에 강제 삽입. AI 운항 리포트 재분석과
 * 물류 시뮬레이션 AI 추천 근거 설명이 공유한다.
 */
export function normalizeLineBreaks(text: string): string {
  let normalized = text.replace(/\\n/g, '\n')
  if (!normalized.includes('\n')) {
    normalized = normalized.replace(/([.!?])\s+(?=\S)/g, '$1\n')
  }
  return normalized
}
