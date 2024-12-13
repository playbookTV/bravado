import React, { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import { motion } from 'framer-motion'

interface ContentEditorProps {
  initialContent: string
  onChange: (content: string) => void
}

export default function ContentEditor({ initialContent, onChange }: ContentEditorProps) {
  const [characterCount, setCharacterCount] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        limit: 10000,
      }),
      Placeholder.configure({
        placeholder: 'Start editing your content...',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setCharacterCount(editor.storage.characterCount.characters())
      onChange(html)
    },
  })

  const handleFormat = useCallback((type: 'bold' | 'italic' | 'heading' | 'bullet' | 'quote') => {
    if (!editor) return

    switch (type) {
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'heading':
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case 'bullet':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'quote':
        editor.chain().focus().toggleBlockquote().run()
        break
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center space-x-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => handleFormat('bold')}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-gray-100' : ''
          }`}
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.5 10a3.5 3.5 0 01-3.5 3.5H7v-7h3a3.5 3.5 0 013.5 3.5zM7 15h3.5a3.5 3.5 0 003.5-3.5V10a3.5 3.5 0 00-3.5-3.5H7v7z" />
          </svg>
        </button>
        <button
          onClick={() => handleFormat('italic')}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-gray-100' : ''
          }`}
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 4.5l1.5-.5-3 12-1.5.5 3-12z" />
          </svg>
        </button>
        <button
          onClick={() => handleFormat('heading')}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-100' : ''
          }`}
          title="Heading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 5h-2v4H7V5H5v10h2v-4h4v4h2V5z" />
          </svg>
        </button>
        <button
          onClick={() => handleFormat('bullet')}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('bulletList') ? 'bg-gray-100' : ''
          }`}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 7v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h10v-2H7zM4 7c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
          </svg>
        </button>
        <button
          onClick={() => handleFormat('quote')}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('blockquote') ? 'bg-gray-100' : ''
          }`}
          title="Quote"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M14.76 11.465a1 1 0 01-1.52-.86v-3.65a1 1 0 011.52-.86l3 1.95a1 1 0 010 1.72l-3 1.95zM3 10.575l3-1.95a1 1 0 011.52.86v3.65a1 1 0 01-1.52.86l-3-1.95a1 1 0 010-1.72z" />
          </svg>
        </button>
      </div>

      <EditorContent 
        editor={editor} 
        className="prose max-w-none w-full min-h-[300px] focus:outline-none"
      />

      <div className="mt-4 text-sm text-gray-500">
        {characterCount} characters
      </div>
    </div>
  )
} 