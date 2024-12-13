import axios, { AxiosError } from 'axios'

export const API_TIMEOUT = {
  search: 2000,  // 2 seconds as per PRD
  generate: 5000 // 5 seconds as per PRD
}

export const API_ERRORS = {
  timeout: 'Request timed out. Please try again.',
  rateLimit: 'Too many requests. Please wait a moment before trying again.',
  network: 'Network error. Please check your connection.',
  server: 'Server error. Please try again later.',
  unauthorized: 'API key is invalid or expired.',
  unknown: 'An unexpected error occurred.'
}

// API Usage monitoring
interface APIUsage {
  timestamp: number
  endpoint: string
  success: boolean
  duration: number
  error?: string
}

const API_USAGE_KEY = 'api_usage_logs'
const MAX_USAGE_LOGS = 1000

export function logAPIUsage(usage: APIUsage) {
  try {
    const logs = JSON.parse(localStorage.getItem(API_USAGE_KEY) || '[]') as APIUsage[]
    logs.push(usage)
    
    // Keep only the last MAX_USAGE_LOGS entries
    while (logs.length > MAX_USAGE_LOGS) {
      logs.shift()
    }
    
    localStorage.setItem(API_USAGE_KEY, JSON.stringify(logs))
  } catch (error) {
    console.error('Failed to log API usage:', error)
  }
}

export function getAPIUsageStats() {
  try {
    const logs = JSON.parse(localStorage.getItem(API_USAGE_KEY) || '[]') as APIUsage[]
    const now = Date.now()
    const last24Hours = logs.filter(log => (now - log.timestamp) < 24 * 60 * 60 * 1000)
    
    return {
      total: logs.length,
      last24Hours: {
        total: last24Hours.length,
        success: last24Hours.filter(log => log.success).length,
        failed: last24Hours.filter(log => !log.success).length,
        averageDuration: last24Hours.reduce((acc, log) => acc + log.duration, 0) / last24Hours.length,
      }
    }
  } catch (error) {
    console.error('Failed to get API usage stats:', error)
    return null
  }
}

export interface ApiErrorResponse {
  error: string
  details?: string
}

export async function handleApiError(error: unknown): Promise<ApiErrorResponse> {
  const startTime = Date.now()
  let errorResponse: ApiErrorResponse

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    
    if (error.code === 'ECONNABORTED') {
      errorResponse = {
        error: 'Request Timeout',
        details: API_ERRORS.timeout
      }
    } else if (axiosError.response) {
      switch (axiosError.response.status) {
        case 429:
          errorResponse = {
            error: 'Rate Limit Exceeded',
            details: API_ERRORS.rateLimit
          }
          break
        case 401:
        case 403:
          errorResponse = {
            error: 'Authentication Error',
            details: API_ERRORS.unauthorized
          }
          break
        case 500:
        case 502:
        case 503:
        case 504:
          errorResponse = {
            error: 'Server Error',
            details: API_ERRORS.server
          }
          break
        default:
          errorResponse = axiosError.response.data as ApiErrorResponse
      }
    } else if (axiosError.request) {
      errorResponse = {
        error: 'Network Error',
        details: API_ERRORS.network
      }
    } else {
      errorResponse = {
        error: 'Unknown Error',
        details: API_ERRORS.unknown
      }
    }
  } else {
    errorResponse = {
      error: 'Unknown Error',
      details: API_ERRORS.unknown
    }
  }

  // Log the error
  logAPIUsage({
    timestamp: Date.now(),
    endpoint: (error as any)?.config?.url || 'unknown',
    success: false,
    duration: Date.now() - startTime,
    error: errorResponse.error
  })

  return errorResponse
}

export function createApiClient(type: 'search' | 'generate') {
  const startTime = Date.now()
  const client = axios.create({
    timeout: API_TIMEOUT[type],
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Add response interceptor for logging
  client.interceptors.response.use(
    (response) => {
      logAPIUsage({
        timestamp: Date.now(),
        endpoint: response.config.url || 'unknown',
        success: true,
        duration: Date.now() - startTime
      })
      return response
    },
    (error) => {
      logAPIUsage({
        timestamp: Date.now(),
        endpoint: error.config?.url || 'unknown',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      })
      return Promise.reject(error)
    }
  )

  return client
}

// Utility function to validate Brave Search API response
export function validateBraveSearchResponse(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.web?.results) &&
    typeof data.web?.total === 'number'
  )
}

// Utility function to validate OpenAI API response
export function validateOpenAIResponse(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.html === 'string' &&
    typeof data.text === 'string' &&
    typeof data.metadata === 'object'
  )
} 