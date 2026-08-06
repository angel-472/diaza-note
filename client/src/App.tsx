import { useEffect, useState } from 'react'

import CategoriesScreen from './screens/CategoriesScreen'
import NoteListScreen from './screens/NoteListScreen'
import EditorScreen from './screens/EditorScreen'

import { MOCK_CATEGORIES, MOCK_NOTES } from './lib/mockData'
import type { Category, Note, NoteFilter, Screen, SortKey } from './lib/types'

import { getAllSavedNotes, saveNote } from './lib/storage/localCache'



function getFilterLabel(filter: NoteFilter, categories: Category[]): string {
  if (filter.kind === 'all') return 'All Notes'
  if (filter.kind === 'unsorted') return 'Unsorted'
  return categories.find((category) => category.id === filter.id)?.name ?? 'Category'
}

/**
 * MOCK: ids are generated client-side. PLUG IN: let the server assign them.
 * Not using crypto.randomUUID() — it is undefined over plain http, which is
 * exactly how `npm run dev --host` is reached from a phone on the LAN.
 */
let idCounter = 0
const newId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`



function App() {

  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES)
  const [notes, setNotes] = useState<Note[]>([])

  // True until the first read from storage settles, so the app shows a splash
  // instead of flashing a categories screen where every count is 0.
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)

  // Sort choice is app-wide and resets on reload.
  // PLUG IN: persist to localStorage or user settings if it should stick.
  const [sortKey, setSortKey] = useState<SortKey>('edited')

  // Screen state stands in for a router. PLUG IN: swap for real routes
  // (e.g. `/`, `/c/:categoryId`, `/n/:noteId`) if URLs/back-gesture matter.
  const [screen, setScreen] = useState<Screen>({ name: 'categories' })


  /** Applies a change to one note and stamps it as just-edited. */
  function updateNote(noteId: string, transform: (note: Note) => Note) {

    // Updates react state
    setNotes((prevNotes) =>
      // Goes through each note on the array and manipulates only the targeted one
      prevNotes.map((note) => {
        if (note.id !== noteId) return note;
        const updatedNote = { ...transform(note), updatedAt: new Date().toISOString() };
        // TODO: debounce saving so it doesn't run every time a character is typed
        saveNote(updatedNote);
        return updatedNote;
      }),
    )
  }

  /** Pinning is not an edit, so it must not move the note in date order. */
  function togglePin(noteId: string) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, isPinned: !note.isPinned } : note,
      ),
    )
  }

  function deleteNote(noteId: string) {
    // PLUG IN: `DELETE /notes/:id`. There is no trash/undo — it is gone.
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }

  function createCategory(name: string): string {
    const category: Category = { id: newId('cat'), name }
    // PLUG IN: `POST /categories`.
    setCategories((prev) => [...prev, category])
    return category.id
  }

  function deleteCategory(categoryId: string) {
    // PLUG IN: `DELETE /categories/:id`.
    setCategories((prev) => prev.filter((category) => category.id !== categoryId))
    // Notes survive; they just lose the membership (and may become Unsorted).
    setNotes((prev) =>
      prev.map((note) => ({
        ...note,
        categoryIds: note.categoryIds.filter((id) => id !== categoryId),
      })),
    )
  }

  /** Creates an empty note in the prev context and opens it straight away. */
  function createNote(filter: NoteFilter) {
    const now = new Date().toISOString()
    const note: Note = {
      id: newId('note'),
      title: '',
      content: '<p></p>',
      // A new note inherits the category you were browsing.
      categoryIds: filter.kind === 'category' ? [filter.id] : [],
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      excerpt: '',
    }
    // PLUG IN: `POST /notes`.
    setNotes((prev) => [note, ...prev])
    setScreen({ name: 'editor', noteId: note.id, from: filter })
  }

  // Runs only once to load notes from storage
  useEffect(() => {
    getAllSavedNotes()
      .then((data) => {
        setNotes(data.map((row) => JSON.parse(row.data)));
      })
      .finally(() => setIsLoadingNotes(false))
  }, []);



  //
  // RENDERING
  //

  if (isLoadingNotes) {
    return <div className="h-dvh bg-zinc-950" />
  }

  if (screen.name === 'categories') {
    return (
      <CategoriesScreen
        categories={categories}
        notes={notes}
        onOpenFilter={(filter) => setScreen({ name: 'notes', filter })}
        onCreateCategory={createCategory}
        onDeleteCategory={deleteCategory}
        onCreateNote={() => createNote({kind: "unsorted"})}
      />
    )
  }

  if (screen.name === 'notes') {
    const { filter } = screen
    return (
      <NoteListScreen
        title={getFilterLabel(filter, categories)}
        filter={filter}
        notes={notes}
        categories={categories}
        sortKey={sortKey}
        onChangeSort={setSortKey}
        onBack={() => setScreen({ name: 'categories' })}
        onOpenNote={(noteId) => setScreen({ name: 'editor', noteId, from: filter })}
        onCreateNote={() => createNote(filter)}
        onTogglePin={togglePin}
        onDeleteNote={deleteNote}
      />
    )
  }

  // Try to find a note with the screen noteId, if not found then set screen to notes list
  const note = notes.find((candidate) => candidate.id === screen.noteId)
  if (!note) {
    setScreen({ name: 'notes', filter: screen.from })
    return null
  }

  return (
    <EditorScreen
      // Remounts the TipTap instance when a different note is opened.
      key={note.id}
      note={note}
      categories={categories}
      backLabel={getFilterLabel(screen.from, categories)}
      onBack={() => setScreen({ name: 'notes', filter: screen.from })}
      onChangeTitle={(title) => updateNote(note.id, (prev) => ({ ...prev, title }))}
      onChangeContent={(content) => updateNote(note.id, (prev) => ({ ...prev, content }))}
      updateExcerpt={(excerpt) => updateNote(note.id, (prev) => ({...prev, excerpt})) }
      onAddCategory={(categoryId) =>
        updateNote(note.id, (prev) => ({
          ...prev,
          categoryIds: [...prev.categoryIds, categoryId],
        }))
      }
      onRemoveCategory={(categoryId) =>
        updateNote(note.id, (prev) => ({
          ...prev,
          categoryIds: prev.categoryIds.filter((id) => id !== categoryId),
        }))
      }
      onCreateCategory={createCategory}
      onTogglePin={() => togglePin(note.id)}
      onDelete={() => {
        deleteNote(note.id)
        setScreen({ name: 'notes', filter: screen.from })
      }}
    />
  )
}

export default App
