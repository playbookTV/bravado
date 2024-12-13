import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }[type]

  const textColor = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700'
  }[type]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 right-4 p-4 rounded-lg border ${bgColor} shadow-lg`}
      >
        <div className="flex items-center gap-2">
          <p className={`${textColor} text-sm`}>{message}</p>
          <button onClick={onClose} className={`${textColor} hover:opacity-70`}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 