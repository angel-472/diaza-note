import { useState } from 'react'
import { ChevronRight, Folder, FolderOpen, FolderPlus, Inbox, Trash2, SquarePen } from 'lucide-react'
import Sheet from '../components/Sheet'
import type { Category, Note, NoteFilter } from '../lib/types'
import { filterNotes } from '../lib/utils'
import { signal } from 'src/lib/signal/signalManager'
import { SIGNALS } from 'src/lib/signal/signals'

type Props = {
  categories: Category[]
  notes: Note[]
}

type Row = {
  key: string
  label: string
  icon: typeof Folder
  filter: NoteFilter
  /** Only user-made categories can be deleted; All Notes / Unsorted cannot. */
  deletable: boolean
}

export default function CategoriesScreen({ categories, notes }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)

  const fixedRows: Row[] = [
    {
      key: 'all',
      label: 'All Notes',
      icon: FolderOpen,
      filter: { kind: 'all' },
      deletable: false,
    },
    {
      key: 'unsorted',
      label: 'Unsorted',
      icon: Inbox,
      filter: { kind: 'unsorted' },
      deletable: false,
    },
  ]

  const categoryRows: Row[] = categories.map((category) => ({
    key: category.id,
    label: category.name,
    icon: Folder,
    filter: { kind: 'category', id: category.id },
    deletable: true,
  }))

  return (
    <div className="flex h-dvh flex-col bg-zinc-900">
      <header className="mx-auto w-full max-w-2xl shrink-0 px-4 pt-6 pb-3 sm:px-6 lg:max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Categories
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="rounded-lg px-2 py-1 text-base text-cyan-400 active:bg-zinc-900"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
            <button
              type="button"
              aria-label="New category"
              onClick={() => setIsCreateOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg text-cyan-400 active:bg-zinc-900"
            >
              <FolderPlus className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 pb-8 sm:px-6 lg:max-w-3xl">
          <RowGroup
            rows={fixedRows}
            notes={notes}
            categories={categories}
            isEditing={isEditing}
            onRequestDelete={setPendingDelete}
          />
          <div className="h-6" />
          <RowGroup
            rows={categoryRows}
            notes={notes}
            categories={categories}
            isEditing={isEditing}
            onRequestDelete={setPendingDelete}
          />
        </div>

        {/* Aligned to the same column as the list rather than the viewport edge. */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-2xl justify-end px-4 pb-6 sm:px-6 lg:max-w-3xl">
            <button
              type="button"
              aria-label="New note"
              onClick={() => signal.emit(SIGNALS.CREATE_NOTE, { filter: { kind: 'unsorted' } })}
              className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-cyan-400 text-zinc-900 shadow-lg active:bg-cyan-500"
            >
              <SquarePen className="size-6" />
            </button>
          </div>
        </div>
      </div>


      {isCreateOpen && (
        <NewCategorySheet
          onClose={() => setIsCreateOpen(false)}
          onCreate={(name) => {
            signal.emit(SIGNALS.CREATE_CATEGORY, { name })
            setIsCreateOpen(false)
          }}
        />
      )}

      {pendingDelete && (
        <Sheet title={`Delete "${pendingDelete.name}"`} onClose={() => setPendingDelete(null)}>
          <p className="px-4 pb-2 text-sm text-zinc-400">
            Notes in this category are kept and become Unsorted if they have no other category.
          </p>
          <button
            type="button"
            onClick={() => {
              signal.emit(SIGNALS.DELETE_CATEGORY, { categoryId: pendingDelete.id })
              setPendingDelete(null)
            }}
            className="w-full px-4 py-3 text-left text-base text-red-400 active:bg-zinc-800"
          >
            Delete Category
          </button>
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="w-full px-4 py-3 text-left text-base text-zinc-100 active:bg-zinc-800"
          >
            Cancel
          </button>
        </Sheet>
      )}
    </div>
  )
}

function RowGroup({
  rows,
  notes,
  categories,
  isEditing,
  onRequestDelete,
}: {
  rows: Row[]
  notes: Note[]
  categories: Category[]
  isEditing: boolean
  onRequestDelete: (category: Category) => void
}) {
  if (rows.length === 0) return null

  return (
    <ul className="overflow-hidden rounded-xl bg-zinc-800/50">
      {rows.map((row, index) => {
        const Icon = row.icon
        const count = filterNotes(notes, row.filter).length
        const showDelete = isEditing && row.deletable

        return (
          <li key={row.key}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => signal.emit(SIGNALS.OPEN_NOTE_LIST, { filter: row.filter })}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-zinc-800"
              >
                <Icon className="size-5 shrink-0 text-cyan-400" strokeWidth={2} />
                <span className="flex-1 truncate text-base text-zinc-100">{row.label}</span>
                <span className="text-base tabular-nums text-zinc-500">{count}</span>
                {!showDelete && <ChevronRight className="size-4 shrink-0 text-zinc-600" />}
              </button>
              
              {showDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${row.label}`}
                  onClick={() => {
                    const category = categories.find((candidate) => candidate.id === row.key)
                    if (category) onRequestDelete(category)
                  }}
                  className="mr-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-red-400 active:bg-zinc-800"
                >
                  <Trash2 className="size-5" />
                </button>
              )}
            </div>
            {index < rows.length - 1 && <div className="ml-12 border-b border-zinc-800" />}
          </li>
        )
      })}
    </ul>
  )
}

function NewCategorySheet({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState('')

  return (
    <Sheet title="New Category" onClose={onClose}>
      <form
        className="flex flex-col gap-3 px-4 pt-2 pb-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim()) onCreate(name.trim())
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-base text-zinc-100 outline-none placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-lg bg-cyan-400 py-2 text-base font-semibold text-zinc-900 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          Create
        </button>
      </form>
    </Sheet>
  )
}
