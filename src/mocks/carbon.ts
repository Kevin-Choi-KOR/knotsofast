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

// 환산 가치(랭킹) — EU ETS 해운 탄소배출권 참고 시세(€80/ton, ₩1,440/€ 가정)
export const CARBON_PRICE_KRW_PER_TON = 115_000

// CII 월별 추이 x축 — 현재 점수로 끝나도록 역산해 값을 채운다
export const CII_TREND_MONTHS = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']

// 재미 요소 환산 계수 (참고용 근사값)
export const CO2_TREE_ABSORB_TON_PER_YEAR = 0.022 // 성목 1그루 연간 흡수량 ≈ 22kg
export const CO2_CAR_TON_PER_KM = 0.00012 // 승용차 1km 배출량 ≈ 120g
export const EARTH_CIRCUMFERENCE_KM = 40075
export const CO2_CHICKEN_TON = 0.0025 // 치킨 1마리 조리 탄소발자국 ≈ 2.5kg

// 대기 탄소·컴플라이언스 환산 기준
export const ANCHOR_REFERENCE_CO2_TON = 3976.4 // voy001의 원본 예시 CO₂ 총량
export const COMPLIANCE_BASE_KRW = 1_500_000_000 // 월 손실 기준액
