import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function PrivacyNotice() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      >
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Privacy First</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bravado is committed to your privacy. We don't store any of your data unless explicitly requested.
              All content generation is processed securely and temporarily.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setIsVisible(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Got it
              </button>
              <a
                href="/privacy"
                className="text-sm text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 