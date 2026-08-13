/**
 * Gemini 응답 줄바꿈 정규화 2단계(docs/specs/AI_REPORT.md 7.4장 ④):
 * ① 리터럴 백슬래시+n을 실제 개행으로 치환 ② 그래도 개행이 없으면 문장 종결부호 뒤에 강제 삽입.
 */
export function normalizeLineBreaks(text: string): string {
  let normalized = text.replace(/\\n/g, '\n')
  if (!normalized.includes('\n')) {
    normalized = normalized.replace(/([.!?])\s+(?=\S)/g, '$1\n')
  }
  return normalized
}
