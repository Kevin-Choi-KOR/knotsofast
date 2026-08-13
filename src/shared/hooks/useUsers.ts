import useSWR from 'swr'
import type { User } from '@/shared/types'
import { fetcher } from '@/shared/utils/fetcher'

export function useUsers() {
  const { data, isLoading, mutate } = useSWR<User[]>('/api/users', fetcher)
  return { users: data ?? [], isLoading, mutate }
}
