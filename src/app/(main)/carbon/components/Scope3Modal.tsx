'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { IconButton } from '@/shared/components/Button'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { generateScope3CertificatePdf } from './certificatePdf'

interface Scope3ModalProps {
  onClose: () => void
  vesselName: string
  departurePort: string
  arrivalPort: string
  distanceNm: number
  cargoDescription: string
  savedTon: number
  savedPct: number
  voyageId: string
}

export function Scope3Modal({
  onClose,
  vesselName,
  departurePort,
  arrivalPort,
  distanceNm,
  cargoDescription,
  savedTon,
  savedPct,
  voyageId,
}: Scope3ModalProps) {
  const { t, lang } = useLanguage()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    generateScope3CertificatePdf({
      lang,
      vesselName,
      departurePort,
      arrivalPort,
      distanceNm,
      cargoDescription,
      savedTon,
      savedPct,
    }).then((doc) => {
      if (cancelled) return
      objectUrl = URL.createObjectURL(doc.output('blob'))
      setPdfUrl(objectUrl)
    })

    return () => {
      cancelled = true
      // 메모리 누수 방지 — 모달이 닫히거나 언어가 바뀌면 이전 blob URL을 해제한다.
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [lang, vesselName, departurePort, arrivalPort, distanceNm, cargoDescription, savedTon, savedPct])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold">{t.carbon.scope3ModalTitle}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.carbon.scope3ModalSub}</div>
          </div>
          <IconButton label={t.carbon.scope3Close} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {pdfUrl ? (
            <iframe src={pdfUrl} title="scope3-certificate" className="h-[420px] w-full rounded-lg border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">{t.carbon.scope3Disclaimer}</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t.carbon.scope3Close}
          </button>
          <a
            href={pdfUrl ?? undefined}
            download={`scope3-certificate-${voyageId}.pdf`}
            aria-disabled={!pdfUrl}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4f46e5] aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {t.carbon.scope3Download}
          </a>
        </div>
      </div>
    </div>
  )
}

export default Scope3Modal
