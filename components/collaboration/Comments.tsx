import { useState, useEffect } from 'react'
import { useCollaboration } from '../../hooks/useCollaboration'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../utils/useToast'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2, MessageSquare, Check, Reply, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '../../utils/cn'

interface CommentsProps {
  draftId: string
}

interface CommentWithReplies {
  id: string
  content: string
  user_id: string
  created_at: string
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  user?: {
    email: string
    avatar_url?: string
  }
  replies?: CommentWithReplies[]
}

export default function Comments({ draftId }: CommentsProps) {
  const { user } = useAuth()
  const { getComments, addComment, updateComment, resolveComment, deleteComment, loading } = useCollaboration(draftId)
  const { error: showError, success } = useToast()
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [draftId])

  const fetchComments = async () => {
    try {
      const data = await getComments()
      // Organize comments into threads
      const threads = organizeComments(data)
      setComments(threads)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      showError('Failed to load comments')
    }
  }

  const organizeComments = (flatComments: any[]): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>()
    const rootComments: CommentWithReplies[] = []

    // First pass: create comment objects
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into threads
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)
      const comment = await addComment(newComment)
      if (comment) {
        setComments(prev => [...prev, { ...comment, replies: [] }])
        setNewComment('')
        success('Comment added successfully')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      showError('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      setIsSubmitting(true)
      const reply = await addComment(replyContent, parentId)
      if (reply) {
        setComments(prev => {
          const updated = [...prev]
          const parent = updated.find(c => c.id === parentId)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push({ ...reply, replies: [] })
          }
          return updated
        })
        setReplyContent('')
        setReplyTo(null)
        success('Reply added successfully')
      }
    } catch (error) {
      console.error('Failed to add reply:', error)
      showError('Failed to add reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolveComment = async (commentId: string) => {
    try {
      const resolved = await resolveComment(commentId)
      if (resolved) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? { ...c, resolved: true, resolved_by: user?.id, resolved_at: new Date().toISOString() }
              : c
          )
        )
        success('Comment resolved')
      }
    } catch (error) {
      console.error('Failed to resolve comment:', error)
      showError('Failed to resolve comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setIsDeleting(commentId)
      const success = await deleteComment(commentId)
      if (success) {
        setComments(prev => {
          const filtered = prev.filter(c => c.id !== commentId)
          // Also remove any replies if it's a parent comment
          return filtered.map(c => ({
            ...c,
            replies: c.replies?.filter(r => r.id !== commentId) || [],
          }))
        })
        success('Comment deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      showError('Failed to delete comment')
    } finally {
      setIsDeleting(null)
    }
  }

  const renderComment = (comment: CommentWithReplies, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        'p-4 rounded-lg border',
        isReply ? 'ml-8 mt-2' : 'mb-4',
        comment.resolved ? 'bg-gray-50 dark:bg-gray-800/50' : ''
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user?.avatar_url} />
            <AvatarFallback>
              {comment.user?.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium">{comment.user?.email}</p>
              <span className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1">{comment.content}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!comment.resolved && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleResolveComment(comment.id)}
              className="text-green-500 hover:text-green-600 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {!isReply && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-4 w-4" />
            </Button>
          )}
          {comment.user_id === user?.id && (
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
                  <DialogTitle>Delete Comment</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this comment? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={isDeleting === comment.id}
                  >
                    {isDeleting === comment.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {comment.resolved && (
        <div className="mt-2 text-sm text-gray-500">
          Resolved by {comment.resolved_by === user?.id ? 'you' : 'another user'} on{' '}
          {new Date(comment.resolved_at!).toLocaleString()}
        </div>
      )}

      {replyTo === comment.id && (
        <div className="mt-4 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmitReply(comment.id)}
              disabled={!replyContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Replying...
                </>
              ) : (
                'Reply'
              )}
            </Button>
          </div>
        </div>
      )}

      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  )

  if (loading && !comments.length) {
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
          <MessageSquare className="h-5 w-5" />
          Comments
        </CardTitle>
        <CardDescription>
          Discuss and collaborate on this draft
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {comments.length > 0 ? (
              comments.map((comment) => renderComment(comment))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No comments yet</p>
                <p className="text-sm">Start the discussion by adding a comment</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
} 