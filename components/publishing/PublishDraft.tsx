import { useState, useEffect } from 'react'
import { usePublishing } from '../../hooks/usePublishing'
import { useToast } from '../../utils/useToast'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2, Send, Calendar, Globe, Tag, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { format } from 'date-fns'
import { cn } from '../../utils/cn'

interface PublishDraftProps {
  draftId: string
  title: string
  content: string
  onConnect?: () => void
}

export default function PublishDraft({ draftId, title, content, onConnect }: PublishDraftProps) {
  const { getConnections, getPublications, publishDraft, cancelPublication, loading } = usePublishing()
  const { error: showError, success } = useToast()
  const [connections, setConnections] = useState<any[]>([])
  const [publications, setPublications] = useState<any[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isCanceling, setIsCanceling] = useState<string | null>(null)
  const [publishDate, setPublishDate] = useState<Date | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')

  useEffect(() => {
    fetchData()
  }, [draftId])

  const fetchData = async () => {
    try {
      const [connectionsData, publicationsData] = await Promise.all([
        getConnections(),
        getPublications(draftId),
      ])
      setConnections(connectionsData)
      setPublications(publicationsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      showError('Failed to load publishing data')
    }
  }

  const handlePublish = async () => {
    if (!selectedConnection) return

    try {
      setIsPublishing(true)
      const publication = await publishDraft(draftId, selectedConnection, {
        title,
        content,
        tags,
        canonicalUrl: canonicalUrl || undefined,
        scheduledFor: publishDate,
      })

      if (publication) {
        setPublications(prev => [...prev, publication])
        success('Content scheduled for publishing')
        resetForm()
      }
    } catch (error) {
      console.error('Failed to publish draft:', error)
      showError('Failed to publish draft')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCancel = async (publicationId: string) => {
    try {
      setIsCanceling(publicationId)
      const success = await cancelPublication(publicationId)
      if (success) {
        setPublications(prev => prev.filter(p => p.id !== publicationId))
        success('Publication canceled successfully')
      }
    } catch (error) {
      console.error('Failed to cancel publication:', error)
      showError('Failed to cancel publication')
    } finally {
      setIsCanceling(null)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        setTags(prev => [...prev, newTag.trim()])
      }
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const resetForm = () => {
    setSelectedConnection(null)
    setPublishDate(null)
    setTags([])
    setCanonicalUrl('')
  }

  const getPublicationStatus = (publication: any) => {
    if (publication.status === 'published') {
      return (
        <Badge variant="default" className="bg-green-500">
          Published
        </Badge>
      )
    }
    if (publication.status === 'failed') {
      return (
        <Badge variant="destructive">
          Failed
        </Badge>
      )
    }
    if (publication.scheduled_for) {
      return (
        <Badge variant="secondary">
          Scheduled
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        Pending
      </Badge>
    )
  }

  if (loading && !connections.length && !publications.length) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish Content</CardTitle>
        <CardDescription>
          Publish your content to connected platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Platform</label>
            {connections.length > 0 ? (
              <Select
                value={selectedConnection || ''}
                onValueChange={setSelectedConnection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a platform" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`/icons/${connection.platform?.icon}.svg`} />
                          <AvatarFallback>
                            {connection.platform?.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {connection.platform?.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-4 border rounded-lg">
                <p className="text-sm text-gray-500 mb-2">
                  No platforms connected
                </p>
                <Button onClick={onConnect}>
                  Connect Platform
                </Button>
              </div>
            )}
          </div>

          {selectedConnection && (
            <>
              {/* Schedule */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule (Optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !publishDate && 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {publishDate ? format(publishDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={publishDate}
                      onSelect={setPublishDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (Optional)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Add tags (press Enter)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
              </div>

              {/* Canonical URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Canonical URL (Optional)</label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Enter canonical URL"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Publish Button */}
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {publishDate ? 'Schedule Publication' : 'Publish Now'}
                  </>
                )}
              </Button>
            </>
          )}

          {/* Publications List */}
          {publications.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="font-medium">Publication History</h3>
              {publications.map((publication) => (
                <div
                  key={publication.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`/icons/${publication.connection?.platform?.icon}.svg`} />
                      <AvatarFallback>
                        {publication.connection?.platform?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {publication.connection?.platform?.name}
                        </p>
                        {getPublicationStatus(publication)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {publication.scheduled_for
                          ? `Scheduled for ${format(new Date(publication.scheduled_for), 'PPP')}`
                          : publication.published_at
                          ? `Published on ${format(new Date(publication.published_at), 'PPP')}`
                          : 'Processing...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {publication.platform_post_url && (
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <a
                          href={publication.platform_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {(publication.status === 'pending' || publication.scheduled_for) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancel Publication</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to cancel this publication? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={() => handleCancel(publication.id)}
                              disabled={isCanceling === publication.id}
                            >
                              {isCanceling === publication.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Canceling...
                                </>
                              ) : (
                                'Cancel Publication'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 