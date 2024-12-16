import { useState, useEffect } from 'react'
import { useCollaboration } from '../../hooks/useCollaboration'
import { useToast } from '../../utils/useToast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Loader2, Link as LinkIcon, Copy, Trash2, Share2 } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ShareDraftProps {
  draftId: string
}

interface ShareLink {
  id: string
  access_token: string
  expires_at: string | null
  created_at: string
  is_active: boolean
}

export default function ShareDraft({ draftId }: ShareDraftProps) {
  const { createShareLink, getShareLinks, deactivateShareLink, loading } = useCollaboration(draftId)
  const { error: showError, success } = useToast()
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState<string | null>(null)
  const [expirationOption, setExpirationOption] = useState<string>('never')

  useEffect(() => {
    fetchShareLinks()
  }, [draftId])

  const fetchShareLinks = async () => {
    try {
      const data = await getShareLinks()
      setShareLinks(data)
    } catch (error) {
      console.error('Failed to fetch share links:', error)
      showError('Failed to load share links')
    }
  }

  const handleCreateLink = async () => {
    try {
      setIsCreating(true)
      const expiresIn = getExpirationTime(expirationOption)
      const link = await createShareLink(draftId, expiresIn)
      if (link) {
        setShareLinks(prev => [...prev, link])
        success('Share link created successfully')
      }
    } catch (error) {
      console.error('Failed to create share link:', error)
      showError('Failed to create share link')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeactivateLink = async (linkId: string) => {
    try {
      setIsDeactivating(linkId)
      const success = await deactivateShareLink(linkId)
      if (success) {
        setShareLinks(prev =>
          prev.map(link =>
            link.id === linkId ? { ...link, is_active: false } : link
          )
        )
        success('Share link deactivated')
      }
    } catch (error) {
      console.error('Failed to deactivate share link:', error)
      showError('Failed to deactivate share link')
    } finally {
      setIsDeactivating(null)
    }
  }

  const handleCopyLink = async (token: string) => {
    const shareUrl = `${window.location.origin}/shared/${token}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      success('Link copied to clipboard')
    } catch (error) {
      console.error('Failed to copy link:', error)
      showError('Failed to copy link')
    }
  }

  const getExpirationTime = (option: string): number | undefined => {
    switch (option) {
      case '1hour':
        return 60 * 60 * 1000 // 1 hour in milliseconds
      case '1day':
        return 24 * 60 * 60 * 1000 // 1 day in milliseconds
      case '7days':
        return 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      case '30days':
        return 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      default:
        return undefined // No expiration
    }
  }

  const formatExpirationDate = (date: string | null) => {
    if (!date) return 'Never expires'
    return `Expires on ${new Date(date).toLocaleString()}`
  }

  const isExpired = (date: string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  if (loading && !shareLinks.length) {
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
          <Share2 className="h-5 w-5" />
          Share Draft
        </CardTitle>
        <CardDescription>
          Create and manage sharing links for this draft
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={expirationOption}
              onValueChange={setExpirationOption}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never expires</SelectItem>
                <SelectItem value="1hour">1 hour</SelectItem>
                <SelectItem value="1day">1 day</SelectItem>
                <SelectItem value="7days">7 days</SelectItem>
                <SelectItem value="30days">30 days</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleCreateLink}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Create Share Link
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {shareLinks.map((link) => (
              <div
                key={link.id}
                className={cn(
                  'p-4 rounded-lg border',
                  (!link.is_active || isExpired(link.expires_at)) && 'opacity-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Input
                      readOnly
                      value={`${window.location.origin}/shared/${link.access_token}`}
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyLink(link.access_token)}
                      disabled={!link.is_active || isExpired(link.expires_at)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={!link.is_active}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Deactivate Share Link</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to deactivate this share link? Anyone with this link will no longer be able to access the draft.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeactivateLink(link.id)}
                            disabled={isDeactivating === link.id}
                          >
                            {isDeactivating === link.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deactivating...
                              </>
                            ) : (
                              'Deactivate'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">
                    Created {new Date(link.created_at).toLocaleString()} •{' '}
                    {formatExpirationDate(link.expires_at)}
                  </span>
                  {!link.is_active && (
                    <span className="ml-2 text-red-500">• Deactivated</span>
                  )}
                  {link.is_active && isExpired(link.expires_at) && (
                    <span className="ml-2 text-red-500">• Expired</span>
                  )}
                </div>
              </div>
            ))}

            {!shareLinks.length && (
              <div className="text-center py-6 text-gray-500">
                <p>No share links created</p>
                <p className="text-sm">Create a link to share this draft with others</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 