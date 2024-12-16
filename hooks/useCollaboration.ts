import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { nanoid } from 'nanoid'

export type CollaboratorRole = 'viewer' | 'editor' | 'admin'

interface Collaborator {
  id: string
  user_id: string
  draft_id: string
  role: CollaboratorRole
  created_at: string
  updated_at: string
  user?: {
    email: string
    avatar_url?: string
  }
}

interface Comment {
  id: string
  user_id: string
  draft_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  user?: {
    email: string
    avatar_url?: string
  }
}

interface DraftVersion {
  id: string
  draft_id: string
  user_id: string
  content: string
  metadata: Record<string, any>
  version_number: number
  created_at: string
  user?: {
    email: string
    avatar_url?: string
  }
}

interface DraftShare {
  id: string
  draft_id: string
  created_by: string
  access_token: string
  expires_at: string | null
  created_at: string
  updated_at: string
  is_active: boolean
}

export function useCollaboration(draftId?: string) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Collaborators
  const getCollaborators = async (targetDraftId = draftId): Promise<Collaborator[]> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data: collaborators, error: fetchError } = await supabase
        .from('collaborators')
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .eq('draft_id', targetDraftId)

      if (fetchError) throw fetchError

      return collaborators || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collaborators')
      return []
    } finally {
      setLoading(false)
    }
  }

  const addCollaborator = async (email: string, role: CollaboratorRole, targetDraftId = draftId): Promise<Collaborator | null> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // First, get the user ID for the email
      const { data: users, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single()

      if (userError) throw userError
      if (!users) throw new Error('User not found')

      const { data: collaborator, error: createError } = await supabase
        .from('collaborators')
        .insert([
          {
            user_id: users.id,
            draft_id: targetDraftId,
            role,
          },
        ])
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .single()

      if (createError) throw createError

      return collaborator
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add collaborator')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateCollaborator = async (collaboratorId: string, role: CollaboratorRole): Promise<Collaborator | null> => {
    if (!user) {
      setError('User must be authenticated')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: collaborator, error: updateError } = await supabase
        .from('collaborators')
        .update({ role })
        .eq('id', collaboratorId)
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .single()

      if (updateError) throw updateError

      return collaborator
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collaborator')
      return null
    } finally {
      setLoading(false)
    }
  }

  const removeCollaborator = async (collaboratorId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', collaboratorId)

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Comments
  const getComments = async (targetDraftId = draftId): Promise<Comment[]> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data: comments, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .eq('draft_id', targetDraftId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      return comments || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
      return []
    } finally {
      setLoading(false)
    }
  }

  const addComment = async (content: string, parentId: string | null = null, targetDraftId = draftId): Promise<Comment | null> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: comment, error: createError } = await supabase
        .from('comments')
        .insert([
          {
            user_id: user.id,
            draft_id: targetDraftId,
            parent_id: parentId,
            content,
          },
        ])
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .single()

      if (createError) throw createError

      return comment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateComment = async (commentId: string, content: string): Promise<Comment | null> => {
    if (!user) {
      setError('User must be authenticated')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: comment, error: updateError } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .single()

      if (updateError) throw updateError

      return comment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment')
      return null
    } finally {
      setLoading(false)
    }
  }

  const resolveComment = async (commentId: string): Promise<Comment | null> => {
    if (!user) {
      setError('User must be authenticated')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: comment, error: updateError } = await supabase
        .from('comments')
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .single()

      if (updateError) throw updateError

      return comment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve comment')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Versions
  const getVersions = async (targetDraftId = draftId): Promise<DraftVersion[]> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data: versions, error: fetchError } = await supabase
        .from('draft_versions')
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .eq('draft_id', targetDraftId)
        .order('version_number', { ascending: false })

      if (fetchError) throw fetchError

      return versions || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch versions')
      return []
    } finally {
      setLoading(false)
    }
  }

  const getVersion = async (versionNumber: number, targetDraftId = draftId): Promise<DraftVersion | null> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: version, error: fetchError } = await supabase
        .from('draft_versions')
        .select(`
          *,
          user:auth.users (
            email,
            avatar_url
          )
        `)
        .eq('draft_id', targetDraftId)
        .eq('version_number', versionNumber)
        .single()

      if (fetchError) throw fetchError

      return version
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch version')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Sharing
  const createShareLink = async (targetDraftId = draftId, expiresIn?: number): Promise<DraftShare | null> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const accessToken = nanoid(32)
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null

      const { data: share, error: createError } = await supabase
        .from('draft_shares')
        .insert([
          {
            draft_id: targetDraftId,
            created_by: user.id,
            access_token: accessToken,
            expires_at: expiresAt,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      return share
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getShareLinks = async (targetDraftId = draftId): Promise<DraftShare[]> => {
    if (!user || !targetDraftId) {
      setError('User must be authenticated and draft ID must be provided')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data: shares, error: fetchError } = await supabase
        .from('draft_shares')
        .select('*')
        .eq('draft_id', targetDraftId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return shares || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch share links')
      return []
    } finally {
      setLoading(false)
    }
  }

  const deactivateShareLink = async (shareId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('draft_shares')
        .update({ is_active: false })
        .eq('id', shareId)
        .eq('created_by', user.id)

      if (updateError) throw updateError

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate share link')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    // Collaborators
    getCollaborators,
    addCollaborator,
    updateCollaborator,
    removeCollaborator,

    // Comments
    getComments,
    addComment,
    updateComment,
    resolveComment,
    deleteComment,

    // Versions
    getVersions,
    getVersion,

    // Sharing
    createShareLink,
    getShareLinks,
    deactivateShareLink,

    loading,
    error,
  }
} 