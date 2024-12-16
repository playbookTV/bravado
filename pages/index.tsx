import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { SearchResult, ContentType, ContentTone, ContentLength } from '../types/content'
import ContentGenerator from '../components/ContentGenerator'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Loader2 } from 'lucide-react'
import axios from 'axios'
import { useDrafts } from '../hooks/useDrafts'
import { usePreferences } from '../hooks/usePreferences'
import { useToast } from '../utils/useToast'
import AuthenticatedLayout from '../components/layout/AuthenticatedLayout'

export default function Home() {
  const router = useRouter()
  const { createDraft } = useDrafts()
  const { preferences } = usePreferences()
  const { error: showError } = useToast()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [contentSettings, setContentSettings] = useState<{
    type: ContentType
    tone: ContentTone
    length: ContentLength
  } | null>(() => ({
    type: (preferences?.default_content_type as ContentType) || 'blog',
    tone: (preferences?.default_tone as ContentTone) || 'formal',
    length: (preferences?.default_length as ContentLength) || 'medium',
  }))

  const handleGenerateContent = async () => {
    if (!searchResults.length || !contentSettings || isGenerating) return;

    try {
      setIsGenerating(true);
      const selectedSources = searchResults.filter(result => result.selected);
      
      if (selectedSources.length === 0) {
        throw new Error('Please select at least one source');
      }

      const response = await axios.post('/api/generate', {
        sources: selectedSources,
        settings: contentSettings
      });

      // Create a new draft with the generated content
      const draft = await createDraft({
        title: selectedSources[0].title,
        content: response.data.html,
        content_type: contentSettings.type,
        tone: contentSettings.tone,
        length: contentSettings.length,
        metadata: {
          sources: selectedSources,
          wordCount: response.data.metadata.wordCount,
          generatedAt: new Date().toISOString(),
        },
      });

      if (!draft) {
        throw new Error('Failed to save draft');
      }

      // Use replace instead of push to prevent back navigation to generation state
      await router.replace(`/content/${draft.id}`);
    } catch (error: any) {
      console.error('Content generation failed:', error);
      showError(error.message || 'Failed to generate content');
      setIsGenerating(false);
    }
  };

  const toggleResultSelection = (index: number) => {
    setSearchResults(prev => 
      prev.map((result, i) => 
        i === index ? { ...result, selected: !result.selected } : result
      )
    )
  }

  return (
    <AuthenticatedLayout>
      <Head>
        <title>Content Generator - Bravado</title>
        <meta name="description" content="AI-powered content generation tool" />
      </Head>

      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.main
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8 space-y-8"
          >
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ContentGenerator
                setSearchResults={setSearchResults}
                setIsLoading={setIsLoading}
                setContentSettings={setContentSettings}
                defaultSettings={contentSettings}
              />
            </motion.div>

            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold">Search Results</h2>
                <div className="grid gap-4">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.url}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${
                        result.selected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700'
                      } cursor-pointer hover:border-primary transition-colors`}
                      onClick={() => toggleResultSelection(index)}
                    >
                      <h3 className="font-semibold mb-2">{result.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {result.snippet}
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        {result.meta.publishedDate && (
                          <span className="mr-4">
                            Published: {new Date(result.meta.publishedDate).toLocaleDateString()}
                          </span>
                        )}
                        <span>Language: {result.meta.language}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-end"
                >
                  <button
                    onClick={handleGenerateContent}
                    disabled={isGenerating || !searchResults.some(r => r.selected)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Content'
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.main>
        </AnimatePresence>
      </ErrorBoundary>
    </AuthenticatedLayout>
  )
} 