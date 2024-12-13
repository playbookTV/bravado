import React, { useEffect, useState } from 'react'
import { getAPIUsageStats } from '../../utils/api'
import { APIStats } from '../../types/content'

export default function AdminDashboard() {
  const [stats, setStats] = useState<APIStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const newStats = getAPIUsageStats()
        console.log('Fetched stats:', newStats) // Debug log
        setStats(newStats)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Failed to load API stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    // Refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [refreshKey])

  const formatDuration = (duration: number): string => {
    if (isNaN(duration) || duration === 0) return '0ms'
    return `${Math.round(duration)}ms`
  }

  const calculateSuccessRate = (success: number, total: number): number => {
    if (total === 0) return 0
    return Math.round((success / total) * 100)
  }

  const getPerformanceColor = (duration: number): string => {
    if (isNaN(duration) || duration === 0) return 'bg-gray-300'
    if (duration > 2000) return 'bg-red-500'
    if (duration > 1000) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            {isLoading && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Refreshing...
              </span>
            )}
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overall Stats</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Total API Calls: {stats?.total || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Last 24 Hours</h2>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                Total Calls: {stats?.last24Hours.total || 0}
              </p>
              <p className="text-green-600 dark:text-green-400">
                Successful: {stats?.last24Hours.success || 0}
              </p>
              <p className="text-red-600 dark:text-red-400">
                Failed: {stats?.last24Hours.failed || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Average Duration: {formatDuration(stats?.last24Hours.averageDuration || 0)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Success Rate</h2>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200 dark:text-green-200 dark:bg-green-900">
                    {calculateSuccessRate(
                      stats?.last24Hours.success || 0,
                      stats?.last24Hours.total || 0
                    )}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200 dark:bg-green-900">
                <div
                  style={{
                    width: `${calculateSuccessRate(
                      stats?.last24Hours.success || 0,
                      stats?.last24Hours.total || 0
                    )}%`
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Average Response Time</span>
                <span className={`font-semibold ${
                  stats?.last24Hours.averageDuration > 2000 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatDuration(stats?.last24Hours.averageDuration || 0)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
                <div
                  className={`h-full rounded transition-all ${
                    getPerformanceColor(stats?.last24Hours.averageDuration || 0)
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats?.last24Hours.averageDuration || 0) / 2000) * 100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Auto-refreshes every 5 seconds
        </div>
      </div>
    </div>
  )
} 