import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlassIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

interface SearchSuggestionsProps {
  suggestions: string[]
  loading: boolean
  onSelect: (suggestion: string) => void
  trendingTopics?: string[]
}

export default function SearchSuggestions({
  suggestions,
  loading,
  onSelect,
  trendingTopics = [],
}: SearchSuggestionsProps) {
  if (!suggestions.length && !trendingTopics.length && !loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute left-0 right-0 mt-2 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
    >
      <div className="p-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-4"
            >
              <div className="loading-spinner w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-md"
                      onClick={() => onSelect(suggestion)}
                    >
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              )}

              {trendingTopics.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Trending Topics
                  </div>
                  {trendingTopics.map((topic, index) => (
                    <motion.button
                      key={topic}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (suggestions.length + index) * 0.05 }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-md"
                      onClick={() => onSelect(topic)}
                    >
                      <ArrowTrendingUpIcon className="w-4 h-4 text-gray-400" />
                      {topic}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 