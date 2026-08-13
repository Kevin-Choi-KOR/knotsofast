'use client'

import { Pencil } from 'lucide-react'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { portToken } from '@/shared/utils/vessel'
import { FuelCurveChart } from './FuelCurveChart'
import type { Vessel, Voyage } from '@/shared/types'

const TYPE_LABEL_KEY = {
  container: 'typeContainer',
  bulk: 'typeBulk',
  tanker: 'typeTanker',
  roro: 'typeRoro',
} as const

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

export function VesselDetailPanel({
  vessel,
  activeVoyage,
  onEdit,
}: {
  vessel: Vessel
  activeVoyage?: Voyage
  onEdit: () => void
}) {
  const { t } = useLanguage()

  return (
    <div className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
        <div>
          <div className="text-sm font-semibold">{vessel.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.vessel[TYPE_LABEL_KEY[vessel.type]]}</div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          title="선박 정보 수정"
          className="text-slate-400 hover:text-[#6366f1]"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <div className="mb-2 text-xs font-semibold">{t.vessel.specs}</div>
          <div className="space-y-1.5">
            <SpecRow label="IMO" value={vessel.imo} />
            <SpecRow label={t.vessel.flag} value={vessel.flag} />
            <SpecRow label={t.vessel.grossTonnage} value={`${vessel.grossTonnage.toLocaleString('ko-KR')} GT`} />
            <SpecRow label="LOA" value={`${vessel.lengthOverall} m`} />
            <SpecRow label={t.vessel.beam} value={`${vessel.beam} m`} />
            <SpecRow label={t.vessel.maxDraft} value={`${vessel.maxDraft} m`} />
            <SpecRow label={t.vessel.curDraft} value={`${vessel.currentDraft} m`} />
            <SpecRow label={t.vessel.enginePower} value={`${vessel.enginePower.toLocaleString('ko-KR')} kW`} />
            <SpecRow label={t.vessel.hullFouling} value={`×${vessel.foulingFactor.toFixed(2)}`} />
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold">{t.vessel.fuelCurve}</div>
          <FuelCurveChart fuelCurve={vessel.fuelCurve} foulingFactor={vessel.foulingFactor} />
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="py-1 text-left font-normal text-slate-500 dark:text-slate-400">{t.vessel.speedCol}</th>
                <th className="py-1 text-right font-normal text-slate-500 dark:text-slate-400">{t.vessel.consumeCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {vessel.fuelCurve.map((p) => (
                <tr key={p.speedKnots}>
                  <td className="py-1 text-left text-slate-500 dark:text-slate-400">{p.speedKnots} kts</td>
                  <td className="py-1 text-right font-medium text-slate-700 dark:text-slate-200">
                    {p.fuelTonPerDay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activeVoyage && (
          <div className="rounded-lg bg-[#6366f1]/10 p-3">
            <div className="text-xs font-semibold text-[#6366f1]">{t.vessel.activeVoyage}</div>
            <div className="text-xs text-[#6366f1]">
              {portToken(activeVoyage.departurePort)} → {portToken(activeVoyage.arrivalPort)}
            </div>
            <div className="mt-1 text-xs text-[#6366f1]/70">{activeVoyage.cargoDescription}</div>
          </div>
        )}
      </div>
    </div>
  )
}
