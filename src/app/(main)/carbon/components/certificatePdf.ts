import { jsPDF } from 'jspdf'

export interface CertificateParams {
  lang: 'ko' | 'en'
  voyageId: string
  vesselName: string
  vesselImo: string
  vesselFlag: string
  departurePort: string
  arrivalPort: string
  distanceNm: number
  cargoDescription: string
  cargoTon: number
  fuelType: string
  etd: string
  eta: string
  totalCo2Ton: number
  savedTon: number
  savedPct: number
}

let cachedFontBase64: string | null = null

// jsPDF 기본 폰트에는 한글 글리프가 없어 그대로 쓰면 깨진다 — public/fonts의 NotoSansKR을 임베딩한다.
async function loadKoreanFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64
  const res = await fetch('/fonts/NotoSansKR-Regular.ttf')
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  cachedFontBase64 = btoa(binary)
  return cachedFontBase64
}

// 실제 문서로 쓸 수 있도록 항차별 고유 증명서 번호를 만든다 (KSF-GHG-{항차ID}-{연도}).
function certificateNumber(voyageId: string, issuedAt: Date): string {
  return `KSF-GHG-${voyageId.toUpperCase()}-${issuedAt.getFullYear()}`
}

function certificateText(params: CertificateParams) {
  const locale = params.lang === 'ko' ? 'ko-KR' : 'en-US'
  const etdLabel = new Date(params.etd).toLocaleDateString(locale)
  const etaLabel = new Date(params.eta).toLocaleDateString(locale)

  if (params.lang === 'en') {
    return {
      title: 'GREENHOUSE GAS EMISSION REDUCTION CERTIFICATE',
      certNoLabel: 'Certificate No.',
      vesselSection: 'Vessel Particulars',
      voyageSection: 'Voyage Information',
      vesselLabel: 'Vessel Name',
      imoLabel: 'IMO Number',
      flagLabel: 'Flag State',
      routeLabel: 'Route',
      periodLabel: 'Voyage Period',
      cargoLabel: 'Cargo',
      fuelLabel: 'Fuel Type',
      body: `This certifies that AI-optimized eco-speed operation on the above voyage reduced CO2 emissions by ${params.savedTon.toFixed(1)} ton (${params.savedPct.toFixed(1)}%) versus the benchmark average of similar vessels on the same route.`,
      scope3Note:
        "This reduction record may be used toward your organization's Scope 3 (supply chain) carbon accounting.",
      issuedLabel: 'Date of Issue',
      issuedBy: 'Issued by: KNOT SO FAST Voyage Optimization Platform',
      totalLabel: 'Total Voyage CO2 Emissions',
      spotlightLabel: 'CO2 Emissions Reduced',
      seal: 'CERTIFIED',
      signature: 'Authorized Signature',
      arrow: '->',
      periodValue: `${etdLabel} - ${etaLabel}`,
      cargoValue: `${params.cargoDescription} (${Math.round(params.cargoTon).toLocaleString('en-US')} ton)`,
    }
  }
  return {
    title: '온실가스 배출 감축 증명서',
    certNoLabel: '증명서 번호',
    vesselSection: '선박 정보',
    voyageSection: '항차 정보',
    vesselLabel: '선박명',
    imoLabel: 'IMO 번호',
    flagLabel: '선적국',
    routeLabel: '항로',
    periodLabel: '운항 기간',
    cargoLabel: '화물',
    fuelLabel: '사용 연료',
    // PDF 임베딩 폰트(NotoSansKR)에 아래첨자(₂)·화살표(→) 글리프가 없어 렌더링 시 누락된다 —
    // 화면 표시용 문구와 달리 PDF 전용 텍스트는 ASCII로 대체한다.
    body: `본 증명서는 상기 항차에서 AI 에코스피드 최적 운항을 적용한 결과, 유사 선박·동일 항로 평균 대비 CO2 배출량 ${params.savedTon.toFixed(1)} ton(${params.savedPct.toFixed(1)}%)을 절감하였음을 증명합니다.`,
    scope3Note: '본 절감 실적은 귀사의 Scope 3(공급망) 탄소 배출량 산정에 활용하실 수 있습니다.',
    issuedLabel: '발급일',
    issuedBy: '발급: KNOT SO FAST 운항 최적화 플랫폼',
    totalLabel: '해당 항차 총 CO2 배출량',
    spotlightLabel: 'CO2 절감량',
    seal: '인증',
    signature: '발급 책임자 서명',
    arrow: '->',
    periodValue: `${etdLabel} - ${etaLabel}`,
    cargoValue: `${params.cargoDescription} (${Math.round(params.cargoTon).toLocaleString('ko-KR')} ton)`,
  }
}

