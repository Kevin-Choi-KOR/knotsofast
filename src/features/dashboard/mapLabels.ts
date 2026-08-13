import type { TyphoonWarning } from '@/mocks/map-overlays'
import type { VoyageStatus } from '@/shared/types'

// DASHBOARD.md 12장 끝 — 지도 팝업 전용 사전. 앱 전역 언어(사이드바·헤더)와 별개로 4개 언어를 가진다.
export type MapLang = 'ko' | 'en' | 'zh' | 'ja'

export interface MapLabels {
  ownFleet: string
  voyage: string
  currentSpeed: string
  eta: string
  status: string
  statusLabel: (status: VoyageStatus) => string
  intensity: string
  typhoonIntensity: (code: TyphoonWarning['intensity']) => string
  maxWind: string
  radius: string
  movingDir: string
  windSpeed: string
  windDir: string
  waveHeight: string
  marineWeather: string
  source: string
  vessel: string
  recommendedSpeed: string
  sendSpeedBtn: string
  sendSpeedSending: string
  sendSpeedSuccessTitle: string
  sendSpeedFailTitle: string
  route: string
  sentAt: string
  target: string
  portBerthed: string
  portDeparting: string
  portArriving: string
  portNoVessels: string
  portEtd: (etd: string) => string
  portBoundFor: (destination: string, etaDate: string) => string
  portFrom: (origin: string, eta: string) => string
  // DASHBOARD.md 14장 23번 — 날짜·숫자는 ko-KR 고정이되, 지도 팝업만 선택된 지도 언어의
  // 로케일을 따른다. 팝업 빌더가 앱 전역 formatDate/formatDateTime(ko-KR 고정)을 쓰지 않도록
  // 언어별 포맷터를 사전 자체에 들고 있는다.
  formatDate: (iso: string) => string
  formatDateTime: (iso: string) => string
}

