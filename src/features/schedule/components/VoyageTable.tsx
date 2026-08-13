'use client'

import { CalendarDays, ChevronRight, MapPin, Ship } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { VoyageBadge } from '@/shared/components/StatusBadge'
import type { AisPosition, Vessel, Voyage } from '@/shared/types'
import { getFleetType } from '@/shared/utils/fleet'
import { getPortUtcOffset, formatLocalTime, portFirstToken } from '@/shared/lib/localTime'
import { getProgressPercent } from '../lib/schedule'
import { formatNm } from '../lib/format'
import { FleetBadge } from './FleetBadge'

interface VoyageTableProps {
  voyages: Voyage[]
  vessels: Vessel[]
  positions: AisPosition[]
  onRowClick: (voyage: Voyage) => void
}

export function VoyageTable({ voyages, vessels, positions, onRowClick }: VoyageTableProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-full overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              {[
                t.schedule.colVessel,
                t.schedule.colFleetType,
                t.schedule.colRoute,
                t.schedule.colEtd,
                t.schedule.colEtaRta,
                t.schedule.colCurrentPosition,
                t.schedule.colDistance,
                t.schedule.colStatus,
                '',
              ].map((label, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400',
                    i === 1 && 'w-px',
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {voyages.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t.common.noResults}
                </td>
              </tr>
            ) : (
              voyages.map((voyage) => {
                const vessel = vessels.find((v) => v.id === voyage.vesselId)
                const position = positions.find((p) => p.vesselId === voyage.vesselId)
                const departureOffset = getPortUtcOffset(voyage.departurePort)
                const arrivalOffset = getPortUtcOffset(voyage.arrivalPort)
                const progressPercent = getProgressPercent(voyage, position)

                return (
                  <tr
                    key={voyage.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={() => onRowClick(voyage)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                          <Ship className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {vessel?.name ?? '-'}
                          </div>
                          <div className="text-xs text-slate-400">{vessel ? `IMO ${vessel.imo}` : '-'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <FleetBadge type={getFleetType(vessel)} />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        {portFirstToken(voyage.departurePort)}
                        <span className="text-slate-300 dark:text-slate-600">→</span>
                        {portFirstToken(voyage.arrivalPort)}
                      </div>
                      <div className="mt-0.5 max-w-40 truncate text-xs text-slate-400">{voyage.cargoDescription}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {formatLocalTime(voyage.etd, departureOffset)}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={cn('text-sm', voyage.status === 'delayed' ? 'text-red-600' : 'text-slate-700 dark:text-slate-200')}>
                        ETA {formatLocalTime(voyage.eta, arrivalOffset)}
                      </div>
                      <div
                        className={cn(
                          'mt-0.5 text-xs',
                          voyage.rtaConfirmed ? 'font-bold text-slate-600 dark:text-slate-300' : 'text-slate-400',
                        )}
                      >
                        RTA {formatLocalTime(voyage.rta, arrivalOffset)}
                        {voyage.rtaConfirmed && (
                          <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                            {t.schedule.rtaConfirmedTag}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{Math.round(progressPercent)}%</td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {voyage.distanceNm > 0 ? formatNm(voyage.distanceNm) : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <VoyageBadge status={voyage.status} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VoyageTable
