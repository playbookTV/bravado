import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface SharedDraft {
  id: string
  title: string
  content: string
  content_type: string
  tone: string
  length: string
  metadata: Record<string, any>
  user?: {
    email: string
  }
}

export default function SharedDraftPage() {
  const router = useRouter()
  const { token } = router.query
  const [draft, setDraft] = useState<SharedDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (router.isReady && token) {
      fetchSharedDraft()
    }
  }, [router.isReady, token])

  const fetchSharedDraft = async () => {
    try {
      // First, validate the share token
      const { data: shareData, error: shareError } = await supabase
        .from('draft_shares')
        .select('draft_id, expires_at, is_active')
        .eq('access_token', token)
        .single()

      if (shareError) throw new Error('Invalid share link')
      if (!shareData) throw new Error('Share link not found')
      if (!shareData.is_active) throw new Error('This share link has been deactivated')
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        throw new Error('This share link has expired')
      }

      // Then, fetch the draft content
      const { data: draftData, error: draftError } = await supabase
        .from('drafts')
        .select(`
          id,
          title,
          content,
          content_type,
          tone,
          length,
          metadata,
          user:auth.users (
            email
          )
        `)
        .eq('id', shareData.draft_id)
        .single()

      if (draftError) throw draftError
      if (!draftData) throw new Error('Draft not found')

      setDraft(draftData)
    } catch (err) {
      console.error('Failed to fetch shared draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to load shared draft')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Draft not found'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This shared draft is no longer available. The link may have expired or been deactivated.
            </p>
            <Button asChild>
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{draft.title || 'Shared Draft'} - Bravado</title>
        <meta name="description" content="View shared content draft" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">Bravado</span>
              </Link>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Shared by {draft.user?.email}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {draft.title || 'Untitled Draft'}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{draft.content_type}</span>
                <span>•</span>
                <span>{draft.tone} tone</span>
                <span>•</span>
                <span>{draft.length} length</span>
                {draft.metadata?.wordCount && (
                  <>
                    <span>•</span>
                    <span>{draft.metadata.wordCount} words</span>
                  </>
                )}
              </div>
            </div>

            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: draft.content }}
            />
          </Card>
        </motion.div>
      </main>

      <footer className="mt-8 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Powered by Bravado • AI-powered content generation platform
        </div>
      </footer>
    </div>
  )
} 