export type ContentType = 'blog' | 'social' | 'seo'
export type ContentTone = 'formal' | 'casual' | 'witty' | 'persuasive'
export type ContentLength = 'short' | 'medium' | 'long'

export interface SearchResult {
  title: string
  snippet: string
  url: string
  selected?: boolean
  meta?: {
    language?: string
    familyFriendly?: boolean
    publishedDate?: string
  }
}

export interface SearchMetadata {
  totalResults: number
  queryTime: number
  language: string
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

export interface ContentTemplate {
  name: string
  content: string
  type: ContentType
  tone: ContentTone
} 