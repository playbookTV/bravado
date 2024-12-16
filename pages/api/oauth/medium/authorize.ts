import { NextApiRequest, NextApiResponse } from 'next'
import { oauthConfig } from '../../../../lib/oauth/config'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const state = Math.random().toString(36).substring(7)
    const config = oauthConfig.medium

    // Store state in session/cookie for validation
    res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax`)

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state,
      response_type: 'code',
    })

    const authorizeUrl = `${config.authorizeUrl}?${params.toString()}`
    res.redirect(authorizeUrl)
  } catch (error) {
    console.error('OAuth authorization error:', error)
    res.status(500).json({ error: 'Failed to initiate OAuth flow' })
  }
} 