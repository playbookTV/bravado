import { useState, useEffect } from 'react'
import { usePublishing } from '../../hooks/usePublishing'
import { useToast } from '../../utils/useToast'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2 } from 'lucide-react'
import { Badge } from '../ui/badge'

interface ConnectPlatformProps {
  onConnect?: (platformId: string) => void
  onCancel?: () => void
}

export default function ConnectPlatform({ onConnect, onCancel }: ConnectPlatformProps) {
  const { getPlatforms, loading } = usePublishing()
  const { error: showError } = useToast()
  const [platforms, setPlatforms] = useState<any[]>([])

  useEffect(() => {
    fetchPlatforms()
  }, [])

  const fetchPlatforms = async () => {
    try {
      const data = await getPlatforms()
      setPlatforms(data)
    } catch (error) {
      console.error('Failed to fetch platforms:', error)
      showError('Failed to load publishing platforms')
    }
  }

  const handleConnect = async (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    if (!platform) return

    // In a real app, you would implement the OAuth flow here
    // For now, we'll just simulate the OAuth redirect
    const authUrl = new URL(platform.config.api_endpoint)
    authUrl.searchParams.set('client_id', 'your_client_id')
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`)
    authUrl.searchParams.set('response_type', 'code')
    if (platform.config.scopes) {
      authUrl.searchParams.set('scope', platform.config.scopes.join(' '))
    }

    // Simulate OAuth callback
    onConnect?.(platformId)
  }

  if (loading && !platforms.length) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Platform</CardTitle>
        <CardDescription>
          Choose a platform to connect and start publishing your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
              onClick={() => handleConnect(platform.id)}
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={`/icons/${platform.icon}.svg`} />
                  <AvatarFallback>
                    {platform.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {platform.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {platform.config.content_types.map((type: string) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button>Connect</Button>
            </div>
          ))}

          {!platforms.length && (
            <div className="text-center py-6 text-gray-500">
              <p>No platforms available</p>
              <p className="text-sm">Please try again later</p>
            </div>
          )}

          {onCancel && (
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 