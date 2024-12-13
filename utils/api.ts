import axios, { AxiosError } from 'axios'
import { APIStats } from '../types/content'

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

// API metrics storage - using a more durable solution than just let
const apiMetrics = {
  total: 0,
  calls: [] as Array<{
    timestamp: number
    duration: number
    success: boolean
  }>
}

// Function to clean up old metrics
function cleanupOldMetrics() {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
  apiMetrics.calls = apiMetrics.calls.filter(call => call.timestamp > twentyFourHoursAgo)
}

// Track API calls with proper error handling
export function trackAPICall(duration: number, success: boolean) {
  try {
    apiMetrics.total++
    apiMetrics.calls.push({
      timestamp: Date.now(),
      duration: Math.max(0, duration), // Ensure duration is not negative
      success
    })

    // Clean up old metrics periodically
    cleanupOldMetrics()

    // Log for debugging
    console.log('API Metrics Updated:', {
      total: apiMetrics.total,
      recentCalls: apiMetrics.calls.length
    })
  } catch (error) {
    console.error('Error tracking API call:', error)
  }
}

// Get API usage stats with error handling
export function getAPIUsageStats(): APIStats {
  try {
    cleanupOldMetrics()

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentCalls = apiMetrics.calls.filter(call => call.timestamp > twentyFourHoursAgo)
    
    const successfulCalls = recentCalls.filter(call => call.success)
    const failedCalls = recentCalls.filter(call => !call.success)
    
    const totalDuration = recentCalls.reduce((sum, call) => sum + call.duration, 0)
    const averageDuration = recentCalls.length > 0 ? totalDuration / recentCalls.length : 0

    const stats = {
      total: apiMetrics.total,
      last24Hours: {
        total: recentCalls.length,
        success: successfulCalls.length,
        failed: failedCalls.length,
        averageDuration
      }
    }

    // Log for debugging
    console.log('API Stats Retrieved:', stats)

    return stats
  } catch (error) {
    console.error('Error getting API stats:', error)
    return {
      total: 0,
      last24Hours: {
        total: 0,
        success: 0,
        failed: 0,
        averageDuration: 0
      }
    }
  }
}

// Wrapper function to track API calls
export async function trackAPIRequest<T>(
  requestFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  try {
    const result = await requestFn()
    const duration = performance.now() - startTime
    trackAPICall(duration, true)
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    trackAPICall(duration, false)
    throw error
  }
}

export interface ApiErrorResponse {
  error: string
  details?: string
  code?: string
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
            details: API_ERRORS.rateLimit,
            code: 'RATE_LIMIT'
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
          errorResponse = axiosError.response.data as ApiErrorResponse || {
            error: 'Unknown Error',
            details: API_ERRORS.unknown
          }
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

  return errorResponse
}

export function createApiClient(type: 'search' | 'generate') {
  return axios.create({
    timeout: API_TIMEOUT[type],
    headers: {
      'Content-Type': 'application/json'
    }
  })
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