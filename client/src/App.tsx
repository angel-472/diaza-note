import { useEffect, useState } from 'react'

import CategoriesScreen from './screens/CategoriesScreen'
import NoteListScreen from './screens/NoteListScreen'
import EditorScreen from './screens/EditorScreen'

import { MOCK_CATEGORIES } from './lib/mockData'
import type { Category, Note, NoteFilter, Screen, SortKey } from './lib/types'

import { getAllSavedNotes, getCategories, saveCategories, saveNote } from './lib/storage/localCache'

import {
  SIGNALS,
  type AddNoteCategory,
  type ChangeNoteContent,
  type ChangeNoteTitle,
  type ChangeSortKey,
  type CreateCategory,
  type CreateNote,
  type CreateNoteCategory,
  type DeleteCategory,
  type DeleteNote,
  type OpenNote,
  type OpenNoteList,
  type RemoveNoteCategory,
  type ToggleNotePin,
} from 'src/lib/signal/signals'

import { signal } from 'src/lib/signal/signalManager'

/** Identifies App's subscriptions to the signal manager. */
const SUBSCRIBER_ID = 'App'



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

  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<Note[]>([])

  // True until the first read from storage settles, so the app shows a splash
  // instead of flashing a categories screen where every count is 0.
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)

  // Sort choice is app-wide and resets on reload.
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

  /** Creates an empty note in the given context and opens it straight away. */
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

  /** Creates a category and hands back the record, so callers can use its id. */
  function createCategory(name: string): Category {
    const category: Category = { id: newId('cat'), name }
    // PLUG IN: `POST /categories`.
    setCategories((prev) => [...prev, category])
    return category
  }

  // Subscriptions are set up once. Every handler reads state through the
  // functional setters, so none of them can capture a stale value.
  useEffect(() => {
    signal.sub(SIGNALS.OPEN_NOTE_LIST, SUBSCRIBER_ID, ({ filter }: OpenNoteList) =>
      setScreen({ name: 'notes', filter }),
    )

    signal.sub(SIGNALS.OPEN_CATEGORIES, SUBSCRIBER_ID, () => setScreen({ name: 'categories' }))

    // The note list the note was opened from is where closing it returns to.
    signal.sub(SIGNALS.OPEN_NOTE, SUBSCRIBER_ID, ({ noteId }: OpenNote) =>
      setScreen((prev) =>
        prev.name === 'notes' ? { name: 'editor', noteId, from: prev.filter } : prev,
      ),
    )

    signal.sub(SIGNALS.CLOSE_NOTE, SUBSCRIBER_ID, () =>
      setScreen((prev) => (prev.name === 'editor' ? { name: 'notes', filter: prev.from } : prev)),
    )

    signal.sub(SIGNALS.CREATE_NOTE, SUBSCRIBER_ID, ({ filter }: CreateNote) => createNote(filter))

    signal.sub(SIGNALS.DELETE_NOTE, SUBSCRIBER_ID, ({ noteId }: DeleteNote) => {
      // PLUG IN: `DELETE /notes/:id`. There is no trash/undo — it is gone.
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
      // Deleting the note you are reading has to take you back out of it.
      setScreen((prev) =>
        prev.name === 'editor' && prev.noteId === noteId
          ? { name: 'notes', filter: prev.from }
          : prev,
      )
    })

    /** Pinning is not an edit, so it must not move the note in date order. */
    signal.sub(SIGNALS.TOGGLE_NOTE_PIN, SUBSCRIBER_ID, ({ noteId }: ToggleNotePin) =>
      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? { ...note, isPinned: !note.isPinned } : note)),
      ),
    )

    signal.sub(SIGNALS.CHANGE_NOTE_TITLE, SUBSCRIBER_ID, ({ noteId, title }: ChangeNoteTitle) =>
      updateNote(noteId, (note) => ({ ...note, title })),
    )

    signal.sub(
      SIGNALS.CHANGE_NOTE_CONTENT,
      SUBSCRIBER_ID,
      ({ noteId, content, excerpt }: ChangeNoteContent) =>
        updateNote(noteId, (note) => ({ ...note, content, excerpt })),
    )

    signal.sub(SIGNALS.ADD_NOTE_CATEGORY, SUBSCRIBER_ID, ({ noteId, categoryId }: AddNoteCategory) =>
      updateNote(noteId, (note) => ({
        ...note,
        categoryIds: [...note.categoryIds, categoryId],
      })),
    )

    signal.sub(
      SIGNALS.REMOVE_NOTE_CATEGORY,
      SUBSCRIBER_ID,
      ({ noteId, categoryId }: RemoveNoteCategory) =>
        updateNote(noteId, (note) => ({
          ...note,
          categoryIds: note.categoryIds.filter((id) => id !== categoryId),
        })),
    )

    signal.sub(
      SIGNALS.CREATE_NOTE_CATEGORY,
      SUBSCRIBER_ID,
      ({ noteId, name }: CreateNoteCategory) => {
        const category = createCategory(name)
        updateNote(noteId, (note) => ({
          ...note,
          categoryIds: [...note.categoryIds, category.id],
        }))
      },
    )

    signal.sub(SIGNALS.CREATE_CATEGORY, SUBSCRIBER_ID, ({ name }: CreateCategory) => {
        createCategory(name)
        console.log('new category')
      }
    )

    signal.sub(SIGNALS.DELETE_CATEGORY, SUBSCRIBER_ID, ({ categoryId }: DeleteCategory) => {
      // PLUG IN: `DELETE /categories/:id`.
      setCategories((prev) => prev.filter((category) => category.id !== categoryId))
      // Notes survive; they just lose the membership (and may become Unsorted).
      setNotes((prev) =>
        prev.map((note) => ({
          ...note,
          categoryIds: note.categoryIds.filter((id) => id !== categoryId),
        })),
      )
    })

    signal.sub(SIGNALS.CHANGE_SORT_KEY, SUBSCRIBER_ID, ({ sortKey }: ChangeSortKey) =>
      setSortKey(sortKey),
    )

    return () => signal.unsubAll(SUBSCRIBER_ID)
  }, [])

  // Runs only once to load notes from storage
  let dataLoadRan = false;
  useEffect(() => {
    if(dataLoadRan == true) return;
    dataLoadRan = true;
    getAllSavedNotes()
      .then((data) => {
        setNotes(data.map((row) => JSON.parse(row.data)));
      })
      
    getCategories()
      .then((data) => {
        console.log(data)
        setCategories(data)
      })
      .finally(() => setIsLoadingNotes(false))
  }, []);


  // Listens for changes to categories to persist them
  useEffect(() => {
    if(isLoadingNotes == true) return; //avoids saving the empty state before the local cache loads

    saveCategories(categories);
  }, [categories])




  //
  // RENDERING
  //

  if (isLoadingNotes) {
    return <div className="h-dvh bg-zinc-950" />
  }

  if (screen.name === 'categories') {
    return <CategoriesScreen categories={categories} notes={notes} />
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
    />
  )
}

export default App
