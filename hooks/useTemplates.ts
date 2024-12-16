import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ContentType, ContentTone, ContentLength } from '../types/content'

interface Template {
  id: string
  title: string
  description: string | null
  content: string
  content_type: ContentType
  tone: ContentTone
  length: ContentLength
  metadata: Record<string, any>
  is_public: boolean
  version: number
  tags: string[]
  created_at: string
  updated_at: string
  user_id: string
}

interface TemplateCategory {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface CreateTemplateData {
  title: string
  description?: string
  content: string
  content_type: ContentType
  tone: ContentTone
  length: ContentLength
  metadata?: Record<string, any>
  is_public?: boolean
  tags?: string[]
  category_ids?: string[]
}

interface UpdateTemplateData extends Partial<CreateTemplateData> {
  version?: number
}

export function useTemplates() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTemplates = async (options?: {
    categoryId?: string
    isPublic?: boolean
    searchQuery?: string
  }): Promise<Template[]> => {
    if (!user) {
      setError('User must be authenticated to fetch templates')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId)
      }

      if (options?.isPublic !== undefined) {
        query = query.eq('is_public', options.isPublic)
      }

      if (options?.searchQuery) {
        query = query.or(`title.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%`)
      }

      const { data: templates, error: fetchError } = await query

      if (fetchError) throw fetchError

      return templates || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
      return []
    } finally {
      setLoading(false)
    }
  }

  const getTemplate = async (id: string): Promise<Template | null> => {
    if (!user) {
      setError('User must be authenticated to fetch template')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return template
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch template')
      return null
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (data: CreateTemplateData): Promise<Template | null> => {
    if (!user) {
      setError('User must be authenticated to create templates')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: template, error: createError } = await supabase
        .from('templates')
        .insert([
          {
            user_id: user.id,
            ...data,
            metadata: data.metadata || {},
            is_public: data.is_public || false,
            tags: data.tags || [],
            version: 1,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // If category IDs are provided, create category assignments
      if (data.category_ids?.length) {
        const { error: assignError } = await supabase
          .from('template_category_assignments')
          .insert(
            data.category_ids.map(categoryId => ({
              template_id: template.id,
              category_id: categoryId,
            }))
          )

        if (assignError) throw assignError
      }

      return template
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateTemplate = async (id: string, data: UpdateTemplateData): Promise<Template | null> => {
    if (!user) {
      setError('User must be authenticated to update templates')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: template, error: updateError } = await supabase
        .from('templates')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // If category IDs are provided, update category assignments
      if (data.category_ids) {
        // First, remove existing assignments
        const { error: deleteError } = await supabase
          .from('template_category_assignments')
          .delete()
          .eq('template_id', id)

        if (deleteError) throw deleteError

        // Then, create new assignments
        if (data.category_ids.length) {
          const { error: assignError } = await supabase
            .from('template_category_assignments')
            .insert(
              data.category_ids.map(categoryId => ({
                template_id: id,
                category_id: categoryId,
              }))
            )

          if (assignError) throw assignError
        }
      }

      return template
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to delete templates')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
      return false
    } finally {
      setLoading(false)
    }
  }

  const getCategories = async (): Promise<TemplateCategory[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data: categories, error: fetchError } = await supabase
        .from('template_categories')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError

      return categories || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      return []
    } finally {
      setLoading(false)
    }
  }

  const getTemplateCategories = async (templateId: string): Promise<TemplateCategory[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data: assignments, error: fetchError } = await supabase
        .from('template_category_assignments')
        .select(`
          category:template_categories (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('template_id', templateId)

      if (fetchError) throw fetchError

      return assignments?.map(a => a.category) || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch template categories')
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getCategories,
    getTemplateCategories,
    loading,
    error,
  }
} 