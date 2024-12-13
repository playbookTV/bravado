import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { templates } from '../utils/templates'
import { ContentType, ContentTone } from '../types/content'

interface TemplateSelectorProps {
  onSelect: (template: string) => void
  contentType: ContentType
  tone: ContentTone
}

export default function TemplateSelector({ onSelect, contentType, tone }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const filteredTemplates = Object.entries(templates).filter(([_, template]) => 
    template.type === contentType
  )

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
      >
        Use Template
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-lg border p-2 z-10"
          >
            {filteredTemplates.map(([id, template]) => (
              <button
                key={id}
                onClick={() => {
                  onSelect(template.structure)
                  setIsOpen(false)
                }}
                className={`w-full text-left p-2 rounded hover:bg-gray-50 ${
                  template.recommendedTone === tone ? 'border-l-2 border-primary' : ''
                }`}
              >
                <h3 className="font-medium">{template.title}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 