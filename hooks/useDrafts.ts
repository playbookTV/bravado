import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ContentType, ContentTone, ContentLength } from '../types/content'

interface Draft {
  id: string
  title: string
  content: string
  content_type: ContentType
  tone: ContentTone
  length: ContentLength
  metadata: Record<string, any>
  is_published: boolean
  version: number
  created_at: string
  updated_at: string
}

interface CreateDraftData {
  title: string
  content: string
  content_type: ContentType
  tone: ContentTone
  length: ContentLength
  metadata?: Record<string, any>
}

interface UpdateDraftData extends Partial<CreateDraftData> {
  is_published?: boolean
  version?: number
}

export function useDrafts() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDraft = async (data: CreateDraftData): Promise<Draft | null> => {
    if (!user) {
      setError('User must be authenticated to create drafts')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: draft, error: createError } = await supabase
        .from('drafts')
        .insert([
          {
            user_id: user.id,
            ...data,
            metadata: data.metadata || {},
            is_published: false,
            version: 1,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      return draft
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateDraft = async (id: string, data: UpdateDraftData): Promise<Draft | null> => {
    if (!user) {
      setError('User must be authenticated to update drafts')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: draft, error: updateError } = await supabase
        .from('drafts')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      return draft
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update draft')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getDraft = async (id: string): Promise<Draft | null> => {
    if (!user) {
      setError('User must be authenticated to get drafts')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: draft, error: fetchError } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      return draft
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch draft')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteDraft = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to delete drafts')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('drafts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    createDraft,
    updateDraft,
    getDraft,
    deleteDraft,
    loading,
    error,
  }
} 