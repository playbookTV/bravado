import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit, withCache } from '../../utils/rateLimit'
import { createApiClient, handleApiError, validateBraveSearchResponse, trackAPIRequest } from '../../utils/api'
import { SearchFilters, SearchResponse } from '../../types/content'

const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY!
const BRAVE_SEARCH_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search'

interface ValidatedFilters {
  count: number
  search_lang: string
  safesearch: 'strict' | 'moderate' | 'off'
  freshness?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query, filters } = req.body as {
      query: string
      filters?: SearchFilters
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'Query must be a non-empty string'
      })
    }

    if (!BRAVE_SEARCH_API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Brave Search API key is not configured'
      })
    }

    // Handle search request with rate limiting
    return await withRateLimit(req, res, async () => {
      return await trackAPIRequest(async () => {
        try {
          // Validate and sanitize filters
          const validatedFilters: ValidatedFilters = {
            count: Math.min(Math.max(1, Number(filters?.resultCount) || 5), 20),
            search_lang: filters?.language || 'en',
            safesearch: filters?.safeSearch || 'moderate',
          }

          if (filters?.timeRange && filters.timeRange !== 'any') {
            validatedFilters.freshness = filters.timeRange
          }

          // Create API client with timeout
          const apiClient = createApiClient('search')
          
          const response = await apiClient.get(BRAVE_SEARCH_ENDPOINT, {
            headers: {
              'X-Subscription-Token': BRAVE_SEARCH_API_KEY,
              'Accept': 'application/json',
            },
            params: {
              q: query.trim(),
              ...validatedFilters
            }
          })

          const data = response.data

          // Check if the response has the expected structure
          if (!data || !data.web || !Array.isArray(data.web.results)) {
            throw new Error('Invalid response structure from Brave Search API')
          }

          // Extract and format the search results
          const results = data.web.results.map((result: any) => ({
            title: result.title || '',
            snippet: result.description || '',
            url: result.url || '',
            selected: false,
            meta: {
              language: result.language || 'en',
              familyFriendly: result.family_friendly ?? true,
              publishedDate: result.published_date || null,
            }
          }))

          // Add search metadata
          const searchResponse: SearchResponse = {
            results,
            metadata: {
              totalResults: data.web.total || 0,
              queryTime: data.time || 0,
              language: data.language || 'en',
            }
          }

          return searchResponse
        } catch (error) {
          console.error('Search API error:', error)
          throw error
        }
      }).then(searchResponse => {
        return res.status(200).json(searchResponse)
      }).catch(async error => {
        const apiError = await handleApiError(error)
        return res.status(apiError.code === 'RATE_LIMIT' ? 429 : 500).json(apiError)
      })
    }, 'search')
  } catch (error) {
    console.error('Search handler error:', error)
    const apiError = await handleApiError(error)
    return res.status(apiError.code === 'RATE_LIMIT' ? 429 : 500).json(apiError)
  }
} 