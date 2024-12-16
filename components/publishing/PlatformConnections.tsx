import { useState, useEffect } from 'react'
import { usePublishing } from '../../hooks/usePublishing'
import { useToast } from '../../utils/useToast'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2, Plus, Trash2, RefreshCw } from 'lucide-react'
import { Badge } from '../ui/badge'

interface PlatformConnectionsProps {
  onConnect?: () => void
}

export default function PlatformConnections({ onConnect }: PlatformConnectionsProps) {
  const { getConnections, deleteConnection, updateConnection, loading } = usePublishing()
  const { error: showError, success } = useToast()
  const [connections, setConnections] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const data = await getConnections()
      setConnections(data)
    } catch (error) {
      console.error('Failed to fetch connections:', error)
      showError('Failed to load platform connections')
    }
  }

  const handleDelete = async (connectionId: string) => {
    try {
      setIsDeleting(connectionId)
      const success = await deleteConnection(connectionId)
      if (success) {
        setConnections(prev => prev.filter(c => c.id !== connectionId))
        success('Connection removed successfully')
      }
    } catch (error) {
      console.error('Failed to delete connection:', error)
      showError('Failed to remove connection')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRefreshToken = async (connectionId: string) => {
    try {
      setIsRefreshing(connectionId)
      const connection = connections.find(c => c.id === connectionId)
      if (!connection?.refresh_token) {
        throw new Error('No refresh token available')
      }

      // In a real app, you would implement the OAuth refresh flow here
      // For now, we'll just simulate a token refresh
      const updatedConnection = await updateConnection(connectionId, {
        access_token: `new_token_${Date.now()}`,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      })

      if (updatedConnection) {
        setConnections(prev =>
          prev.map(c => (c.id === connectionId ? updatedConnection : c))
        )
        success('Token refreshed successfully')
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
      showError('Failed to refresh token')
    } finally {
      setIsRefreshing(null)
    }
  }

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading && !connections.length) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>Manage your publishing platform connections</CardDescription>
        </div>
        <Button onClick={onConnect} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Connect Platform
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={`/icons/${connection.platform?.icon}.svg`} />
                  <AvatarFallback>
                    {connection.platform?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{connection.platform?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {isTokenExpired(connection.token_expires_at) ? (
                      <Badge variant="destructive">Token Expired</Badge>
                    ) : (
                      <Badge variant="default">Connected</Badge>
                    )}
                    {connection.platform?.config.content_types.map((type: string) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {connection.refresh_token && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRefreshToken(connection.id)}
                    disabled={isRefreshing === connection.id}
                  >
                    {isRefreshing === connection.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Connection</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove this connection? You will need to reconnect to publish content to this platform.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(connection.id)}
                        disabled={isDeleting === connection.id}
                      >
                        {isDeleting === connection.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}

          {!connections.length && !onConnect && (
            <div className="text-center py-6 text-gray-500">
              <p>No platforms connected</p>
              <p className="text-sm">Connect a platform to start publishing your content</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 