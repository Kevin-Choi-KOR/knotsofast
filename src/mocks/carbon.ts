// 항차별 CII 점수 목업 기준값 — 선박·항로마다 등급이 달라 보이도록 임의 부여한 대표값
// (실측 배출량은 vessel.fuelCurve로 실계산하지만, CII 점수는 계산식이 없어 목업으로 유지)
export const MOCK_CII_SCORE_BY_VOYAGE: Record<string, number> = {
  voy001: 4.50, // KSF PIONEER · 부산→로테르담 · C
  voy002: 3.30, // KSF NAVIGATOR · 상하이→LA · A
  voy003: 4.70, // KSF VENTURE · 포트헤들랜드→광양 · C
  voy004: 5.35, // KSF HORIZON · 라스타누라→울산 · D
  voy005: 3.95, // KSF PIONEER · 함부르크→부산 · B
  voy006: 5.75, // KSF NAVIGATOR · 오클랜드→부산 · E
}

export const CARBON_COMPARISON_LABELS = {
  historicalAvg: '동일 선박 최근 5항차 평균',
  benchmarkAvg:  '유사 선박 동일 항로 평균',
}

// 과거평균·벤치마크는 기존 voy001 기준 목업값에서 역산한 배율을 모든 항차에 동일 적용
export const CARBON_HIST_MULTIPLIER = 1.1048
export const CARBON_BENCHMARK_MULTIPLIER = 1.2145
export const CII_SCORE_HIST_MULTIPLIER = 1.0711
export const CII_SCORE_BENCHMARK_MULTIPLIER = 1.1378

// 함대 에코 랭킹 — 화면에서 선택 중인 항차의 선박은 실시간 계산값으로 대체되므로
// 나머지 자사 선박(vessels.ts) 5척 전체의 최근 항차 대비 CO₂ 절감률을 목업으로 둔다
export const MOCK_FLEET_ECO_RANKING = [
  { vesselId: 'v001', co2SavedPct: 17.7, co2SavedTon: 852.8 },  // KSF PIONEER
  { vesselId: 'v005', co2SavedPct: 24.3, co2SavedTon: 1104.2 }, // KSF ASPIRE
  { vesselId: 'v004', co2SavedPct: 21.1, co2SavedTon: 612.5 },  // KSF HORIZON
  { vesselId: 'v002', co2SavedPct: 14.2, co2SavedTon: 588.3 },  // KSF NAVIGATOR
  { vesselId: 'v003', co2SavedPct: 9.8,  co2SavedTon: 401.7 },  // KSF VENTURE
]
