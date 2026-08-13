export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function groupBy<T, K extends PropertyKey>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>
  for (const item of items) {
    const key = keyFn(item)
    ;(result[key] ??= []).push(item)
  }
  return result
}
