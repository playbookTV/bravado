import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { ContentType, ContentTone, ContentLength, SearchResult, GeneratedContent } from '../types/content'
import { ErrorBoundary } from '../components/ErrorBoundary'
import ContentGenerator from '../components/ContentGenerator'
import SearchResults from '../components/SearchResults'

// Import ContentEditor dynamically with SSR disabled
const ContentEditor = dynamic(
  () => import('../components/ContentEditor'),
  { ssr: false }
)

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [contentSettings, setContentSettings] = useState({
    type: 'blog' as ContentType,
    tone: 'casual' as ContentTone,
    length: 'medium' as ContentLength,
  })
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)

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
    if (selectedResults.length === 0) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: selectedResults,
          settings: contentSettings,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to generate content')
      }

      const data = await response.json()
      setGeneratedContent(data)
    } catch (error) {
      console.error('Content generation failed:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <ErrorBoundary>
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Search Section */}
            <section className="bg-white dark:bg-dark-card rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold mb-6 dark:text-white">Bravado</h1>
              <ContentGenerator
                setSearchResults={setSearchResults}
                setIsLoading={setIsSearching}
                setContentSettings={setContentSettings}
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
                  <div className="loading-spinner" />
                </motion.div>
              )}
            </AnimatePresence>

            {searchResults.length > 0 && !isSearching && (
              <section className="bg-white dark:bg-dark-card rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold dark:text-white">Search Results</h2>
                  <button
                    onClick={handleGenerate}
                    disabled={!searchResults.some(r => r.selected) || isGenerating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Generated Content */}
            {generatedContent && (
              <section className="bg-white dark:bg-dark-card rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Generated Content</h2>
                <ContentEditor
                  content={generatedContent.html}
                  onChange={(html) => setGeneratedContent(prev => prev ? { ...prev, html } : null)}
                  placeholder="Content will appear here..."
                />
              </section>
            )}
          </motion.div>
        </main>
      </ErrorBoundary>
    </div>
  )
} 