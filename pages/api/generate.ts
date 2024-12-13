import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit } from '../../utils/rateLimit'
import { handleApiError } from '../../utils/api'
import OpenAI from 'openai'
import { SearchResult, ContentType, ContentTone, ContentLength, GenerateRequest, GenerateResponse } from '../../types/content'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

const WORD_COUNTS = {
  short: 300,
  medium: 600,
  long: 1200,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

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
                       Use semantic HTML tags appropriately.
                       Focus on creating content that is both informative and engaging.
                       Ensure proper citation and attribution of sources.
                       Always wrap your response in a root <article> tag.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: calculateMaxTokens(settings.length),
          stream: false
        })

        if (!completion.choices[0]?.message?.content) {
          throw new Error('No content generated from OpenAI')
        }

        const generatedHtml = completion.choices[0].message.content
        
        // Ensure the content is wrapped in an article tag
        const wrappedHtml = generatedHtml.startsWith('<article>') 
          ? generatedHtml 
          : `<article>${generatedHtml}</article>`

        const response: GenerateResponse = {
          html: wrappedHtml,
          text: stripHtml(wrappedHtml),
          metadata: {
            wordCount: countWords(stripHtml(wrappedHtml)),
            type: settings.type,
            tone: settings.tone,
            length: settings.length,
          },
        }

        return res.status(200).json(response)
      } catch (error: any) {
        console.error('OpenAI API error:', error)

        // Handle OpenAI specific errors
        if (error instanceof OpenAI.APIError) {
          const status = error.status || 500
          const message = error.message || 'OpenAI API error'
          return res.status(status).json({
            error: 'OpenAI API Error',
            details: message,
            code: error.code
          })
        }

        // Handle other errors
        const apiError = await handleApiError(error)
        return res.status(apiError.error === 'Rate Limit Exceeded' ? 429 : 500).json(apiError)
      }
    }, 'generate')
  } catch (error) {
    console.error('Content generation error:', error)
    const apiError = await handleApiError(error)
    return res.status(apiError.code === 'RATE_LIMIT' ? 429 : 500).json(apiError)
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
   - Use <cite> for source citations

For ${settings.type === 'blog' ? 'blog posts' : settings.type === 'social' ? 'social media' : 'SEO content'}, 
focus on ${
    settings.type === 'blog'
      ? 'creating engaging narratives and clear sections'
      : settings.type === 'social'
      ? 'being concise and attention-grabbing'
      : 'incorporating relevant keywords naturally'
  }.

Make sure the content is original, engaging, and properly formatted with HTML tags.
Include proper citations and attributions for any quoted or paraphrased content.
Wrap the entire content in an <article> tag.`
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