import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { GeneratedContent, ContentType, ContentTone, ContentLength } from '../../types/content'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import ExportOptions from '../../components/ExportOptions'
import { useToast } from '../../utils/useToast'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

// Import ContentEditor dynamically with SSR disabled
const ContentEditor = dynamic(
  () => import('../../components/ContentEditor'),
  { ssr: false }
)

export default function ContentPage() {
  const router = useRouter()
  const { id } = router.query
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toasts, removeToast, success, error: showError } = useToast()

  useEffect(() => {
    if (router.isReady && id) {
      // In a real app, we would fetch the content from an API
      // For now, we'll get it from localStorage
      try {
        const savedContent = localStorage.getItem(`content-${id}`)
        if (savedContent) {
          setContent(JSON.parse(savedContent))
        } else {
          showError('Content not found')
          router.push('/')
        }
      } catch (error) {
        console.error('Failed to load content:', error)
        showError('Failed to load content')
      } finally {
        setIsLoading(false)
      }
    }
  }, [router.isReady, id, router, showError])

  const handleContentChange = (html: string) => {
    if (!content) return

    const updatedContent = {
      ...content,
      html,
      text: html.replace(/<[^>]*>/g, ''),
      metadata: {
        ...content.metadata,
        wordCount: html.replace(/<[^>]*>/g, '').trim().split(/\s+/).length,
      },
    }

    setContent(updatedContent)
    
    // Save to localStorage
    try {
      localStorage.setItem(`content-${id}`, JSON.stringify(updatedContent))
      success('Content saved')
    } catch (error) {
      console.error('Failed to save content:', error)
      showError('Failed to save content')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="loading-spinner dark:border-white" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Content Not Found</h1>
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ErrorBoundary>
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="flex items-center justify-between">
              <Link 
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Search
              </Link>
              <ExportOptions
                content={content.html}
                title={`bravado-${content.metadata.type}-${id}`}
              />
            </div>

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Content</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {content.metadata.wordCount} words • {content.metadata.type} • {content.metadata.tone} tone
                  </p>
                </div>
              </div>

              <ContentEditor
                initialContent={content.html}
                onChange={handleContentChange}
              />
            </section>
          </motion.div>
        </main>
      </ErrorBoundary>
    </div>
  )
} 