import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  TextQuote,
  Underline,
} from 'lucide-react'

/**
 * Formatting tools for the note editor. Rendered outside the scroll
 * container in EditorScreen, so it is always pinned to the top of the
 * screen while the note body scrolls underneath it.
 */
export default function EditorToolbar({ editor }: { editor: Editor }) {
  // Re-renders only when one of these marks/nodes toggles, so the active
  // states stay in sync with the cursor without re-rendering on every keystroke.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
    }),
  })

  return (
    <div className="shrink-0 border-b border-neutral-800 bg-neutral-900">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-1 overflow-x-auto px-2 py-2 sm:px-4 lg:max-w-3xl">
        <ToolButton
          label="Bold"
          icon={Bold}
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolButton
          label="Italic"
          icon={Italic}
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolButton
          label="Underline"
          icon={Underline}
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolButton
          label="Strikethrough"
          icon={Strikethrough}
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />

        <div className="mx-1 h-5 w-px shrink-0 bg-neutral-700" />

        <ToolButton
          label="Heading 1"
          icon={Heading1}
          active={state.h1}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolButton
          label="Heading 2"
          icon={Heading2}
          active={state.h2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />

        <div className="mx-1 h-5 w-px shrink-0 bg-neutral-700" />

        <ToolButton
          label="Bullet list"
          icon={List}
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          label="Numbered list"
          icon={ListOrdered}
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolButton
          label="Quote"
          icon={TextQuote}
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
      </div>
    </div>
  )
}

function ToolButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: typeof Bold
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      // Keep focus in the document so the selection survives the tap.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
        active ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 active:bg-neutral-800'
      }`}
    >
      <Icon className="size-5" strokeWidth={2} />
    </button>
  )
}
