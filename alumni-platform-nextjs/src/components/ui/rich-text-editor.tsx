'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Box } from '@mantine/core';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = '輸入內容...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 'var(--mantine-radius-md)',
        padding: 'var(--mantine-spacing-md)',
        minHeight: '150px',
      }}
    >
      <EditorContent editor={editor} />
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 150px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--mantine-color-gray-5);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--mantine-color-gray-4);
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
        }
        .ProseMirror code {
          background-color: var(--mantine-color-gray-1);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .ProseMirror pre {
          background-color: var(--mantine-color-gray-1);
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </Box>
  );
}

