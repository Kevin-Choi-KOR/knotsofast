'use client'

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Calendar, Fuel, FileUp, Gauge, Loader2, MapPin, Package, Ship, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { findPort, formatPortLabel, PORTS } from '@/mocks/ports'
import { getFleetType } from '@/shared/utils/fleet'
import { formatLocalTime } from '@/shared/lib/localTime'
import type { FuelType, Vessel, Voyage } from '@/shared/types'
import { resolvePortPairRoute, getPortCode } from '../lib/route'
import { computeEtaIso, editableFieldsForStatus, isFieldEditable } from '../lib/schedule'
import { formatDateTime } from '../lib/format'
import { joinLocalDateTime, splitLocalDateTime, toIso, isoToLocal, type AmPm } from '../lib/dateTimeWidget'
import { fileToBase64, type VoyagePdfParseRequest, type VoyagePdfParseResponse } from '../lib/voyagePdfParse'

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const FUEL_TYPES: FuelType[] = ['HFO', 'MGO', 'LNG']

interface FormState {
  vesselId: string
  departureCode: string
  arrivalCode: string
  etd: string
  rta: string
  sta: string
  rtaConfirmed: boolean
  cargoDescription: string
  cargoTon: string
  fuelType: FuelType
  plannedSpeedKnots: string
}

function initialForm(voyage: Voyage | null): FormState {
  if (!voyage) {
    return {
      vesselId: '',
      departureCode: '',
      arrivalCode: '',
      etd: '',
      rta: '',
      sta: '',
      rtaConfirmed: false,
      cargoDescription: '',
      cargoTon: '',
      fuelType: 'HFO',
      plannedSpeedKnots: '14',
    }
  }
  return {
    vesselId: voyage.vesselId,
    departureCode: getPortCode(voyage.departurePort) ?? '',
    arrivalCode: getPortCode(voyage.arrivalPort) ?? '',
    etd: isoToLocal(voyage.etd),
    rta: isoToLocal(voyage.rta),
    sta: isoToLocal(voyage.sta),
    rtaConfirmed: voyage.rtaConfirmed,
    cargoDescription: voyage.cargoDescription,
    cargoTon: String(voyage.cargoTon),
    fuelType: voyage.fuelType,
    plannedSpeedKnots: String(voyage.plannedSpeedKnots),
  }
}

function fieldClass(disabled: boolean, error?: string) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm dark:bg-slate-800',
    'focus:outline-none focus:ring-2 focus:ring-[#6366f1]',
    disabled ? 'cursor-not-allowed bg-slate-50 opacity-60 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-800',
    error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
  )
}

