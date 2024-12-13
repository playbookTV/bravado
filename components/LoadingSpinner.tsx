import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  message?: string
}

export default function LoadingSpinner({ message = 'Generating content...' }: LoadingSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8"
    >
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/30 rounded-full"></div>
        <motion.div
          className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <p className="mt-4 text-gray-600">{message}</p>
    </motion.div>
  )
} 