import { useState } from 'react'
import { ChevronLeft, MoreHorizontal, Pin, PinOff, Share, Trash2 } from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import EditorToolbar from '../components/EditorToolbar'
import NoteCategoriesToolbar from '../components/NoteCategoriesToolbar'
import Sheet, { SheetItem } from '../components/Sheet'
import type { Category, Note } from '../lib/types'
import { displayTitle, shareNote } from '../lib/utils'

type Props = {
  note: Note
  categories: Category[]
  backLabel: string
  onBack: () => void
  onChangeTitle: (title: string) => void
  onChangeContent: (html: string) => void
  onAddCategory: (categoryId: string) => void
  onRemoveCategory: (categoryId: string) => void
  onCreateCategory: (name: string) => string
  onTogglePin: () => void
  onDelete: () => void
}

export default function EditorScreen({
  note,
  categories,
  backLabel,
  onBack,
  onChangeTitle,
  onChangeContent,
  onAddCategory,
  onRemoveCategory,
  onCreateCategory,
  onTogglePin,
  onDelete,
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content,
    editorProps: {
      attributes: {
        // Content element styling lives in index.css (`.tiptap`), since the
        // nodes TipTap renders are not ours to put classes on.
        class: 'min-h-64 pb-8',
      },
    },
    // PLUG IN: this fires on every change. Right now it only updates
    // in-memory state in App.tsx — swap in a debounced `PATCH /notes/:id`.
    onUpdate: ({ editor }) => onChangeContent(editor.getHTML()),
  })

  return (
    <div className="flex h-dvh flex-col bg-zinc-950">
      <header className="shrink-0">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-2 pt-4 pb-2 sm:px-4 lg:max-w-3xl">
          <button
            type="button"
            onClick={onBack}
            className="flex min-w-0 items-center gap-1 py-1 pr-3 text-base text-cyan-400 active:opacity-60"
          >
            <ChevronLeft className="size-5 shrink-0" />
            <span className="truncate">{backLabel}</span>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            {note.isPinned && <Pin className="size-4 text-cyan-400" />}
            <button
              type="button"
              aria-label="Note actions"
              onClick={() => setIsMenuOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg text-cyan-400 active:bg-zinc-900"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sibling of the scroll container, not inside it, so it never moves. */}
      {editor && <EditorToolbar editor={editor} />}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:max-w-3xl">
          <input
            value={note.title}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="Title"
            className="w-full pt-4 pb-2 text-2xl font-bold tracking-tight text-zinc-50 outline-none placeholder:text-zinc-600 sm:text-3xl"
          />

          <div className="pb-3">
            <NoteCategoriesToolbar
              categories={categories}
              selectedIds={note.categoryIds}
              onAdd={onAddCategory}
              onRemove={onRemoveCategory}
              onCreateCategory={onCreateCategory}
            />
          </div>

          <EditorContent editor={editor} />
        </div>
      </div>

      {isMenuOpen && (
        <Sheet title={displayTitle(note)} onClose={() => setIsMenuOpen(false)}>
          <SheetItem
            label={note.isPinned ? 'Unpin' : 'Pin'}
            icon={note.isPinned ? PinOff : Pin}
            onClick={() => {
              onTogglePin()
              setIsMenuOpen(false)
            }}
          />
          <SheetItem
            label="Share"
            icon={Share}
            onClick={() => {
              void shareNote(note)
              setIsMenuOpen(false)
            }}
          />
          <SheetItem
            label="Delete"
            icon={Trash2}
            destructive
            onClick={() => {
              setIsMenuOpen(false)
              setIsConfirmingDelete(true)
            }}
          />
        </Sheet>
      )}

      {isConfirmingDelete && (
        <Sheet
          title={`Delete "${displayTitle(note)}"`}
          onClose={() => setIsConfirmingDelete(false)}
        >
          {/* Deleting from here also navigates back — App.tsx owns that. */}
          <SheetItem label="Delete Note" icon={Trash2} destructive onClick={onDelete} />
          <SheetItem label="Cancel" onClick={() => setIsConfirmingDelete(false)} />
        </Sheet>
      )}
    </div>
  )
}
