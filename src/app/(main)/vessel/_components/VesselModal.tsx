'use client'

import { useState, type ComponentType } from 'react'
import { Ship, Flag, Ruler, Gauge, Calendar, Activity, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { OWN_COMPANY_NAME } from '@/shared/constants'
import { buildFuelCurve, isFieldEditable, type VesselModalMode } from '@/shared/utils/vessel'
import type { Vessel, VesselType, VesselStatus } from '@/shared/types'

interface FormState {
  name: string
  imo: string
  type: VesselType
  flag: string
  buildYear: string
  grossTonnage: string
  lengthOverall: string
  beam: string
  maxDraft: string
  currentDraft: string
  enginePower: string
  foulingFactor: string
  status: VesselStatus
  designSpeedKnots: string
  designSpeedFuelTon: string
}

function initialForm(vessel: Vessel | null): FormState {
  if (vessel) {
    return {
      name: vessel.name,
      imo: vessel.imo,
      type: vessel.type,
      flag: vessel.flag,
      buildYear: String(vessel.buildYear),
      grossTonnage: String(vessel.grossTonnage),
      lengthOverall: String(vessel.lengthOverall),
      beam: String(vessel.beam),
      maxDraft: String(vessel.maxDraft),
      currentDraft: String(vessel.currentDraft),
      enginePower: String(vessel.enginePower),
      foulingFactor: String(vessel.foulingFactor),
      status: vessel.status,
      designSpeedKnots: String(vessel.designSpeedKnots),
      designSpeedFuelTon: String(vessel.designSpeedFuelTon),
    }
  }
  return {
    name: '',
    imo: '',
    type: 'container',
    flag: 'KR',
    buildYear: String(new Date().getFullYear()),
    grossTonnage: '',
    lengthOverall: '',
    beam: '',
    maxDraft: '',
    currentDraft: '',
    enginePower: '',
    foulingFactor: '1.00',
    status: 'active',
    designSpeedKnots: '14',
    designSpeedFuelTon: '100',
  }
}

type ErrorMap = Partial<Record<keyof FormState, string>>

function validate(form: FormState): ErrorMap {
  const errors: ErrorMap = {}
  if (form.name.trim() === '') errors.name = '선박명을 입력해주세요'
  if (!/^\d{7}$/.test(form.imo)) errors.imo = 'IMO 번호 7자리를 입력해주세요'
  if (form.flag.trim() === '') errors.flag = '선적국을 입력해주세요'
  if (!form.buildYear || Number(form.buildYear) < 1950) errors.buildYear = '건조년도를 입력해주세요'
  if (!form.grossTonnage || Number(form.grossTonnage) <= 0) errors.grossTonnage = '총톤수를 입력해주세요'
  if (!form.lengthOverall || Number(form.lengthOverall) <= 0) errors.lengthOverall = '전장을 입력해주세요'
  if (!form.beam || Number(form.beam) <= 0) errors.beam = '선폭을 입력해주세요'
  if (!form.maxDraft || Number(form.maxDraft) <= 0) errors.maxDraft = '최대 흘수를 입력해주세요'
  if (!form.currentDraft || Number(form.currentDraft) <= 0) errors.currentDraft = '현재 흘수를 입력해주세요'
  if (Number(form.currentDraft) > Number(form.maxDraft)) errors.currentDraft = '현재 흘수는 최대 흘수를 초과할 수 없습니다'
  if (!form.enginePower || Number(form.enginePower) <= 0) errors.enginePower = '엔진 출력을 입력해주세요'
  if (!form.foulingFactor || Number(form.foulingFactor) < 1) errors.foulingFactor = '노후 계수는 1.00 이상이어야 합니다'
  if (!form.designSpeedKnots || Number(form.designSpeedKnots) <= 0) errors.designSpeedKnots = '기준 속도를 입력해주세요'
  if (!form.designSpeedFuelTon || Number(form.designSpeedFuelTon) <= 0)
    errors.designSpeedFuelTon = '기준 속도 연료소모량을 입력해주세요'
  return errors
}

function FieldLabel({ icon: Icon, required, children }: { icon: ComponentType<{ className?: string }>; required?: boolean; children: string }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
      <Icon className="h-3.5 w-3.5" />
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function inputClass(disabled: boolean, hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]',
    disabled && 'cursor-not-allowed bg-slate-100 opacity-60 dark:bg-slate-800/50',
    hasError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700',
  )
}

