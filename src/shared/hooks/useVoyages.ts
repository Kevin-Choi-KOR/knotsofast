import useSWR from 'swr'
import type { Voyage } from '@/shared/types'
import { fetcher } from '@/shared/utils/fetcher'

export function useVoyages() {
  const { data, isLoading, mutate } = useSWR<Voyage[]>('/api/voyages', fetcher)
  return { voyages: data ?? [], isLoading, mutate }
}
