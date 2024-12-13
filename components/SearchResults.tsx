import React from 'react'
import { motion } from 'framer-motion'
import { SearchResult } from '../types/content'
import {
  CheckCircleIcon,
  GlobeAltIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

interface SearchResultsProps {
  results: SearchResult[]
  onSelect: (index: number) => void
  metadata?: {
    totalResults: number
    queryTime: number
    language: string
  }
}

export default function SearchResults({ results, onSelect, metadata }: SearchResultsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString()
  }

  return (
    <div>
      {metadata && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-dark-card rounded-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {metadata.totalResults.toLocaleString()} results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {metadata.queryTime.toFixed(2)}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 uppercase">
                {metadata.language}
              </span>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${
              result.selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
            } cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 card-hover`}
            onClick={() => onSelect(index)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{result.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{result.snippet}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GlobeAltIcon className="w-4 h-4" />
                    {new URL(result.url).hostname}
                  </a>
                  {result.meta?.publishedDate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {formatDate(result.meta.publishedDate)}
                    </span>
                  )}
                  {result.meta?.language && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <GlobeAltIcon className="w-4 h-4" />
                      {result.meta.language.toUpperCase()}
                    </span>
                  )}
                  {result.meta?.familyFriendly !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <ShieldCheckIcon className="w-4 h-4" />
                      {result.meta.familyFriendly ? 'Family Friendly' : 'Adult Content'}
                    </span>
                  )}
                </div>
              </div>
              {result.selected && (
                <CheckCircleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 