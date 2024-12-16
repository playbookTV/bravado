import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface PublishingPlatform {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  config: {
    api_endpoint: string
    scopes?: string[]
    content_types: string[]
  }
  created_at: string
}

interface PlatformConnection {
  id: string
  user_id: string
  platform_id: string
  platform_user_id: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  metadata: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  platform?: PublishingPlatform
}

interface Publication {
  id: string
  draft_id: string
  connection_id: string
  platform_post_id: string | null
  platform_post_url: string | null
  status: 'pending' | 'published' | 'failed'
  error_message: string | null
  metadata: Record<string, any>
  scheduled_for: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  connection?: PlatformConnection
}

interface PublishOptions {
  title: string
  content: string
  tags?: string[]
  canonicalUrl?: string
  scheduledFor?: Date
  metadata?: Record<string, any>
}

export function usePublishing() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPlatforms = async (): Promise<PublishingPlatform[]> => {
    if (!user) {
      setError('User must be authenticated to fetch platforms')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data: platforms, error: fetchError } = await supabase
        .from('publishing_platforms')
        .select('*')
        .eq('enabled', true)
        .order('name')

      if (fetchError) throw fetchError

      return platforms || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch platforms')
      return []
    } finally {
      setLoading(false)
    }
  }

  const getConnections = async (): Promise<PlatformConnection[]> => {
    if (!user) {
      setError('User must be authenticated to fetch connections')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data: connections, error: fetchError } = await supabase
        .from('user_publishing_connections')
        .select(`
          *,
          platform:publishing_platforms (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return connections || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connections')
      return []
    } finally {
      setLoading(false)
    }
  }

  const createConnection = async (
    platformId: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number,
    metadata?: Record<string, any>
  ): Promise<PlatformConnection | null> => {
    if (!user) {
      setError('User must be authenticated to create connection')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null

      const { data: connection, error: createError } = await supabase
        .from('user_publishing_connections')
        .insert([
          {
            user_id: user.id,
            platform_id: platformId,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: expiresAt,
            metadata: metadata || {},
          },
        ])
        .select(`
          *,
          platform:publishing_platforms (*)
        `)
        .single()

      if (createError) throw createError

      return connection
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateConnection = async (
    connectionId: string,
    updates: {
      access_token?: string
      refresh_token?: string
      token_expires_at?: string | null
      metadata?: Record<string, any>
    }
  ): Promise<PlatformConnection | null> => {
    if (!user) {
      setError('User must be authenticated to update connection')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: connection, error: updateError } = await supabase
        .from('user_publishing_connections')
        .update(updates)
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .select(`
          *,
          platform:publishing_platforms (*)
        `)
        .single()

      if (updateError) throw updateError

      return connection
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update connection')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteConnection = async (connectionId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to delete connection')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('user_publishing_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection')
      return false
    } finally {
      setLoading(false)
    }
  }

  const getPublications = async (draftId: string): Promise<Publication[]> => {
    if (!user) {
      setError('User must be authenticated to fetch publications')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data: publications, error: fetchError } = await supabase
        .from('draft_publications')
        .select(`
          *,
          connection:user_publishing_connections (
            *,
            platform:publishing_platforms (*)
          )
        `)
        .eq('draft_id', draftId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return publications || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch publications')
      return []
    } finally {
      setLoading(false)
    }
  }

  const publishDraft = async (
    draftId: string,
    connectionId: string,
    options: PublishOptions
  ): Promise<Publication | null> => {
    if (!user) {
      setError('User must be authenticated to publish draft')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: publication, error: createError } = await supabase
        .from('draft_publications')
        .insert([
          {
            draft_id: draftId,
            connection_id: connectionId,
            status: 'pending',
            metadata: {
              title: options.title,
              content: options.content,
              tags: options.tags,
              canonical_url: options.canonicalUrl,
              ...options.metadata,
            },
            scheduled_for: options.scheduledFor?.toISOString(),
          },
        ])
        .select(`
          *,
          connection:user_publishing_connections (
            *,
            platform:publishing_platforms (*)
          )
        `)
        .single()

      if (createError) throw createError

      // In a real app, you would trigger a background job here to handle the actual publishing
      // For now, we'll just return the pending publication
      return publication
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish draft')
      return null
    } finally {
      setLoading(false)
    }
  }

  const cancelPublication = async (publicationId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to cancel publication')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('draft_publications')
        .delete()
        .eq('id', publicationId)
        .eq('status', 'pending')

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel publication')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    getPlatforms,
    getConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    getPublications,
    publishDraft,
    cancelPublication,
    loading,
    error,
  }
} 