export interface SearchResult {
  title: string
  description: string
  url: string
}

export interface GeneratedContent {
  content: string
  sources: SearchResult[]
} 