import type { FuelType } from '@/shared/types'

/** POST /api/schedule/voyage-pdf-parse 요청 payload (docs/specs/SCHEDULE.md 5.14장). */
export interface VoyagePdfParseRequest {
  lang: 'ko' | 'en'
  fileBase64: string
  vessels: { id: string; name: string; imo: string }[]
  ports: { code: string; name: string; nameEn: string }[]
}

export interface VoyagePdfParseFields {
  vesselId: string
  departurePortCode: string
  arrivalPortCode: string
  etd: string
  rta: string
  sta: string
  rtaConfirmed: boolean
  cargoDescription: string
  cargoTon: number
  fuelType: FuelType
  plannedSpeedKnots: number
}

export interface VoyagePdfParseSuccess extends VoyagePdfParseFields {
  ok: true
  /** 보조 필드(vesselId/포트코드/sta) 중 하나라도 비어있으면 partial. */
  status: 'success' | 'partial'
}

export type VoyagePdfParseFailureReason = 'bad_request' | 'no_api_key' | 'upstream_error'

export interface VoyagePdfParseFailure {
  ok: false
  reason: VoyagePdfParseFailureReason
}

export type VoyagePdfParseResponse = VoyagePdfParseSuccess | VoyagePdfParseFailure

/** File → base64(데이터 URL 접두어 제외). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('unexpected FileReader result'))
        return
      }
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error ?? new Error('file read failed'))
    reader.readAsDataURL(file)
  })
}
