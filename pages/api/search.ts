import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit } from '../../utils/rateLimit'
import axios from 'axios'

const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY!
const BRAVE_SEARCH_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search'

interface SearchFilters {
  timeRange?: string
  language?: string
  safeSearch?: string
  resultCount?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set JSON content type header
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

    // Handle search request
    return await withRateLimit(req, res, async () => {
      try {
        // Validate and sanitize filters
        const validatedFilters = {
          count: Math.min(Math.max(1, Number(filters?.resultCount) || 5), 20), // Between 1 and 20
          search_lang: filters?.language || 'en',
          safesearch: filters?.safeSearch || 'moderate',
        }

        if (filters?.timeRange && filters.timeRange !== 'any') {
          validatedFilters['freshness'] = filters.timeRange
        }

        const response = await axios({
          method: 'get',
          url: BRAVE_SEARCH_ENDPOINT,
          headers: {
            'X-Subscription-Token': BRAVE_SEARCH_API_KEY,
            'Accept': 'application/json',
          },
          params: {
            q: query.trim(),
            ...validatedFilters
          },
          timeout: 10000,
        })

        if (!response.data || !response.data.web) {
          throw new Error('Invalid response from Brave Search API')
        }

        // Extract and format the search results
        const results = response.data.web.results?.map((result: any) => ({
          title: result.title || '',
          snippet: result.description || '',
          url: result.url || '',
          selected: false,
          meta: {
            language: result.language || 'en',
            familyFriendly: result.family_friendly ?? true,
            publishedDate: result.published_date || null,
          }
        })) || []

        // Add search metadata
        const searchMetadata = {
          totalResults: response.data.total || 0,
          queryTime: response.data.time || 0,
          language: response.data.language || 'en',
        }

        return res.status(200).json({
          results,
          metadata: searchMetadata,
        })
      } catch (error: any) {
        console.error('Search API error:', error.response?.data || error.message)
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            return res.status(408).json({ 
              error: 'Request timeout',
              details: 'The search request timed out'
            })
          }
          if (error.response?.status === 429) {
            return res.status(429).json({
              error: 'Rate limit exceeded',
              details: 'Too many requests. Please try again later.'
            })
          }
          if (error.response?.status === 400) {
            return res.status(400).json({
              error: 'Invalid request',
              details: 'The request format was invalid. Please check your search terms.'
            })
          }
          if (error.response?.status === 401 || error.response?.status === 403) {
            return res.status(error.response.status).json({
              error: 'API authentication error',
              details: 'Invalid or expired API key'
            })
          }
          return res.status(error.response?.status || 500).json({
            error: 'Search API error',
            details: error.response?.data?.message || error.message
          })
        }
        return res.status(500).json({
          error: 'Internal server error',
          details: error.message || 'An unexpected error occurred'
        })
      }
    }, 'search')
  } catch (error: any) {
    console.error('Search API error:', error.response?.data || error.message)
    return res.status(500).json({ 
      error: 'Failed to perform search',
      details: error.response?.data?.message || error.message 
    })
  }
} 