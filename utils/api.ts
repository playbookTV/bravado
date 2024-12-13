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

export interface ApiErrorResponse {
  error: string
  details?: string
}

export async function handleApiError(error: unknown): Promise<ApiErrorResponse> {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    
    if (error.code === 'ECONNABORTED') {
      return {
        error: 'Request Timeout',
        details: API_ERRORS.timeout
      }
    }

    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 429:
          return {
            error: 'Rate Limit Exceeded',
            details: API_ERRORS.rateLimit
          }
        case 401:
        case 403:
          return {
            error: 'Authentication Error',
            details: API_ERRORS.unauthorized
          }
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            error: 'Server Error',
            details: API_ERRORS.server
          }
        default:
          return axiosError.response.data as ApiErrorResponse
      }
    }

    if (axiosError.request) {
      return {
        error: 'Network Error',
        details: API_ERRORS.network
      }
    }
  }

  return {
    error: 'Unknown Error',
    details: API_ERRORS.unknown
  }
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