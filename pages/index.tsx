import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import { ContentType, ContentTone, ContentLength, SearchResult, GeneratedContent } from '../types/content'
import { ErrorBoundary } from '../components/ErrorBoundary'
import ContentGenerator from '../components/ContentGenerator'
import SearchResults from '../components/SearchResults'
import { ToastContainer } from '../components/Toast'
import { useToast } from '../utils/useToast'
import PrivacyNotice from '../components/PrivacyNotice'
import { API_TIMEOUT } from '../utils/api'

export default function Home() {
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [contentSettings, setContentSettings] = useState({
    type: 'blog' as ContentType,
    tone: 'casual' as ContentTone,
    length: 'medium' as ContentLength,
  })
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true)
  const { toasts, removeToast, success, error: showError, info } = useToast()

  // Handle timeouts
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isSearching) {
      timer = setTimeout(() => {
        setIsSearching(false)
        showError('Search request timed out. Please try again.')
      }, API_TIMEOUT.search)
    }
    return () => clearTimeout(timer)
  }, [isSearching, showError])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isGenerating) {
      timer = setTimeout(() => {
        setIsGenerating(false)
        showError('Content generation timed out. Please try again.')
      }, API_TIMEOUT.generate)
    }
    return () => clearTimeout(timer)
  }, [isGenerating, showError])

  const handleResultSelect = (index: number) => {
    setSearchResults(results => 
      results.map((result, i) => ({
        ...result,
        selected: i === index ? !result.selected : result.selected,
      }))
    )
  }

  const handleGenerate = async () => {
    const selectedResults = searchResults.filter(result => result.selected)
    if (selectedResults.length === 0) {
      showError('Please select at least one search result')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sources: selectedResults,
          settings: contentSettings,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate content')
      }

      if (!data.html || typeof data.html !== 'string') {
        throw new Error('Invalid response format from server')
      }

      // Generate a unique ID for the content
      const contentId = Date.now().toString(36) + Math.random().toString(36).substring(2)
      
      // Save the content to localStorage
      localStorage.setItem(`content-${contentId}`, JSON.stringify(data))
      
      // Redirect to the content page
      success('Content generated successfully')
      router.push(`/content/${contentId}`)
    } catch (error: any) {
      console.error('Content generation failed:', error)
      showError(error.message || 'Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrivacyAccept = () => {
    setShowPrivacyNotice(false)
    info('You can always review our privacy policy in the footer')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ErrorBoundary>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        {showPrivacyNotice && (
          <PrivacyNotice
            onAccept={handlePrivacyAccept}
            onLearnMore={() => window.open('/privacy', '_blank')}
          />
        )}
        
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Search Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Bravado</h1>
              <ContentGenerator
                setSearchResults={setSearchResults}
                setIsLoading={setIsSearching}
                setContentSettings={setContentSettings}
                onError={showError}
              />
            </section>

            {/* Search Results */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <div className="loading-spinner dark:border-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {searchResults.length > 0 && !isSearching && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Search Results</h2>
                  <button
                    onClick={handleGenerate}
                    disabled={!searchResults.some(r => r.selected) || isGenerating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Content'}
                  </button>
                </div>
                <SearchResults
                  results={searchResults}
                  onSelect={handleResultSelect}
                />
              </section>
            )}
          </motion.div>
        </main>
      </ErrorBoundary>
    </div>
  )
} 