import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cache auth state for 1 second to prevent rapid rechecks
const AUTH_STATE_CACHE_TIME = 500
let lastAuthCheck = 0
let cachedSession: any = null

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware for static assets and special routes
  if (shouldSkipMiddleware(req)) {
    return res
  }

  const now = Date.now()
  
  // Use cached session if available and not expired
  if (cachedSession && now - lastAuthCheck < AUTH_STATE_CACHE_TIME) {
    return handleAuthRedirect(req, res, cachedSession)
  }

  const supabase = createMiddlewareClient({ req, res })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Only cache the session if it exists
    if (session) {
      cachedSession = session
      lastAuthCheck = now
    } else {
      cachedSession = null
      lastAuthCheck = 0
    }
    
    return handleAuthRedirect(req, res, session)
  } catch (error) {
    console.error('Auth middleware error:', error)
    // Clear cache on error
    cachedSession = null
    lastAuthCheck = 0
    return handleAuthRedirect(req, res, null)
  }
}

function shouldSkipMiddleware(req: NextRequest): boolean {
  const { pathname } = req.nextUrl
  
  return (
    // Skip static assets and public files
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    // Skip public API routes
    pathname.startsWith('/api/public') ||
    // Skip Next.js internal routes
    pathname.includes('/_next/data/') ||
    pathname.includes('/_next/static/') ||
    pathname.includes('/_next/image')
  )
}

function handleAuthRedirect(req: NextRequest, res: NextResponse, session: any): NextResponse {
  const { pathname, searchParams } = req.nextUrl
  const isAuthPage = pathname.startsWith('/auth')

  // If on auth page with session, redirect to home or redirectTo
  if (session && isAuthPage) {
    const redirectTo = searchParams.get('redirectTo') || '/dashboard'
    const redirectUrl = new URL(redirectTo, req.url)
    // Clear any auth-related query params
    redirectUrl.searchParams.delete('redirectTo')
    redirectUrl.searchParams.delete('error')
    redirectUrl.searchParams.delete('message')
    return NextResponse.redirect(redirectUrl)
  }

  // If not on auth page and no session, redirect to auth
  if (!session && !isAuthPage) {
    const redirectUrl = new URL('/auth', req.url)
    // Only set redirectTo if not already on the auth page
    if (pathname !== '/auth') {
      redirectUrl.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    // Match all paths except those that should be skipped
    '/((?!_next/static|_next/image|favicon.ico|public|api/public).*)',
  ],
} 