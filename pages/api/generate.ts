import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit } from '../../utils/rateLimit'
import OpenAI from 'openai'
import { SearchResult, ContentType, ContentTone, ContentLength } from '../../types/content'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateRequest {
  sources: SearchResult[]
  settings: {
    type: ContentType
    tone: ContentTone
    length: ContentLength
  }
}

const WORD_COUNTS = {
  short: 300,
  medium: 600,
  long: 1200,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OpenAI API key not configured',
      details: 'Please set the OPENAI_API_KEY environment variable'
    })
  }

  try {
    const { sources, settings } = req.body as GenerateRequest

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'No sources provided or invalid sources format'
      })
    }

    if (!settings || !settings.type || !settings.tone || !settings.length) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'Missing or invalid content settings'
      })
    }

    // Apply rate limiting
    return await withRateLimit(req, res, async () => {
      try {
        // Create a prompt based on the content type and settings
        const prompt = createPrompt(sources, settings)

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a professional content creator specializing in ${settings.type} content. 
                       Your writing style is ${settings.tone}. 
                       Create content that is engaging, well-structured, and optimized for the target format.
                       Include proper HTML formatting for headings, paragraphs, and lists.
                       Use semantic HTML tags appropriately.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: calculateMaxTokens(settings.length),
        })

        const generatedHtml = completion.choices[0].message?.content || ''

        return res.status(200).json({
          html: generatedHtml,
          text: stripHtml(generatedHtml),
          metadata: {
            wordCount: countWords(stripHtml(generatedHtml)),
            type: settings.type,
            tone: settings.tone,
            length: settings.length,
          },
        })
      } catch (error: any) {
        console.error('OpenAI API error:', error)
        if (error instanceof OpenAI.APIError) {
          return res.status(error.status || 500).json({
            error: 'OpenAI API error',
            details: error.message
          })
        }
        return res.status(500).json({
          error: 'Content generation error',
          details: error.message || 'An unexpected error occurred'
        })
      }
    }, 'generate')
  } catch (error: any) {
    console.error('Content generation error:', error)
    return res.status(500).json({
      error: 'Failed to generate content',
      details: error.message || 'An unexpected error occurred'
    })
  }
}

function createPrompt(sources: SearchResult[], settings: GenerateRequest['settings']): string {
  const sourceText = sources
    .map((source) => `${source.title}\n${source.snippet}\nSource: ${source.url}`)
    .join('\n\n')

  const targetLength = WORD_COUNTS[settings.length]

  return `Create ${settings.type} content in a ${
    settings.tone
  } tone based on the following sources. The content should be approximately ${targetLength} words long.

Sources:
${sourceText}

Please create well-structured content that includes:
1. An engaging introduction
2. Main points supported by the sources
3. A conclusion that ties everything together
4. Proper HTML formatting using semantic tags:
   - Use <h1> for the main title
   - Use <h2> for section headings
   - Use <p> for paragraphs
   - Use <ul> and <li> for lists
   - Use <blockquote> for quotes
   - Use <strong> and <em> for emphasis

For ${settings.type === 'blog' ? 'blog posts' : settings.type === 'social' ? 'social media' : 'SEO content'}, 
focus on ${
    settings.type === 'blog'
      ? 'creating engaging narratives and clear sections'
      : settings.type === 'social'
      ? 'being concise and attention-grabbing'
      : 'incorporating relevant keywords naturally'
  }.

Make sure the content is original, engaging, and properly formatted with HTML tags.`
}

function calculateMaxTokens(length: ContentLength): number {
  // Approximate tokens based on target word count (1 word ≈ 1.3 tokens)
  return Math.floor(WORD_COUNTS[length] * 1.3)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
} 