import useSWR from 'swr'
import type { EcoSpeedReport } from '@/shared/types'
import { fetcher } from '@/shared/utils/fetcher'

export function useReports() {
  const { data, isLoading, mutate } = useSWR<EcoSpeedReport[]>('/api/reports', fetcher)
  return { reports: data ?? [], isLoading, mutate }
}
