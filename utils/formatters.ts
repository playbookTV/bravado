import { ContentType } from '../types/content'

interface FormatOptions {
  type: ContentType
  includeHeadings?: boolean
  includeLinks?: boolean
}

export const formatContent = (content: string, options: FormatOptions): string => {
  let formatted = content

  switch (options.type) {
    case 'blog':
      formatted = formatBlogPost(formatted, options)
      break
    case 'social':
      formatted = formatSocialPost(formatted)
      break
    case 'seo':
      formatted = formatSEOContent(formatted)
      break
  }

  return formatted
}

const formatBlogPost = (content: string, options: FormatOptions): string => {
  let formatted = content

  if (options.includeHeadings) {
    // Add markdown headings if not present
    const lines = formatted.split('\n')
    let hasH1 = false
    
    formatted = lines.map((line, index) => {
      if (index === 0 && !line.startsWith('#')) {
        hasH1 = true
        return `# ${line}`
      }
      if (!hasH1 && line.length > 0) {
        hasH1 = true
        return `# ${line}`
      }
      return line
    }).join('\n')
  }

  // Add line breaks between paragraphs if needed
  formatted = formatted.replace(/([^\n])\n([^\n])/g, '$1\n\n$2')

  return formatted
}

const formatSocialPost = (content: string): string => {
  let formatted = content
    // Add hashtags for key terms
    .replace(/\b(important|key|significant)\b/gi, '#$1')
    // Ensure there's a call to action
    .replace(/([.!?])$/, '$1\n\nLike and share if you found this helpful! 👍')
    // Limit length
    .slice(0, 280)

  return formatted
}

const formatSEOContent = (content: string): string => {
  let formatted = content
    // Ensure paragraphs are the right length for readability
    .split('\n')
    .map(paragraph => {
      const words = paragraph.split(' ')
      if (words.length > 30) {
        const mid = Math.floor(words.length / 2)
        return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ')
      }
      return paragraph
    })
    .join('\n')

  return formatted
} 