import React from 'react'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { motion } from 'framer-motion'
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'

interface ExportOptionsProps {
  html: string
  text: string
  title?: string
}

export default function ExportOptions({ html, text, title = 'content' }: ExportOptionsProps) {
  const exportAsDocx = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(text)],
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    saveAs(blob, `${title}.docx`)
  }

  const exportAsMarkdown = () => {
    // Convert HTML to Markdown
    const markdown = html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<ul>(.*?)<\/ul>/g, '$1\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .trim()

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, `${title}.md`)
  }

  const exportAsText = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `${title}.txt`)
  }

  return (
    <div className="flex gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={exportAsDocx}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <DocumentArrowDownIcon className="w-5 h-5" />
        DOCX
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={exportAsMarkdown}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        <CodeBracketIcon className="w-5 h-5" />
        Markdown
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={exportAsText}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        <DocumentTextIcon className="w-5 h-5" />
        Text
      </motion.button>
    </div>
  )
} 