function FieldLabel({ icon: Icon, children, required }: { icon: React.ElementType; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
      <Icon className="h-3.5 w-3.5" />
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function DateTimeField({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  error?: string
}) {
  const { t } = useLanguage()
  const parts = splitLocalDateTime(value)

  function update(next: Partial<{ date: string; hour12: string; minute: string; ampm: AmPm }>) {
    const merged = { ...parts, ...next }
    onChange(joinLocalDateTime(merged.date, merged.hour12, merged.minute, merged.ampm))
  }

  return (
    <div>
      <input
        type="date"
        value={parts.date}
        disabled={disabled}
        onChange={(e) => update({ date: e.target.value })}
        className={fieldClass(!!disabled, error)}
      />
      <div className="mt-1.5 flex gap-1.5">
        <select
          value={parts.hour12}
          disabled={disabled}
          onChange={(e) => update({ hour12: e.target.value })}
          className={cn(fieldClass(!!disabled, error), 'w-11 px-1')}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          value={parts.minute}
          disabled={disabled}
          onChange={(e) => update({ minute: e.target.value })}
          className={cn(fieldClass(!!disabled, error), 'w-11 px-1')}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={parts.ampm}
          disabled={disabled}
          onChange={(e) => update({ ampm: e.target.value as AmPm })}
          className={cn(fieldClass(!!disabled, error), 'min-w-[56px] flex-1 appearance-none text-center')}
        >
          <option value="AM">{t.modal.am}</option>
          <option value="PM">{t.modal.pm}</option>
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface VoyageModalProps {
  mode: 'create' | 'view'
  voyage: Voyage | null
  vessels: Vessel[]
  onClose: () => void
  mutateVoyages: () => Promise<unknown>
}

export function VoyageModal({ mode, voyage, vessels, onClose, mutateVoyages }: VoyageModalProps) {
  const { t, lang } = useLanguage()
  const [form, setForm] = useState<FormState>(() => initialForm(voyage))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [etaPreview, setEtaPreview] = useState('')
  const [dragCounter, setDragCounter] = useState(0)
  const [isParsingPdf, setIsParsingPdf] = useState(false)
  const [pdfParseStatus, setPdfParseStatus] = useState<'partial' | 'error' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = mode === 'view' && !!voyage
  const editableFields = editableFieldsForStatus(voyage?.status ?? 'preparing')
  const isCreate = mode === 'create'
  const canEdit = (field: 'sta' | 'plannedSpeedKnots' | string) => isCreate || isFieldEditable(editableFields, field)
  const isFullyReadOnly = isEditing && editableFields === 'none'
  const isPartiallyRestricted = isEditing && editableFields !== 'all' && editableFields !== 'none'

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // ETA 자동 계산(6.2장) — 완전 조회 전용(완료/취소)이면 저장된 voyage.eta만 쓰고 재계산하지 않는다.
  useEffect(() => {
    if (isFullyReadOnly) return
    const hasInputs = !!(form.departureCode && form.arrivalCode && form.etd && Number(form.plannedSpeedKnots) > 0)
    if (!hasInputs) return
    let cancelled = false
    resolvePortPairRoute(form.departureCode, form.arrivalCode).then((route) => {
      if (cancelled) return
      const distanceNm = route?.distanceNm ?? 0
      if (distanceNm <= 0) return
      setEtaPreview(computeEtaIso(toIso(form.etd), distanceNm, Number(form.plannedSpeedKnots)))
    })
    return () => {
      cancelled = true
    }
  }, [isFullyReadOnly, form.departureCode, form.arrivalCode, form.etd, form.plannedSpeedKnots])

  const displayEtaIso = etaPreview || (isFullyReadOnly && voyage ? voyage.eta : '')
  const arrivalOffset = form.arrivalCode ? (findPort(form.arrivalCode)?.utcOffset ?? 9) : 9

  const effectiveRtaIso = canEdit('rta') || isCreate ? toIso(form.rta) : (voyage?.rta ?? '')
  const isLate = !!displayEtaIso && !!effectiveRtaIso && new Date(effectiveRtaIso) < new Date(displayEtaIso)

  const vesselOptions = vessels.filter((v) => {
    const excluded = v.status === 'maintenance' || getFleetType(v) === 'other'
    return !excluded || v.id === voyage?.vesselId
  })

  // AI 분석 자동 등록(PDF) — 선택 구현(docs/specs/SCHEDULE.md 5.14장). 등록 모드에서만 노출한다.
  // roster는 실제 선택 가능한 선박(정비중·타사선 제외)으로 한정 — 그 밖의 선박을 매칭시키면
  // 등록 폼의 <select>에 해당 옵션이 없어 선택값이 빈 채로 보인다.
  async function processPdfFile(file: File) {
    setIsParsingPdf(true)
    setPdfParseStatus(null)
    try {
      const fileBase64 = await fileToBase64(file)
      const payload: VoyagePdfParseRequest = {
        lang,
        fileBase64,
        vessels: vesselOptions.map((v) => ({ id: v.id, name: v.name, imo: v.imo })),
        ports: PORTS.map((p) => ({ code: p.code, name: p.name, nameEn: p.nameEn })),
      }
      const res = await fetch('/api/schedule/voyage-pdf-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data: VoyagePdfParseResponse = await res.json()

      if (!data.ok) {
        setPdfParseStatus('error')
        return
      }

      setForm((prev) => ({
        ...prev,
        vesselId: data.vesselId || prev.vesselId,
        departureCode: data.departurePortCode || prev.departureCode,
        arrivalCode: data.arrivalPortCode || prev.arrivalCode,
        etd: isoToLocal(data.etd),
        rta: isoToLocal(data.rta),
        sta: data.sta ? isoToLocal(data.sta) : prev.sta,
        rtaConfirmed: data.rtaConfirmed,
        cargoDescription: data.cargoDescription || prev.cargoDescription,
        cargoTon: data.cargoTon > 0 ? String(data.cargoTon) : prev.cargoTon,
        fuelType: data.fuelType,
        plannedSpeedKnots: data.plannedSpeedKnots > 0 ? String(data.plannedSpeedKnots) : prev.plannedSpeedKnots,
      }))
      setErrors({})
      setPdfParseStatus(data.status === 'partial' ? 'partial' : null)
    } catch {
      setPdfParseStatus('error')
    } finally {
      setIsParsingPdf(false)
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void processPdfFile(file)
  }

  // 드래그 하이라이트는 진입/이탈 카운터로 관리한다 — dragenter/dragleave만 쓰면 자식 요소를
  // 지날 때마다 dragleave가 발생해 테두리가 깜빡인다. 카운터가 0이 될 때만 해제한다.
  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragCounter((c) => c + 1)
  }
  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragCounter((c) => Math.max(0, c - 1))
  }
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragCounter(0)
    const file = e.dataTransfer.files?.[0]
    if (file) void processPdfFile(file)
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.vesselId) next.vesselId = t.modal.errVessel
    if (!form.departureCode) next.departureCode = t.modal.errDeparture
    if (!form.arrivalCode) next.arrivalCode = t.modal.errArrival
    else if (form.arrivalCode === form.departureCode) next.arrivalCode = t.modal.errPortSame
    if (!form.etd) next.etd = t.modal.errEtd
    if (!form.rta) next.rta = t.modal.errRta
    else if (form.etd && form.etd >= form.rta) next.rta = t.modal.errRtaAfterEtd
    if (form.sta && form.etd && form.etd >= form.sta) next.sta = t.modal.errStaAfterEtd
    if (!form.cargoDescription.trim()) next.cargoDescription = t.modal.errCargo
    if (!form.cargoTon || Number(form.cargoTon) <= 0) next.cargoTon = t.modal.errCargoTon
    if (!form.plannedSpeedKnots || Number(form.plannedSpeedKnots) <= 0) next.plannedSpeedKnots = t.modal.errSpeed
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const depPort = findPort(form.departureCode)
    const arrPort = findPort(form.arrivalCode)
    const route = depPort && arrPort ? await resolvePortPairRoute(depPort.code, arrPort.code) : null
    const distanceNm = route?.distanceNm ?? (isEditing && voyage ? voyage.distanceNm : 0)

    const etdIso = toIso(form.etd)
    const rtaIso = toIso(form.rta)
    const staIso = form.sta ? toIso(form.sta) : rtaIso
    const etaIso = distanceNm > 0 ? computeEtaIso(etdIso, distanceNm, Number(form.plannedSpeedKnots)) : rtaIso

    const payload = {
      ...(isEditing ? {} : { id: `voy${Date.now()}` }),
      vesselId: form.vesselId,
      departurePort: depPort ? formatPortLabel(depPort) : '',
      arrivalPort: arrPort ? formatPortLabel(arrPort) : '',
      etd: etdIso,
      sta: staIso,
      rta: rtaIso,
      rtaConfirmed: form.rtaConfirmed,
      eta: etaIso,
      status: isEditing && voyage ? voyage.status : 'preparing',
      plannedRoute: route?.points ?? (isEditing && voyage ? voyage.plannedRoute : []),
      actualRoute: isEditing && voyage ? voyage.actualRoute : [],
      plannedSpeedKnots: Number(form.plannedSpeedKnots),
      recommendedSpeedKnots: isEditing && voyage ? voyage.recommendedSpeedKnots : Number(form.plannedSpeedKnots),
      fuelType: form.fuelType,
      cargoDescription: form.cargoDescription,
      cargoTon: Number(form.cargoTon),
      distanceNm,
    }

    const res = await fetch(isEditing && voyage ? `/api/voyages/${voyage.id}` : '/api/voyages', {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSubmitting(false)
    if (!res.ok) return

    await mutateVoyages()
    onClose()
  }

  async function handleDelete() {
    if (!voyage) return
    await fetch(`/api/voyages/${voyage.id}`, { method: 'DELETE' })
    await mutateVoyages()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <Ship className="h-4 w-4 text-[#6366f1]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isCreate ? t.modal.registerVoyage : t.modal.viewVoyage}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isCreate ? t.modal.registerSub : t.modal.viewSub}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form id="voyage-form" onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <FieldLabel icon={Ship} required>
              {t.modal.selectVessel}
            </FieldLabel>
            <select
              value={form.vesselId}
              disabled={!canEdit('vesselId')}
              onChange={(e) => updateField('vesselId', e.target.value)}
              className={fieldClass(!canEdit('vesselId'), errors.vesselId)}
            >
              <option value="">{t.modal.selectVesselPh}</option>
              {vesselOptions.map((v) => {
                const typeLabel = t.modal[v.type]
                const fleetLabel = { own: t.common.fleetOwn, partner: t.common.fleetPartner, other: t.common.fleetOther }[
                  getFleetType(v)
                ]
                return (
                  <option key={v.id} value={v.id}>
                    {v.name} — IMO {v.imo} ({typeLabel}) ({fleetLabel})
                  </option>
                )
              })}
            </select>
            {errors.vesselId && <p className="mt-1 text-xs text-red-500">{errors.vesselId}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel icon={MapPin} required>
                {t.modal.departure}
              </FieldLabel>
              <select
                value={form.departureCode}
                disabled={!canEdit('departureCode')}
                onChange={(e) => updateField('departureCode', e.target.value)}
                className={fieldClass(!canEdit('departureCode'), errors.departureCode)}
              >
                <option value="">{t.modal.depPlaceholder}</option>
                {PORTS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {formatPortLabel(p)}
                  </option>
                ))}
              </select>
              {errors.departureCode && <p className="mt-1 text-xs text-red-500">{errors.departureCode}</p>}
            </div>
            <div>
              <FieldLabel icon={MapPin} required>
                {t.modal.arrival}
              </FieldLabel>
              <select
                value={form.arrivalCode}
                disabled={!canEdit('arrivalCode')}
                onChange={(e) => updateField('arrivalCode', e.target.value)}
                className={fieldClass(!canEdit('arrivalCode'), errors.arrivalCode)}
              >
                <option value="">{t.modal.arrPlaceholder}</option>
                {PORTS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {formatPortLabel(p)}
                  </option>
                ))}
              </select>
              {errors.arrivalCode && <p className="mt-1 text-xs text-red-500">{errors.arrivalCode}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel icon={Calendar} required>
                {t.modal.etd}
              </FieldLabel>
              <DateTimeField value={form.etd} onChange={(v) => updateField('etd', v)} disabled={!canEdit('etd')} error={errors.etd} />
            </div>
            <div>
              <FieldLabel icon={Calendar} required>
                {t.modal.rta}
              </FieldLabel>
              <DateTimeField value={form.rta} onChange={(v) => updateField('rta', v)} disabled={!canEdit('rta')} error={errors.rta} />
              {isLate && <p className="mt-1 text-xs font-bold text-red-600">{t.modal.lateWarning}</p>}
            </div>
            <div>
              <FieldLabel icon={Calendar}>{t.modal.sta}</FieldLabel>
              <DateTimeField value={form.sta} onChange={(v) => updateField('sta', v)} disabled={!canEdit('sta')} error={errors.sta} />
              <p className="mt-1 text-xs text-slate-400">{t.modal.staHint}</p>
              <label className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.rtaConfirmed}
                  disabled={!canEdit('rtaConfirmed')}
                  onChange={(e) => updateField('rtaConfirmed', e.target.checked)}
                  className="accent-[#6366f1]"
                />
                {t.modal.rtaConfirmed}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {t.modal.etaLabel}
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {displayEtaIso ? formatLocalTime(displayEtaIso, arrivalOffset) : t.modal.etaAutoHint}
            </div>
          </div>

          <div>
            <FieldLabel icon={Package} required>
              {t.modal.cargo}
            </FieldLabel>
            <input
              type="text"
              value={form.cargoDescription}
              disabled={!canEdit('cargoDescription')}
              onChange={(e) => updateField('cargoDescription', e.target.value)}
              placeholder={t.modal.cargoPlaceholder}
              className={fieldClass(!canEdit('cargoDescription'), errors.cargoDescription)}
            />
            {errors.cargoDescription && <p className="mt-1 text-xs text-red-500">{errors.cargoDescription}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel icon={Package} required>
                {t.modal.cargoTon}
              </FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                value={form.cargoTon ? Number(form.cargoTon).toLocaleString('en-US') : ''}
                disabled={!canEdit('cargoTon')}
                onChange={(e) => updateField('cargoTon', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="50,000"
                className={fieldClass(!canEdit('cargoTon'), errors.cargoTon)}
              />
              {errors.cargoTon && <p className="mt-1 text-xs text-red-500">{errors.cargoTon}</p>}
            </div>
            <div>
              <FieldLabel icon={Fuel}>{t.modal.fuelType}</FieldLabel>
              <select
                value={form.fuelType}
                disabled={!canEdit('fuelType')}
                onChange={(e) => updateField('fuelType', e.target.value as FuelType)}
                className={fieldClass(!canEdit('fuelType'))}
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel icon={Gauge}>{t.modal.planSpeed}</FieldLabel>
              <input
                type="number"
                min={1}
                max={30}
                step={0.5}
                value={form.plannedSpeedKnots}
                disabled={!canEdit('plannedSpeedKnots')}
                onChange={(e) => updateField('plannedSpeedKnots', e.target.value)}
                className={fieldClass(!canEdit('plannedSpeedKnots'), errors.plannedSpeedKnots)}
              />
              {errors.plannedSpeedKnots && <p className="mt-1 text-xs text-red-500">{errors.plannedSpeedKnots}</p>}
            </div>
          </div>

          {isCreate && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
              {t.modal.notice}
            </div>
          )}

          {isCreate && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  'rounded-lg border-2 border-dashed p-4 text-center transition-colors',
                  dragCounter > 0 ? 'border-[#6366f1] bg-[#6366f1]/5' : 'border-slate-200 dark:border-slate-700',
                )}
              >
                {isParsingPdf ? (
                  <span className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t.modal.aiFillLoading}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-[#6366f1] dark:text-slate-400"
                  >
                    <FileUp className="h-3.5 w-3.5 shrink-0" />
                    {t.modal.dragDropHint}
                  </button>
                )}
              </div>
              {pdfParseStatus === 'partial' && (
                <p className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400">{t.modal.aiFillPartial}</p>
              )}
              {pdfParseStatus === 'error' && (
                <p className="mt-1.5 text-xs text-red-500">{t.modal.aiFillFailed}</p>
              )}
            </div>
          )}

          {isPartiallyRestricted && <Alert variant="warning">{t.modal.editRestrictedNotice}</Alert>}

          {isEditing && voyage && (
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div>
                {t.modal.createdAt}: {voyage.createdAt ? formatDateTime(voyage.createdAt) : '-'}
              </div>
              <div>
                {t.modal.updatedAt}: {voyage.updatedAt ? formatDateTime(voyage.updatedAt) : '-'}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              {confirmingDelete ? (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{t.modal.deleteConfirm}</span>
                  <button type="button" onClick={handleDelete} className="font-medium text-red-600 hover:underline">
                    {t.modal.deleteVoyage}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-slate-500 hover:underline dark:text-slate-400"
                  >
                    {t.modal.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {t.modal.deleteVoyage}
                </button>
              )}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {isCreate ? t.modal.cancel : t.modal.close}
          </Button>
          {(isCreate || editableFields !== 'none') && (
            <Button type="submit" form="voyage-form" disabled={submitting}>
              {isCreate ? (submitting ? t.modal.submitting : t.modal.submit) : t.modal.save}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VoyageModal
