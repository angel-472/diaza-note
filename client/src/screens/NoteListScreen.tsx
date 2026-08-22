import { useState } from 'react'
import {
  ArrowUpDown,
  ChevronLeft,
  MoreHorizontal,
  Pin,
  PinOff,
  Search,
  Share,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import Sheet, { SheetItem } from '../components/Sheet'
import type { Category, Note, NoteFilter, SortKey } from '../lib/types'
import {
  SORT_OPTIONS,
  displayTitle,
  filterNotes,
  formatEditDate,
  searchNotes,
  shareNote,
  sortNotes,
} from 'src/lib/utils'
import { signal } from 'src/lib/signal/signalManager'
import { SIGNALS } from 'src/lib/signal/signals'

type Props = {
  title: string
  filter: NoteFilter
  notes: Note[]
  categories: Category[]
  sortKey: SortKey
}

export default function NoteListScreen({ title, filter, notes, categories, sortKey }: Props) {
  const [query, setQuery] = useState('')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [menuNote, setMenuNote] = useState<Note | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null)

  const visibleNotes = sortNotes(searchNotes(filterNotes(notes, filter), query), sortKey)
  const pinned = visibleNotes.filter((note) => note.isPinned)
  const rest = visibleNotes.filter((note) => !note.isPinned)

  const sortLabel = SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? ''

  return (
    <div className="flex h-dvh flex-col bg-zinc-900">
      <header className="mx-auto w-full max-w-2xl shrink-0 px-4 pt-4 sm:px-6 lg:max-w-3xl">
        <button
          type="button"
          onClick={() => signal.emit(SIGNALS.OPEN_CATEGORIES)}
          className="-ml-1 flex items-center gap-1 py-1 pr-3 text-base text-cyan-400 active:opacity-60"
        >
          <ChevronLeft className="size-5" />
          Categories
        </button>

        <h1 className="pt-2 pb-3 font-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          {title}
        </h1>

        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-lg bg-zinc-800/50 py-2 pr-9 pl-9 text-base text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-lg text-zinc-500 active:bg-zinc-800"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsSortOpen(true)}
          className="-ml-1 mt-2 flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-zinc-400 active:bg-zinc-900"
        >
          <ArrowUpDown className="size-4" />
          Sorted by {sortLabel}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 pt-2 pb-24 sm:px-6 lg:max-w-3xl">
          {visibleNotes.length === 0 ? (
            <p className="px-1 py-8 text-center text-base text-zinc-500">
              {query ? 'No matches' : 'No notes'}
            </p>
          ) : (
            <>
              {pinned.length > 0 && (
                <NoteListSection
                  label="Pinned"
                  notes={pinned}
                  filter={filter}
                  categories={categories}
                  sortKey={sortKey}
                  onOpenMenu={setMenuNote}
                />
              )}
              {rest.length > 0 && (
                <NoteListSection
                  label={pinned.length > 0 ? 'Notes' : undefined}
                  notes={rest}
                  filter={filter}
                  categories={categories}
                  sortKey={sortKey}
                  onOpenMenu={setMenuNote}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Aligned to the same column as the list rather than the viewport edge. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-2xl justify-end px-4 pb-6 sm:px-6 lg:max-w-3xl">
          <button
            type="button"
            aria-label="New note"
            onClick={() => signal.emit(SIGNALS.CREATE_NOTE, { filter })}
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-cyan-400 text-zinc-900 shadow-lg active:bg-cyan-500"
          >
            <SquarePen className="size-6" />
          </button>
        </div>
      </div>

      {isSortOpen && (
        <Sheet title="Sort by" onClose={() => setIsSortOpen(false)}>
          {SORT_OPTIONS.map((option) => (
            <SheetItem
              key={option.key}
              label={option.label}
              selected={option.key === sortKey}
              onClick={() => {
                signal.emit(SIGNALS.CHANGE_SORT_KEY, { sortKey: option.key })
                setIsSortOpen(false)
              }}
            />
          ))}
        </Sheet>
      )}

      {menuNote && (
        <Sheet title={displayTitle(menuNote)} onClose={() => setMenuNote(null)}>
          <SheetItem
            label={menuNote.isPinned ? 'Unpin' : 'Pin'}
            icon={menuNote.isPinned ? PinOff : Pin}
            onClick={() => {
              signal.emit(SIGNALS.TOGGLE_NOTE_PIN, { noteId: menuNote.id })
              setMenuNote(null)
            }}
          />
          <SheetItem
            label="Share"
            icon={Share}
            onClick={() => {
              void shareNote(menuNote)
              setMenuNote(null)
            }}
          />
          <SheetItem
            label="Delete"
            icon={Trash2}
            destructive
            onClick={() => {
              setPendingDelete(menuNote)
              setMenuNote(null)
            }}
          />
        </Sheet>
      )}

      {pendingDelete && (
        <Sheet title={`Delete "${displayTitle(pendingDelete)}"`} onClose={() => setPendingDelete(null)}>
          <SheetItem
            label="Delete Note"
            icon={Trash2}
            destructive
            onClick={() => {
              signal.emit(SIGNALS.DELETE_NOTE, { noteId: pendingDelete.id })
              setPendingDelete(null)
            }}
          />
          <SheetItem label="Cancel" onClick={() => setPendingDelete(null)} />
        </Sheet>
      )}
    </div>
  )
}

function NoteListSection({
  label,
  notes,
  filter,
  categories,
  sortKey,
  onOpenMenu,
}: {
  label?: string
  notes: Note[]
  filter: NoteFilter
  categories: Category[]
  sortKey: SortKey
  onOpenMenu: (note: Note) => void
}) {
  return (
    <section className="mb-6">
      {label && (
        <h2 className="px-1 pb-1 font-heading text-sm font-semibold tracking-wide text-zinc-500 uppercase">
          {label}
        </h2>
      )}
      <ul className="overflow-hidden rounded-xl bg-zinc-800/50">
        {notes.map((note, index) => (
          <li key={note.id}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => signal.emit(SIGNALS.OPEN_NOTE, { noteId: note.id })}
                className="min-w-0 flex-1 px-4 py-3 text-left active:bg-zinc-800"
              >
                <p className="truncate text-base font-semibold text-zinc-100">
                  {displayTitle(note)}
                </p>
                <p className="mt-0.5 flex gap-2 text-sm text-zinc-500">
                  {/* Show the date the current sort is actually keyed on. */}
                  <span className="shrink-0">
                    {formatEditDate(sortKey === 'created' ? note.createdAt : note.updatedAt)}
                  </span>
                  <span className="truncate">{note.excerpt}</span>
                </p>
                {/* Only show which categories a note is in while browsing everything. */}
                {filter.kind === 'all' && note.categoryIds.length > 0 && (
                  <p className="mt-1 truncate text-sm text-zinc-600">
                    {note.categoryIds
                      .map((id) => categories.find((category) => category.id === id)?.name)
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </button>
              <button
                type="button"
                aria-label={`Actions for ${displayTitle(note)}`}
                onClick={() => onOpenMenu(note)}
                className="mr-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 active:bg-zinc-800"
              >
                <MoreHorizontal className="size-5" />
              </button>
            </div>
            {index < notes.length - 1 && <div className="ml-4 border-b border-zinc-800" />}
          </li>
        ))}
      </ul>
    </section>
  )
}
