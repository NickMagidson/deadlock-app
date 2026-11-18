export interface RequestCache {
  getOrCreate<T>(
    endpoint: string,
    input: unknown,
    loader: () => Promise<T>,
  ): Promise<T>
}

export function createRequestCache(): RequestCache {
  const entries = new Map<string, Promise<unknown>>()

  return {
    getOrCreate<T>(endpoint: string, input: unknown, loader: () => Promise<T>) {
      const key = `${endpoint}:${stableStringify(input)}`
      const existing = entries.get(key) as Promise<T> | undefined
      if (existing) return existing

      const pending = loader().catch((error) => {
        entries.delete(key)
        throw error
      })
      entries.set(key, pending)
      return pending
    },
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
