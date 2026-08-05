export type Category = {
  id: string
  name: string
}

export type Note = {
  id: string
  title: string
  /** Rich text content stored as HTML (what TipTap reads/writes). */
  content: string
  /** Categories this note belongs to. Empty array = "Unsorted". */
  categoryIds: string[]
  createdAt: string
  /** ISO timestamp of the last edit. Drives the default sort order. */
  updatedAt: string
  /** Pinned notes are grouped above everything else in the note list. */
  isPinned: boolean
}

/** Which set of notes the note list is currently showing. */
export type NoteFilter =
  | { kind: 'all' }
  | { kind: 'unsorted' }
  | { kind: 'category'; id: string }

export type SortKey = 'edited' | 'created' | 'title'

export type Screen =
  | { name: 'categories' }
  | { name: 'notes'; filter: NoteFilter }
  | { name: 'editor'; noteId: string; from: NoteFilter }
