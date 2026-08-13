// 두 차트(CII 추이 · 대기 탄소) 공통 테마 연동 색상
export function chartAxisColors(dark: boolean) {
  return {
    axisLine: dark ? '#334155' : '#e2e8f0',
    axisLabel: dark ? '#94a3b8' : '#64748b',
    tooltipBg: dark ? '#1e293b' : '#ffffff',
    tooltipBorder: dark ? '#334155' : '#e2e8f0',
    tooltipText: dark ? '#e2e8f0' : '#334155',
  }
}
