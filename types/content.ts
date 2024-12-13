export type ContentType = 'blog' | 'social' | 'seo'
export type ContentTone = 'formal' | 'casual' | 'witty' | 'persuasive'
export type ContentLength = 'short' | 'medium' | 'long'

export interface SearchResult {
  title: string
  snippet: string
  url: string
  selected: boolean
  meta: {
    language: string
    familyFriendly: boolean
    publishedDate: string | null
  }
}

export interface SearchFilters {
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'any'
  language?: string
  safeSearch?: 'strict' | 'moderate' | 'off'
  resultCount?: number
}

export interface ContentSettings {
  type: ContentType
  tone: ContentTone
  length: ContentLength
}

export interface GeneratedContent {
  html: string
  text: string
  metadata: {
    wordCount: number
    type: ContentType
    tone: ContentTone
    length: ContentLength
  }
}

export interface SearchMetadata {
  totalResults: number
  queryTime: number
  language: string
}

export interface SearchResponse {
  results: SearchResult[]
  metadata: SearchMetadata
}

export interface GenerateRequest {
  sources: SearchResult[]
  settings: ContentSettings
}

export interface GenerateResponse {
  html: string
  text: string
  metadata: {
    wordCount: number
    type: ContentType
    tone: ContentTone
    length: ContentLength
  }
} 