// 화주에게 전달하는 공식 문서 — 이중 테두리 + 선박/항차 정보 + 절감량 스포트라이트 박스 + 서명란/인증 씰.
// 실제 발급 문서로 쓸 수 있도록 선박·항차 데이터를 그대로 반영한다(임의 값 없음).
export async function generateScope3CertificatePdf(params: CertificateParams): Promise<jsPDF> {
  const fontBase64 = await loadKoreanFontBase64()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64)
  doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal')
  doc.setFont('NotoSansKR', 'normal')
  doc.setTextColor(15, 23, 42)

  const issuedAt = new Date()
  const t = certificateText(params)
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(1.2)
  doc.rect(8, 8, pageW - 16, pageH - 16)
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.3)
  doc.rect(12, 12, pageW - 24, pageH - 24)

  let y = 26
  doc.setFontSize(19)
  doc.text(t.title, pageW / 2, y, { align: 'center' })
  y += 7
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`${t.certNoLabel}: ${certificateNumber(params.voyageId, issuedAt)}`, pageW / 2, y, { align: 'center' })
  doc.setTextColor(15, 23, 42)
  y += 6
  doc.setDrawColor(203, 213, 225)
  doc.line(20, y, pageW - 20, y)
  y += 11

  const sectionLabel = (label: string) => {
    doc.setFontSize(11)
    doc.setFont('NotoSansKR', 'normal')
    doc.setTextColor(99, 102, 241)
    doc.text(label, 24, y)
    doc.setTextColor(15, 23, 42)
    y += 7
  }

  const infoRow = (label: string, value: string) => {
    doc.setFontSize(12)
    doc.text(`${label}: ${value}`, 26, y)
    y += 7.5
  }

  // 선박 정보 — 화면에서 선택된 선박 데이터를 그대로 반영한다.
  sectionLabel(t.vesselSection)
  infoRow(t.vesselLabel, params.vesselName)
  infoRow(t.imoLabel, params.vesselImo)
  infoRow(t.flagLabel, params.vesselFlag)
  y += 3

  // 항차 정보 — 화면에서 선택된 항차 데이터를 그대로 반영한다.
  sectionLabel(t.voyageSection)
  infoRow(t.routeLabel, `${params.departurePort} ${t.arrow} ${params.arrivalPort} (${params.distanceNm.toLocaleString('en-US')} nm)`)
  infoRow(t.periodLabel, t.periodValue)
  infoRow(t.cargoLabel, t.cargoValue)
  infoRow(t.fuelLabel, params.fuelType)
  y += 2
  doc.line(20, y, pageW - 20, y)
  y += 11

  doc.setFontSize(12)
  const bodyLines: string[] = doc.splitTextToSize(t.body, pageW - 48)
  doc.text(bodyLines, 24, y)
  y += bodyLines.length * 6.8 + 8

  // 총 배출량 + 절감량 스포트라이트 박스
  const boxH = 32
  doc.setFillColor(236, 253, 245)
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.5)
  doc.roundedRect(24, y, pageW - 48, boxH, 3, 3, 'FD')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`${t.totalLabel}: ${params.totalCo2Ton.toFixed(1)} ton`, pageW / 2, y + 8, { align: 'center' })
  doc.setTextColor(5, 150, 105)
  doc.setFontSize(11)
  doc.text(t.spotlightLabel, pageW / 2, y + 16, { align: 'center' })
  doc.setFontSize(21)
  doc.text(`${params.savedTon.toFixed(1)} ton (${params.savedPct.toFixed(1)}%)`, pageW / 2, y + 27, {
    align: 'center',
  })
  doc.setTextColor(15, 23, 42)
  y += boxH + 12

  doc.setFontSize(11)
  const noteLines: string[] = doc.splitTextToSize(t.scope3Note, pageW - 48)
  doc.text(noteLines, 24, y)
  y += noteLines.length * 6.2 + 10

  doc.setDrawColor(203, 213, 225)
  doc.line(20, y, pageW - 20, y)
  y += 10

  doc.setFontSize(11)
  doc.text(`${t.issuedLabel}: ${issuedAt.toLocaleDateString(params.lang === 'ko' ? 'ko-KR' : 'en-US')}`, 24, y)
  y += 7.5
  doc.text(t.issuedBy, 24, y)

  // 서명란 + 인증 씰
  const sigY = pageH - 32
  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.3)
  doc.line(24, sigY, 90, sigY)
  doc.setFontSize(10)
  doc.text(t.signature, 24, sigY + 5)

  doc.setDrawColor(99, 102, 241)
  doc.setLineWidth(1)
  doc.circle(pageW - 40, sigY - 6, 14, 'S')
  doc.setTextColor(99, 102, 241)
  doc.setFontSize(8)
  doc.text(t.seal, pageW - 40, sigY - 6, { align: 'center' })

  return doc
}
