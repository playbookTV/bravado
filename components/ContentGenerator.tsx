import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { ContentType, ContentTone, ContentLength, SearchResult } from '../types/content'
import SearchFilters from './SearchFilters'

interface ContentGeneratorProps {
  setSearchResults: (results: SearchResult[]) => void
  setIsLoading: (loading: boolean) => void
  setContentSettings: (settings: { type: ContentType; tone: ContentTone; length: ContentLength }) => void
}

export default function ContentGenerator({ 
  setSearchResults, 
  setIsLoading,
  setContentSettings 
}: ContentGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState<ContentType>('blog')
  const [tone, setTone] = useState<ContentTone>('formal')
  const [length, setLength] = useState<ContentLength>('medium')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [filters, setFilters] = useState({
    timeRange: 'any',
    language: 'en',
    safeSearch: 'moderate',
    resultCount: 5,
  })

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTopic(value)
    setError(null)
  }

  const handleSearch = async (searchTopic: string = topic) => {
    const trimmedTopic = searchTopic.trim()
    if (!trimmedTopic) {
      setError('Please enter a search topic')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate filters
      const validatedFilters = {
        resultCount: Math.min(Math.max(1, Number(filters.resultCount) || 5), 20),
        language: filters.language || 'en',
        safeSearch: filters.safeSearch || 'moderate',
        timeRange: filters.timeRange,
      }

      const response = await axios.post('/api/search', {
        query: trimmedTopic,
        filters: validatedFilters,
      })
      
      if (response.data.error) {
        throw new Error(response.data.details || response.data.error)
      }
      
      if (!response.data.results || !Array.isArray(response.data.results)) {
        throw new Error('Invalid search results format')
      }

      setSearchResults(response.data.results)
      setContentSettings({ type: contentType, tone, length })
    } catch (error: any) {
      console.error('Search failed:', error)
      let errorMessage = 'Failed to perform search'
      
      if (axios.isAxiosError(error)) {
        const responseError = error.response?.data?.details || error.response?.data?.error
        if (responseError) {
          errorMessage = responseError
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Search request timed out. Please try again.'
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid search request. Please try different search terms.'
        } else if (error.response?.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.'
        } else if (error.message) {
          errorMessage = error.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="space-y-6">
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <div className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={topic}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your topic..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="blog">Blog Post</option>
              <option value="social">Social Media</option>
              <option value="seo">SEO Content</option>
            </select>

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ContentTone)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="witty">Witty</option>
              <option value="persuasive">Persuasive</option>
            </select>

            <select
              value={length}
              onChange={(e) => setLength(e.target.value as ContentLength)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 text-sm text-red-600 bg-red-50 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <button
            onClick={() => handleSearch()}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Generate Content
          </button>
        </div>
      </div>
    </div>
  )
} 