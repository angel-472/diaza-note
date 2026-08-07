import type { NoteFilter, SortKey } from 'src/lib/types'

/**
 * Every app-level event. Screens emit them, App.tsx is the only subscriber.
 * Props below App carry data only.
 */
export const SIGNALS = {
  OPEN_NOTE_LIST: 'NAVIGATION:OPEN_NOTE_LIST',
  OPEN_CATEGORIES: 'NAVIGATION:OPEN_CATEGORIES',
  OPEN_NOTE: 'NAVIGATION:OPEN_NOTE',
  CLOSE_NOTE: 'NAVIGATION:CLOSE_NOTE',

  CREATE_NOTE: 'NOTE:CREATE',
  DELETE_NOTE: 'NOTE:DELETE',
  TOGGLE_NOTE_PIN: 'NOTE:TOGGLE_PIN',
  CHANGE_NOTE_TITLE: 'NOTE:CHANGE_TITLE',
  CHANGE_NOTE_CONTENT: 'NOTE:CHANGE_CONTENT',
  ADD_NOTE_CATEGORY: 'NOTE:ADD_CATEGORY',
  REMOVE_NOTE_CATEGORY: 'NOTE:REMOVE_CATEGORY',
  CREATE_NOTE_CATEGORY: 'NOTE:CREATE_CATEGORY',

  CREATE_CATEGORY: 'CATEGORY:CREATE',
  DELETE_CATEGORY: 'CATEGORY:DELETE',

  CHANGE_SORT_KEY: 'PREFERENCES:CHANGE_SORT_KEY',
} as const

export type OpenNoteList = { filter: NoteFilter }
export type OpenNote = { noteId: string }
export type CreateNote = { filter: NoteFilter }
export type DeleteNote = { noteId: string }
export type ToggleNotePin = { noteId: string }
export type ChangeNoteTitle = { noteId: string; title: string }
export type ChangeNoteContent = { noteId: string; content: string; excerpt: string }
export type AddNoteCategory = { noteId: string; categoryId: string }
export type RemoveNoteCategory = { noteId: string; categoryId: string }
/** Creates a category and puts the note in it, since emitting cannot return the new id. */
export type CreateNoteCategory = { noteId: string; name: string }
export type CreateCategory = { name: string }
export type DeleteCategory = { categoryId: string }
export type ChangeSortKey = { sortKey: SortKey }
