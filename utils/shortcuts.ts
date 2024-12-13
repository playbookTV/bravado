import { Editor } from '@tiptap/core'

export const shortcuts = {
  'Mod-b': (editor: Editor) => editor.chain().focus().toggleBold().run(),
  'Mod-i': (editor: Editor) => editor.chain().focus().toggleItalic().run(),
  'Mod-1': (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  'Mod-2': (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  'Mod-l': (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
  'Mod-q': (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
  'Mod-z': (editor: Editor) => editor.chain().focus().undo().run(),
  'Mod-y': (editor: Editor) => editor.chain().focus().redo().run(),
} 