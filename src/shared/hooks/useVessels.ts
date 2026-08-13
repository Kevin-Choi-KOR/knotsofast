import useSWR from 'swr'
import type { Vessel } from '@/shared/types'
import { fetcher } from '@/shared/utils/fetcher'

export function useVessels() {
  const { data, isLoading, mutate } = useSWR<Vessel[]>('/api/vessels', fetcher)
  return { vessels: data ?? [], isLoading, mutate }
}
