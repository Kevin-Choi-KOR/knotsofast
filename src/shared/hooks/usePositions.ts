import useSWR from 'swr'
import type { AisPosition } from '@/shared/types'
import { fetcher } from '@/shared/utils/fetcher'

export function usePositions() {
  const { data, isLoading, mutate } = useSWR<AisPosition[]>('/api/positions', fetcher)
  return { positions: data ?? [], isLoading, mutate }
}
