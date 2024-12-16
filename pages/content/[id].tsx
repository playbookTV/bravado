import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { GeneratedContent } from '../../types/content'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import ExportOptions from '../../components/ExportOptions'
import { useToast } from '../../utils/useToast'
import { useDrafts } from '../../hooks/useDrafts'
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout'
import CollaboratorManager from '../../components/collaboration/CollaboratorManager'
import Comments from '../../components/collaboration/Comments'
import VersionHistory from '../../components/collaboration/VersionHistory'
import ShareDraft from '../../components/collaboration/ShareDraft'
import Link from 'next/link'
import { ArrowLeftIcon, Loader2, Save, Users, MessageSquare, History, Share2 } from 'lucide-react'
import Head from 'next/head'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Alert, AlertDescription } from '../../components/ui/alert'
import PlatformConnections from '../../components/publishing/PlatformConnections'
import ConnectPlatform from '../../components/publishing/ConnectPlatform'
import PublishDraft from '../../components/publishing/PublishDraft'

// Import ContentEditor dynamically with SSR disabled
const ContentEditor = dynamic(
  () => import('../../components/ContentEditor'),
  { ssr: false }
)

export default function ContentPage() {
  const router = useRouter()
  const { id } = router.query
  const { getDraft, updateDraft } = useDrafts()
  const { toasts, removeToast, success, error: showError } = useToast()
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState('editor')

  useEffect(() => {
    if (router.isReady && id) {
      fetchDraft()
    }
  }, [router.isReady, id])

  const fetchDraft = async () => {
    try {
      const draft = await getDraft(id as string)
      if (draft) {
        setContent({
          html: draft.content,
          text: draft.content.replace(/<[^>]*>/g, ''),
          metadata: {
              wordCount: draft.metadata.wordCount || 0,
              type: draft.content_type,
              tone: draft.tone,
              length: draft.length,
              title: ''
          },
        })
      } else {
        showError('Draft not found')
        if (!isLoading) {
          await router.replace('/dashboard')
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
      showError('Failed to load draft')
      if (!isLoading) {
        await router.replace('/dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleContentChange = async (html: string) => {
    if (!content || !id) return

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

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      handleSave(html)
    }, 1000) // Auto-save after 1 second of no changes

    setAutoSaveTimeout(timeout)
  }

  const handleSave = async (html?: string) => {
    if (!content || !id) return

    setIsSaving(true)
    try {
      const contentToSave = html || content.html
      const draft = await updateDraft(id as string, {
        content: contentToSave,
        metadata: {
          ...content.metadata,
          wordCount: contentToSave.replace(/<[^>]*>/g, '').trim().split(/\s+/).length,
          lastSaved: new Date().toISOString(),
        },
      })

      if (draft) {
        success('Draft saved successfully')
      } else {
        throw new Error('Failed to save draft')
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
      showError('Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestoreVersion = (versionContent: string) => {
    handleContentChange(versionContent)
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!content) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Draft Not Found</h1>
          <Link 
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Head>
        <title>Edit Draft - Bravado</title>
        <meta name="description" content="Edit your content draft" />
      </Head>

      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.main
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between"
              >
                <Link 
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Dashboard
                </Link>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>

                  <ExportOptions
                    content={content.html}
                    title={`bravado-${content.metadata.type}-${id}`}
                  />
                </div>
              </motion.div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="editor" className="flex items-center gap-2">
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="collaborators" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Collaborators
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="publish" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Publish
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="mb-4">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Draft</h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {content.metadata.wordCount} words • {content.metadata.type} • {content.metadata.tone} tone
                      </p>
                    </div>

                    <ContentEditor
                      initialContent={content.html}
                      onChange={handleContentChange}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="collaborators" className="mt-6 space-y-6">
                  <CollaboratorManager draftId={id as string} />
                  <ShareDraft draftId={id as string} />
                </TabsContent>

                <TabsContent value="comments" className="mt-6">
                  <Comments draftId={id as string} />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <VersionHistory
                    draftId={id as string}
                    currentContent={content.html}
                    onRestore={handleRestoreVersion}
                  />
                </TabsContent>

                <TabsContent value="publish" className="mt-6 space-y-6">
                  <PlatformConnections onConnect={() => setActiveTab('connect')} />
                  <PublishDraft
                    draftId={id as string}
                    title={content.metadata.title || 'Untitled Draft'}
                    content={content.html}
                    onConnect={() => setActiveTab('connect')}
                  />
                </TabsContent>

                <TabsContent value="connect" className="mt-6">
                  <ConnectPlatform
                    onConnect={(platformId) => {
                      // In a real app, this would handle the OAuth callback
                      success('Platform connected successfully')
                      setActiveTab('publish')
                    }}
                    onCancel={() => setActiveTab('publish')}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </motion.main>
        </AnimatePresence>
      </ErrorBoundary>
    </AuthenticatedLayout>
  )
} 