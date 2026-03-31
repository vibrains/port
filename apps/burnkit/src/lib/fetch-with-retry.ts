interface RetryConfig {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  retryableStatuses?: number[]
}

/**
 * Fetch wrapper with exponential backoff + jitter.
 * Retries transient server errors automatically.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
  } = config

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)

    if (response.ok || !retryableStatuses.includes(response.status)) {
      return response
    }

    if (attempt === maxRetries) return response

    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    const jitter = delay * 0.1 * Math.random()
    await new Promise((resolve) => setTimeout(resolve, delay + jitter))
  }

  // Unreachable, but TypeScript needs it
  throw new Error('fetchWithRetry: exhausted retries')
}
