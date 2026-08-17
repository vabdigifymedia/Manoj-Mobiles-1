'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { FaList, FaHeading, FaArrowRotateLeft, FaListOl, FaItalic, FaBold, FaArrowRotateRight } from 'react-icons/fa6'

export function RichTextEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert sm:prose-base focus:outline-none min-h-[150px] p-4',
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
      <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
        >
          <FaBold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
        >
          <FaItalic size={16} />
        </button>
        <div className="w-px h-6 bg-border mx-1 self-center" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
        >
          <FaHeading size={16} />
        </button>
        <div className="w-px h-6 bg-border mx-1 self-center" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('bulletList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
        >
          <FaList size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('orderedList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
        >
          <FaListOl size={16} />
        </button>
        <div className="w-px h-6 bg-border mx-1 self-center" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
        >
          <FaArrowRotateLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
        >
          <FaArrowRotateRight size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
