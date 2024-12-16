import { useState, useEffect } from 'react'
import { useCollaboration } from '../../hooks/useCollaboration'
import { useToast } from '../../utils/useToast'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2, History, ArrowLeft, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { cn } from '../../utils/cn'

interface VersionHistoryProps {
  draftId: string
  currentContent: string
  onRestore: (content: string) => void
}

interface Version {
  id: string
  version_number: number
  content: string
  metadata: Record<string, any>
  created_at: string
  user?: {
    email: string
    avatar_url?: string
  }
}

export default function VersionHistory({ draftId, currentContent, onRestore }: VersionHistoryProps) {
  const { getVersions, getVersion, loading } = useCollaboration(draftId)
  const { error: showError } = useToast()
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [draftId])

  const fetchVersions = async () => {
    try {
      const data = await getVersions()
      setVersions(data)
    } catch (error) {
      console.error('Failed to fetch versions:', error)
      showError('Failed to load version history')
    }
  }

  const handleSelectVersion = async (version: Version) => {
    setSelectedVersion(version)
    setIsComparing(true)
  }

  const handleRestore = () => {
    if (!selectedVersion) return
    setIsRestoring(true)
    try {
      onRestore(selectedVersion.content)
      setIsComparing(false)
      setSelectedVersion(null)
    } catch (error) {
      console.error('Failed to restore version:', error)
      showError('Failed to restore version')
    } finally {
      setIsRestoring(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const getTimeDifference = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    return 'Just now'
  }

  if (loading && !versions.length) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
        </CardTitle>
        <CardDescription>
          View and restore previous versions of this draft
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {versions.length > 0 ? (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-colors',
                    selectedVersion?.id === version.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  )}
                  onClick={() => handleSelectVersion(version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={version.user?.avatar_url} />
                        <AvatarFallback>
                          {version.user?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Version {version.version_number}</p>
                        <p className="text-sm text-gray-500">
                          by {version.user?.email} • {getTimeDifference(version.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(version.created_at)}
                    </div>
                  </div>
                  {version.metadata.wordCount && (
                    <div className="mt-2 text-sm text-gray-500">
                      {version.metadata.wordCount} words
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No version history available</p>
              <p className="text-sm">Changes will be tracked as you edit the draft</p>
            </div>
          )}
        </ScrollArea>

        <Dialog open={isComparing} onOpenChange={setIsComparing}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Version {selectedVersion?.version_number} •{' '}
                {formatDate(selectedVersion?.created_at || '')}
              </DialogTitle>
              <DialogDescription>
                Compare this version with the current content
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-2">Previous Version</div>
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 overflow-auto max-h-[500px]">
                  <div dangerouslySetInnerHTML={{ __html: selectedVersion?.content || '' }} />
                </div>
              </div>
              <div>
                <div className="font-medium mb-2">Current Version</div>
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 overflow-auto max-h-[500px]">
                  <div dangerouslySetInnerHTML={{ __html: currentContent }} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComparing(false)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleRestore} disabled={isRestoring}>
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Restore This Version
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 