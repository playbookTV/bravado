import React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { exportToMarkdown, exportToTxt, exportToDocx } from '../utils/export'
import Toast from './Toast'
import { ContentType } from '../types/content'

interface ContentPreviewProps {
  content: string
  contentType: ContentType
}

export default function ContentPreview({ content, contentType }: ContentPreviewProps) {
  const [editedContent, setEditedContent] = useState(content)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleExport = async (format: 'markdown' | 'txt' | 'docx') => {
    try {
      switch (format) {
        case 'markdown':
          exportToMarkdown(editedContent)
          break
        case 'txt':
          exportToTxt(editedContent)
          break
        case 'docx':
          await exportToDocx(editedContent)
          break
      }
      setToast({ message: `Successfully exported as ${format.toUpperCase()}`, type: 'success' })
    } catch (error) {
      console.error('Export failed:', error)
      setToast({ message: `Failed to export as ${format.toUpperCase()}`, type: 'error' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Generated Content</h2>
        <motion.div 
          className="space-x-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => handleExport('markdown')}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors"
          >
            Export MD
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors"
          >
            Export TXT
          </button>
          <button
            onClick={() => handleExport('docx')}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors"
          >
            Export DOCX
          </button>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-96 p-4 border rounded-lg focus:ring-primary focus:border-primary font-mono text-sm transition-colors"
          placeholder="Your generated content will appear here..."
        />
      </motion.div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </motion.div>
  )
} 