import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '../ui/button'
import { useToast } from '../../utils/useToast'
import { OAuthClient } from '../../lib/oauth/client'

export function ConnectMedium() {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    // Handle connection status from URL params
    const { connected, error } = router.query
    if (connected === 'medium') {
      success('Successfully connected Medium account')
      checkConnection()
    } else if (error) {
      showError(decodeURIComponent(error as string))
    }
  }, [router.query])

  async function checkConnection() {
    try {
      setIsLoading(true)
      const client = new OAuthClient('medium')
      const connection = await client.getConnection('current') // 'current' will be replaced with actual userId
      setIsConnected(!!connection)
    } catch (error) {
      console.error('Failed to check Medium connection:', error)
      showError('Failed to check Medium connection status')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConnect() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/oauth/medium/authorize')
      if (!response.ok) throw new Error('Failed to initiate Medium connection')
      
      const data = await response.json()
      router.push(data.url)
    } catch (error) {
      console.error('Failed to connect Medium:', error)
      showError('Failed to initiate Medium connection')
      setIsLoading(false)
    }
  }

  async function handleDisconnect() {
    try {
      setIsLoading(true)
      const client = new OAuthClient('medium')
      await client.deleteConnection('current') // 'current' will be replaced with actual userId
      setIsConnected(false)
      success('Successfully disconnected Medium account')
    } catch (error) {
      console.error('Failed to disconnect Medium:', error)
      showError('Failed to disconnect Medium account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <img
        src="/medium-logo.png"
        alt="Medium"
        className="w-8 h-8 rounded-full"
      />
      <div className="flex-1">
        <h3 className="text-sm font-medium">Medium</h3>
        <p className="text-sm text-gray-500">
          {isConnected
            ? 'Connected to Medium'
            : 'Publish your content directly to Medium'}
        </p>
      </div>
      <Button
        variant={isConnected ? 'destructive' : 'default'}
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isLoading}
      >
        {isLoading
          ? 'Loading...'
          : isConnected
          ? 'Disconnect'
          : 'Connect'}
      </Button>
    </div>
  )
} 