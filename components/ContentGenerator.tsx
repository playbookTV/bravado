import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { SearchResult, ContentType, ContentTone, ContentLength, SearchFilters } from '../types/content'
import axios from 'axios'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card } from './ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent } from './ui/dialog'

interface ContentGeneratorProps {
  setSearchResults: (results: SearchResult[]) => void
  setIsLoading: (loading: boolean) => void
  setContentSettings: (settings: { type: ContentType; tone: ContentTone; length: ContentLength }) => void
  onError?: (error: string) => void
}

export default function ContentGenerator({ 
  setSearchResults, 
  setIsLoading,
  setContentSettings,
  onError
}: ContentGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [contentType, setContentType] = useState<ContentType>('blog')
  const [tone, setTone] = useState<ContentTone>('formal')
  const [length, setLength] = useState<ContentLength>('medium')
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    resultCount: 5,
    language: 'en',
    safeSearch: 'moderate',
    timeRange: 'month'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value)
  }

  const handleSearch = async (searchTopic: string = topic) => {
    const trimmedTopic = searchTopic.trim()
    if (!trimmedTopic) {
      const errorMsg = 'Please enter a search topic'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsSearching(true)
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

      const { results, metadata } = response.data
      
      if (!results || !Array.isArray(results)) {
        throw new Error('Invalid search results format')
      }

      setSearchResults(results)
      setContentSettings({ type: contentType, tone, length })

      // Clear any previous errors
      setError(null)
    } catch (error: any) {
      console.error('Search failed:', error)
      let errorMessage = 'Failed to perform search'
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.details) {
          errorMessage = error.response.data.details
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
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
      onError?.(errorMessage)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
        <DialogContent className="sm:max-w-md" showClose={false}>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <h3 className="text-lg font-semibold text-center">Generating Content</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Please wait while we generate your content. This may take a few moments...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">Search Topic</Label>
            <Input
              id="topic"
              placeholder="Enter your topic..."
              value={topic}
              onChange={handleInputChange}
              disabled={isSearching || isGenerating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Content Type</Label>
              <Select
                value={contentType}
                onValueChange={(value: ContentType) => setContentType(value)}
                disabled={isSearching || isGenerating}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="seo">SEO Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tone">Writing Tone</Label>
              <Select
                value={tone}
                onValueChange={(value: ContentTone) => setTone(value)}
                disabled={isSearching || isGenerating}
              >
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="witty">Witty</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="length">Content Length</Label>
              <Select
                value={length}
                onValueChange={(value: ContentLength) => setLength(value)}
                disabled={isSearching || isGenerating}
              >
                <SelectTrigger id="length">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={() => handleSearch()} 
              disabled={isSearching || isGenerating}
              className="w-full sm:w-auto"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Start Search'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
} 