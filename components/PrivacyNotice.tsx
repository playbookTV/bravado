import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PrivacyNoticeProps {
  onAccept?: () => void
  onLearnMore?: () => void
}

export default function PrivacyNotice({ onAccept, onLearnMore }: PrivacyNoticeProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleAccept = () => {
    setIsVisible(false)
    onAccept?.()
  }

  const handleLearnMore = () => {
    onLearnMore?.()
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Privacy First</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bravado is committed to your privacy. We don't store any of your data unless explicitly requested.
              All content generation is processed securely and temporarily.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleAccept}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                Got it
              </button>
              <button
                onClick={handleLearnMore}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Learn more
              </button>
            </div>
          </div>
          <button
            onClick={handleAccept}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            aria-label="Close privacy notice"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 