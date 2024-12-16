import { NextApiRequest, NextApiResponse } from 'next'
import { OAuthClient } from '../../../../lib/oauth/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state, error } = req.query

  try {
    // Verify state from cookie matches
    const cookieState = req.cookies.oauth_state
    if (!cookieState || cookieState !== state) {
      throw new Error('Invalid state parameter')
    }

    if (error) {
      throw new Error(error as string)
    }

    if (!code) {
      throw new Error('No authorization code received')
    }

    // Get user session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      throw new Error('Authentication required')
    }

    // Exchange code for token
    const client = new OAuthClient('medium')
    const token = await client.exchangeCode(code as string)

    // Get Medium profile
    const profileResponse = await fetch('https://api.medium.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Medium profile')
    }

    const profile = await profileResponse.json()

    // Save connection
    await client.saveConnection(session.user.id, token, {
      id: profile.data.id,
      name: profile.data.name,
      username: profile.data.username,
      profileUrl: `https://medium.com/@${profile.data.username}`,
    })

    // Clear state cookie
    res.setHeader('Set-Cookie', 'oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')

    // Redirect to settings page
    res.redirect('/settings?connected=medium')
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect(`/settings?error=${encodeURIComponent(error instanceof Error ? error.message : 'Failed to connect Medium account')}`)
  }
} 