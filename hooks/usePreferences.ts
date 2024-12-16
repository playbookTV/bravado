import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ContentType, ContentTone, ContentLength } from '../types/content'

interface UserPreferences {
  id: string
  user_id: string
  default_tone: ContentTone
  default_length: ContentLength
  default_content_type: ContentType
  theme: string
  created_at: string
  updated_at: string
}

interface UpdatePreferencesData {
  default_tone?: ContentTone
  default_length?: ContentLength
  default_content_type?: ContentType
  theme?: string
}

export function usePreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchPreferences()
    }
  }, [user])

  const fetchPreferences = async () => {
    if (!user) {
      setError('User must be authenticated to fetch preferences')
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No preferences found, create default preferences
          return createDefaultPreferences()
        }
        throw fetchError
      }

      setPreferences(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultPreferences = async () => {
    if (!user) return

    const defaultPreferences = {
      user_id: user.id,
      default_tone: 'formal' as ContentTone,
      default_length: 'medium' as ContentLength,
      default_content_type: 'blog' as ContentType,
      theme: 'system',
    }

    try {
      const { data, error: createError } = await supabase
        .from('user_preferences')
        .insert([defaultPreferences])
        .select()
        .single()

      if (createError) throw createError

      setPreferences(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default preferences')
    }
  }

  const updatePreferences = async (updates: UpdatePreferencesData): Promise<boolean> => {
    if (!user || !preferences) {
      setError('User must be authenticated and preferences must exist to update')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      setPreferences(data)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  }
} 