export function VesselModal({
  mode,
  vessel,
  hasActiveVoyage,
  onClose,
  onSubmit,
}: {
  mode: VesselModalMode
  vessel: Vessel | null
  hasActiveVoyage: boolean
  onClose: () => void
  onSubmit: (vessel: Vessel) => void
}) {
  const [form, setForm] = useState<FormState>(() => initialForm(vessel))
  const [errors, setErrors] = useState<ErrorMap>({})

  const editable = (key: Parameters<typeof isFieldEditable>[1]) => isFieldEditable(mode, key, hasActiveVoyage)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const isEditing = mode === 'view' && !!vessel
    const result: Vessel = {
      id: isEditing && vessel ? vessel.id : `v${Date.now()}`,
      name: form.name.trim(),
      imo: form.imo,
      type: form.type,
      flag: form.flag.trim().toUpperCase(),
      company: isEditing && vessel ? vessel.company : OWN_COMPANY_NAME,
      grossTonnage: Number(form.grossTonnage),
      lengthOverall: Number(form.lengthOverall),
      beam: Number(form.beam),
      maxDraft: Number(form.maxDraft),
      currentDraft: Number(form.currentDraft),
      enginePower: Number(form.enginePower),
      fuelCurve:
        isEditing && vessel
          ? vessel.fuelCurve
          : buildFuelCurve(Number(form.designSpeedKnots), Number(form.designSpeedFuelTon)),
      designSpeedKnots: Number(form.designSpeedKnots),
      designSpeedFuelTon: Number(form.designSpeedFuelTon),
      foulingFactor: Number(form.foulingFactor),
      status: form.status,
      buildYear: Number(form.buildYear),
    }

    onSubmit(result)
    if (isEditing) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/15">
              <Ship className="h-4 w-4 text-[#6366f1]" />
            </span>
            <div>
              <div className="text-sm font-semibold">{mode === 'create' ? '선박 등록' : '선박 정보 조회 · 수정'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'create' ? '새 선박 프로필을 등록합니다' : '등록된 선박 정보를 확인하고 일부 항목을 수정합니다'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form id="vessel-form" onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* ① 선박명 / IMO 번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel icon={Ship} required>선박명</FieldLabel>
              <input
                type="text"
                value={form.name}
                disabled={!editable('name')}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="예: HECO PIONEER"
                className={inputClass(!editable('name'), !!errors.name)}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <FieldLabel icon={Ship} required>IMO 번호</FieldLabel>
              <input
                type="text"
                value={form.imo}
                disabled={!editable('imo')}
                onChange={(e) => setField('imo', e.target.value.replace(/\D/g, '').slice(0, 7))}
                placeholder="예: 9876543"
                className={inputClass(!editable('imo'), !!errors.imo)}
              />
              {errors.imo && <p className="mt-1 text-xs text-red-500">{errors.imo}</p>}
            </div>
          </div>

          {/* ② 선종 / 선적국 / 건조년도 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel icon={Ship}>선종</FieldLabel>
              <select
                value={form.type}
                disabled={!editable('type')}
                onChange={(e) => setField('type', e.target.value as VesselType)}
                className={inputClass(!editable('type'), false)}
              >
                <option value="container">컨테이너선</option>
                <option value="bulk">벌크선</option>
                <option value="tanker">탱커선</option>
                <option value="roro">로로선</option>
              </select>
            </div>
            <div>
              <FieldLabel icon={Flag} required>선적국</FieldLabel>
              <input
                type="text"
                value={form.flag}
                disabled={!editable('flag')}
                onChange={(e) => setField('flag', e.target.value.slice(0, 2).toUpperCase())}
                placeholder="예: KR"
                className={inputClass(!editable('flag'), !!errors.flag)}
              />
              {errors.flag && <p className="mt-1 text-xs text-red-500">{errors.flag}</p>}
            </div>
            <div>
              <FieldLabel icon={Calendar} required>건조년도</FieldLabel>
              <input
                type="number"
                value={form.buildYear}
                disabled={!editable('buildYear')}
                onChange={(e) => setField('buildYear', e.target.value)}
                className={inputClass(!editable('buildYear'), !!errors.buildYear)}
              />
              {errors.buildYear && <p className="mt-1 text-xs text-red-500">{errors.buildYear}</p>}
            </div>
          </div>

          {/* ③ 총톤수 / 전장 / 선폭 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel icon={Ruler} required>총톤수 (GT)</FieldLabel>
              <input
                type="number"
                min={1}
                value={form.grossTonnage}
                disabled={!editable('grossTonnage')}
                onChange={(e) => setField('grossTonnage', e.target.value)}
                placeholder="예: 94500"
                className={inputClass(!editable('grossTonnage'), !!errors.grossTonnage)}
              />
              {errors.grossTonnage && <p className="mt-1 text-xs text-red-500">{errors.grossTonnage}</p>}
            </div>
            <div>
              <FieldLabel icon={Ruler} required>전장(LOA, m)</FieldLabel>
              <input
                type="number"
                min={1}
                step={0.1}
                value={form.lengthOverall}
                disabled={!editable('lengthOverall')}
                onChange={(e) => setField('lengthOverall', e.target.value)}
                placeholder="예: 299"
                className={inputClass(!editable('lengthOverall'), !!errors.lengthOverall)}
              />
              {errors.lengthOverall && <p className="mt-1 text-xs text-red-500">{errors.lengthOverall}</p>}
            </div>
            <div>
              <FieldLabel icon={Ruler} required>선폭 (m)</FieldLabel>
              <input
                type="number"
                min={1}
                step={0.1}
                value={form.beam}
                disabled={!editable('beam')}
                onChange={(e) => setField('beam', e.target.value)}
                placeholder="예: 48.2"
                className={inputClass(!editable('beam'), !!errors.beam)}
              />
              {errors.beam && <p className="mt-1 text-xs text-red-500">{errors.beam}</p>}
            </div>
          </div>

          {/* ④ 최대 흘수 / 현재 흘수 / 엔진 출력 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel icon={Gauge} required>최대 흘수 (m)</FieldLabel>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.maxDraft}
                disabled={!editable('maxDraft')}
                onChange={(e) => setField('maxDraft', e.target.value)}
                placeholder="예: 14.5"
                className={inputClass(!editable('maxDraft'), !!errors.maxDraft)}
              />
              {errors.maxDraft && <p className="mt-1 text-xs text-red-500">{errors.maxDraft}</p>}
            </div>
            <div>
              <FieldLabel icon={Gauge} required>현재 흘수 (m)</FieldLabel>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.currentDraft}
                disabled={!editable('currentDraft')}
                onChange={(e) => setField('currentDraft', e.target.value)}
                placeholder="예: 13.1"
                className={inputClass(!editable('currentDraft'), !!errors.currentDraft)}
              />
              {errors.currentDraft && <p className="mt-1 text-xs text-red-500">{errors.currentDraft}</p>}
            </div>
            <div>
              <FieldLabel icon={Activity} required>엔진 출력 (kW)</FieldLabel>
              <input
                type="number"
                min={1}
                value={form.enginePower}
                disabled={!editable('enginePower')}
                onChange={(e) => setField('enginePower', e.target.value)}
                placeholder="예: 72240"
                className={inputClass(!editable('enginePower'), !!errors.enginePower)}
              />
              {errors.enginePower && <p className="mt-1 text-xs text-red-500">{errors.enginePower}</p>}
            </div>
          </div>

          {/* ⑤ 선체 노후 계수 / 운항 상태 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel icon={Activity} required>선체 노후 계수</FieldLabel>
              <input
                type="number"
                min={1}
                step={0.01}
                value={form.foulingFactor}
                disabled={!editable('foulingFactor')}
                onChange={(e) => setField('foulingFactor', e.target.value)}
                className={inputClass(!editable('foulingFactor'), !!errors.foulingFactor)}
              />
              {errors.foulingFactor && <p className="mt-1 text-xs text-red-500">{errors.foulingFactor}</p>}
            </div>
            <div>
              <FieldLabel icon={Activity}>운항 상태</FieldLabel>
              <select
                value={form.status}
                disabled={!editable('status')}
                onChange={(e) => setField('status', e.target.value as VesselStatus)}
                className={inputClass(!editable('status'), false)}
              >
                <option value="active">운항 가능</option>
                <option value="maintenance">정비 중</option>
                <option value="idle">대기</option>
              </select>
              {!editable('status') && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">운항중인 항차가 있어 수정할 수 없습니다</p>
              )}
            </div>
          </div>

          {/* ⑥ 기준 속도 / 기준 속도 연료소모 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel icon={Gauge} required>기준 속도 (kts)</FieldLabel>
              <input
                type="number"
                min={1}
                step={0.5}
                value={form.designSpeedKnots}
                disabled={!editable('designSpeedKnots')}
                onChange={(e) => setField('designSpeedKnots', e.target.value)}
                className={inputClass(!editable('designSpeedKnots'), !!errors.designSpeedKnots)}
              />
              {errors.designSpeedKnots && <p className="mt-1 text-xs text-red-500">{errors.designSpeedKnots}</p>}
            </div>
            <div>
              <FieldLabel icon={Gauge} required>기준 속도 연료소모 (ton/day)</FieldLabel>
              <input
                type="number"
                min={1}
                value={form.designSpeedFuelTon}
                disabled={!editable('designSpeedFuelTon')}
                onChange={(e) => setField('designSpeedFuelTon', e.target.value)}
                className={inputClass(!editable('designSpeedFuelTon'), !!errors.designSpeedFuelTon)}
              />
              {errors.designSpeedFuelTon && <p className="mt-1 text-xs text-red-500">{errors.designSpeedFuelTon}</p>}
            </div>
          </div>

          {/* ⑦ 안내 배너 */}
          <div className="rounded-lg border border-[#6366f1]/20 bg-[#6366f1]/8 px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
            {mode === 'create'
              ? '연료 소모 커브는 기준 속도·소모량을 바탕으로 해군 배수량 법칙(속도³ 비례)에 따라 자동 산출됩니다. 등록 후 상세 패널에서 확인할 수 있습니다.'
              : '기준 속도·연료소모량은 AI 운항 리포팅의 연료·CO₂ 절감 계산 기초값이라 등록 후에는 수정할 수 없습니다. 그 외 선체 치수·엔진출력 등 진수 시점에 확정되는 제원도 함께 잠겨 있습니다.'}
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            취소
          </button>
          <button
            type="submit"
            form="vessel-form"
            className="rounded-lg bg-[#6366f1] px-4 py-2 text-sm text-white hover:bg-[#4f46e5]"
          >
            {mode === 'create' ? '선박 등록' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
