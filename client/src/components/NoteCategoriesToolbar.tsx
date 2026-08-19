import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import Sheet, { SheetItem } from './Sheet'
import type { Category } from '../lib/types'
import { signal } from 'src/lib/signal/signalManager'
import { SIGNALS } from 'src/lib/signal/signals'

type Props = {
  /** The note being edited. */
  noteId: string
  /** Every category that exists. */
  categories: Category[]
  /** Categories currently on this note. */
  selectedIds: string[]
}

/** The note's category chips, plus a sheet for adding or creating one. */
export default function NoteCategoriesToolbar({ noteId, categories, selectedIds }: Props) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const selected = categories.filter((category) => selectedIds.includes(category.id))
  const available = categories.filter((category) => !selectedIds.includes(category.id))

  function closePicker() {
    setIsPickerOpen(false)
    setNewName('')
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((category) => (
          <span
            key={category.id}
            className="flex items-center gap-1 rounded-full bg-cyan-400/15 py-1 pr-1 pl-3 text-sm text-cyan-300"
          >
            {category.name}
            <button
              type="button"
              aria-label={`Remove from ${category.name}`}
              onClick={() =>
                signal.emit(SIGNALS.REMOVE_NOTE_CATEGORY, { noteId, categoryId: category.id })
              }
              className="flex size-5 items-center justify-center rounded-full text-cyan-400 active:bg-cyan-400/25"
            >
              <X className="size-3" strokeWidth={3} />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="flex items-center gap-1 rounded-full border border-zinc-700 py-1 pr-3 pl-2 text-sm text-zinc-400 active:bg-zinc-900"
        >
          <Plus className="size-4" />
          Category
        </button>
      </div>

      {isPickerOpen && (
        <Sheet title="Add to category" onClose={closePicker}>
          {available.map((category) => (
            <SheetItem
              key={category.id}
              label={category.name}
              onClick={() => {
                signal.emit(SIGNALS.ADD_NOTE_CATEGORY, { noteId, categoryId: category.id })
                closePicker()
              }}
            />
          ))}

          <form
            className="flex gap-2 px-4 pt-3 pb-2"
            onSubmit={(event) => {
              event.preventDefault()
              const name = newName.trim()
              if (!name) return
              signal.emit(SIGNALS.CREATE_NOTE_CATEGORY, { noteId, name })
              closePicker()
            }}
          >
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="New category"
              className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-base text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="shrink-0 rounded-lg bg-cyan-400 px-4 py-2 text-base font-semibold text-zinc-900 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              Add
            </button>
          </form>
        </Sheet>
      )}
    </>
  )
}
