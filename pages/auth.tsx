import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import SignInForm from '../components/auth/SignInForm'
import SignUpForm from '../components/auth/SignUpForm'
import { Button } from '../components/ui/button'
import { Loader2 } from 'lucide-react'

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const { redirectTo } = router.query

  useEffect(() => {
    let mounted = true;

    const handleRedirect = async () => {
      if (!loading && user && !isRedirecting && mounted) {
        setIsRedirecting(true);
        try {
          const destination = typeof redirectTo === 'string' ? redirectTo : '/dashboard';
          window.location.href = destination;
        } catch (error) {
          console.error('Navigation error:', error);
          setIsRedirecting(false);
        }
      }
    };

    handleRedirect();

    return () => {
      mounted = false;
    };
  }, [user, loading, redirectTo, isRedirecting]);

  if (loading || isRedirecting || user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-gray-500">
          {isRedirecting ? 'Redirecting to dashboard...' : 'Checking authentication...'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Bravado</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered content creation platform
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex space-x-2 mb-6">
            <Button
              variant={isSignIn ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setIsSignIn(true)}
            >
              Sign In
            </Button>
            <Button
              variant={!isSignIn ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setIsSignIn(false)}
            >
              Sign Up
            </Button>
          </div>

          {isSignIn ? <SignInForm /> : <SignUpForm />}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          By continuing, you agree to our{' '}
          <Button variant="link" className="p-0">
            Terms of Service
          </Button>{' '}
          and{' '}
          <Button variant="link" className="p-0">
            Privacy Policy
          </Button>
        </p>
      </div>
    </div>
  )
} 