function makeDateFormatter(locale: string): (iso: string) => string {
  return (iso: string): string => new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function makeDateTimeFormatter(locale: string): (iso: string) => string {
  return (iso: string): string =>
    new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
}

const STATUS_KO: Record<VoyageStatus, string> = {
  preparing: '준비 중',
  underway: '운항 중',
  delayed: '지연',
  completed: '완료',
  cancelled: '취소',
}
const STATUS_EN: Record<VoyageStatus, string> = {
  preparing: 'Preparing',
  underway: 'Underway',
  delayed: 'Delayed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
const STATUS_ZH: Record<VoyageStatus, string> = {
  preparing: '准备中',
  underway: '航行中',
  delayed: '延误',
  completed: '已完成',
  cancelled: '已取消',
}
const STATUS_JA: Record<VoyageStatus, string> = {
  preparing: '準備中',
  underway: '航行中',
  delayed: '遅延',
  completed: '完了',
  cancelled: 'キャンセル',
}

const TYPHOON_KO: Record<TyphoonWarning['intensity'], string> = {
  TD: '열대저압부(TD)',
  TS: '열대폭풍(TS)',
  TY: '태풍(TY)',
  STY: '강한 태풍(STY)',
}
const TYPHOON_EN: Record<TyphoonWarning['intensity'], string> = {
  TD: 'Tropical Depression (TD)',
  TS: 'Tropical Storm (TS)',
  TY: 'Typhoon (TY)',
  STY: 'Super Typhoon (STY)',
}
const TYPHOON_ZH: Record<TyphoonWarning['intensity'], string> = {
  TD: '热带低压 (TD)',
  TS: '热带风暴 (TS)',
  TY: '台风 (TY)',
  STY: '强台风 (STY)',
}
const TYPHOON_JA: Record<TyphoonWarning['intensity'], string> = {
  TD: '熱帯低気圧 (TD)',
  TS: '熱帯暴風 (TS)',
  TY: '台風 (TY)',
  STY: '猛烈な台風 (STY)',
}

export const MAP_LABELS: Record<MapLang, MapLabels> = {
  ko: {
    ownFleet: '자사 선박',
    voyage: '항차',
    currentSpeed: '현재 속도',
    eta: 'ETA',
    status: '상태',
    statusLabel: (s) => STATUS_KO[s],
    intensity: '강도',
    typhoonIntensity: (c) => TYPHOON_KO[c],
    maxWind: '최대 풍속',
    radius: '반경',
    movingDir: '이동',
    windSpeed: '풍속',
    windDir: '풍향',
    waveHeight: '파고',
    marineWeather: '해상 기상',
    source: '출처',
    vessel: '선박',
    recommendedSpeed: '권장 속도',
    sendSpeedBtn: '제안속도 전송',
    sendSpeedSending: '전송 중...',
    sendSpeedSuccessTitle: '제안속도 전송 완료',
    sendSpeedFailTitle: '제안속도 전송 실패',
    route: '항로',
    sentAt: '전송 시각',
    target: '전송처',
    portBerthed: '정박',
    portDeparting: '출항',
    portArriving: '입항 예정',
    portNoVessels: '이 항구에 등록된 선박이 없습니다',
    portEtd: (etd) => `출항 예정: ${etd}`,
    portBoundFor: (dest, date) => `목적지: ${dest} · ETA ${date}`,
    portFrom: (origin, eta) => `출발: ${origin} · ETA ${eta}`,
    formatDate: makeDateFormatter('ko-KR'),
    formatDateTime: makeDateTimeFormatter('ko-KR'),
  },
  en: {
    ownFleet: 'Our Fleet',
    voyage: 'Voyage',
    currentSpeed: 'Current Speed',
    eta: 'ETA',
    status: 'Status',
    statusLabel: (s) => STATUS_EN[s],
    intensity: 'Intensity',
    typhoonIntensity: (c) => TYPHOON_EN[c],
    maxWind: 'Max Wind',
    radius: 'Radius',
    movingDir: 'Moving',
    windSpeed: 'Wind Speed',
    windDir: 'Wind Dir',
    waveHeight: 'Wave Height',
    marineWeather: 'Marine Weather',
    source: 'Source',
    vessel: 'Vessel',
    recommendedSpeed: 'Rec. Speed',
    sendSpeedBtn: 'Send Recommended Speed',
    sendSpeedSending: 'Sending...',
    sendSpeedSuccessTitle: 'Speed Recommendation Sent',
    sendSpeedFailTitle: 'Failed to Send',
    route: 'Route',
    sentAt: 'Sent At',
    target: 'Target',
    portBerthed: 'Berthed',
    portDeparting: 'Departing',
    portArriving: 'Arriving',
    portNoVessels: 'No vessels registered at this port',
    portEtd: (etd) => `Departing: ${etd}`,
    portBoundFor: (dest, date) => `Bound for: ${dest} · ETA ${date}`,
    portFrom: (origin, eta) => `From: ${origin} · ETA ${eta}`,
    formatDate: makeDateFormatter('en-US'),
    formatDateTime: makeDateTimeFormatter('en-US'),
  },
  zh: {
    ownFleet: '自有船舶',
    voyage: '航次',
    currentSpeed: '当前航速',
    eta: '预计到达',
    status: '状态',
    statusLabel: (s) => STATUS_ZH[s],
    intensity: '强度',
    typhoonIntensity: (c) => TYPHOON_ZH[c],
    maxWind: '最大风速',
    radius: '半径',
    movingDir: '移动方向',
    windSpeed: '风速',
    windDir: '风向',
    waveHeight: '浪高',
    marineWeather: '海上气象',
    source: '来源',
    vessel: '船舶',
    recommendedSpeed: '建议航速',
    sendSpeedBtn: '发送建议航速',
    sendSpeedSending: '发送中...',
    sendSpeedSuccessTitle: '建议航速发送成功',
    sendSpeedFailTitle: '建议航速发送失败',
    route: '航线',
    sentAt: '发送时间',
    target: '发送目标',
    portBerthed: '停泊',
    portDeparting: '出发',
    portArriving: '预计到港',
    portNoVessels: '该港口暂无登记船舶',
    portEtd: (etd) => `预计出发: ${etd}`,
    portBoundFor: (dest, date) => `目的地: ${dest} · 预计到达 ${date}`,
    portFrom: (origin, eta) => `出发地: ${origin} · 预计到达 ${eta}`,
    formatDate: makeDateFormatter('zh-CN'),
    formatDateTime: makeDateTimeFormatter('zh-CN'),
  },
  ja: {
    ownFleet: '自社船',
    voyage: '航海',
    currentSpeed: '現在速度',
    eta: 'ETA',
    status: 'ステータス',
    statusLabel: (s) => STATUS_JA[s],
    intensity: '強度',
    typhoonIntensity: (c) => TYPHOON_JA[c],
    maxWind: '最大風速',
    radius: '半径',
    movingDir: '移動',
    windSpeed: '風速',
    windDir: '風向',
    waveHeight: '波高',
    marineWeather: '海上気象',
    source: '出典',
    vessel: '船舶',
    recommendedSpeed: '推奨速度',
    sendSpeedBtn: '推奨速度を送信',
    sendSpeedSending: '送信中...',
    sendSpeedSuccessTitle: '推奨速度送信完了',
    sendSpeedFailTitle: '推奨速度送信失敗',
    route: '航路',
    sentAt: '送信時刻',
    target: '送信先',
    portBerthed: '停泊中',
    portDeparting: '出港',
    portArriving: '入港予定',
    portNoVessels: 'この港に登録された船舶はありません',
    portEtd: (etd) => `出港予定: ${etd}`,
    portBoundFor: (dest, date) => `目的地: ${dest} · ETA ${date}`,
    portFrom: (origin, eta) => `出発地: ${origin} · ETA ${eta}`,
    formatDate: makeDateFormatter('ja-JP'),
    formatDateTime: makeDateTimeFormatter('ja-JP'),
  },
}
