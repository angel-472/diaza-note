import type { Note, NoteFilter, SortKey } from './types'

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'edited', label: 'Date Edited' },
  { key: 'created', label: 'Date Created' },
  { key: 'title', label: 'Title' },
]

const time = (iso: string) => new Date(iso).getTime()

/** Fallback used for both display and title sorting so untitled notes group together. */
export const displayTitle = (note: Note) => note.title.trim() || 'New Note'

export function sortNotes(notes: Note[], sortKey: SortKey): Note[] {
  const sorted = [...notes]
  switch (sortKey) {
    case 'edited':
      return sorted.sort((a, b) => time(b.updatedAt) - time(a.updatedAt))
    case 'created':
      return sorted.sort((a, b) => time(b.createdAt) - time(a.createdAt))
    case 'title':
      return sorted.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
  }
}

export function filterNotes(notes: Note[], filter: NoteFilter): Note[] {
  switch (filter.kind) {
    case 'all':
      return notes
    case 'unsorted':
      return notes.filter((note) => note.categoryIds.length === 0)
    case 'category':
      return notes.filter((note) => note.categoryIds.includes(filter.id))
  }
}

/**
 * Plain substring match over title + body text.
 * PLUG IN: swap for a server-side search endpoint if the note count grows.
 */
export function searchNotes(notes: Note[], query: string): Note[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return notes
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(needle) ||
      contentPreview(note.content).toLowerCase().includes(needle),
  )
}

/** Strips the stored HTML down to a one-line preview for the list rows. */
export function contentPreview(html: string): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 0 ? text : 'No additional text'
}

/** Today -> time, this year -> day + month, older -> full date. */
export function formatEditDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Native share sheet, falling back to the clipboard where it is unavailable
 * (most desktop browsers, any non-HTTPS origin).
 * PLUG IN: share a real permalink once notes have server-side URLs — right
 * now this only shares the note's own text.
 */
export async function shareNote(note: Note): Promise<void> {
  const payload = `${displayTitle(note)}\n\n${contentPreview(note.content)}`
  try {
    if (navigator.share) {
      await navigator.share({ title: displayTitle(note), text: payload })
    } else {
      await navigator.clipboard.writeText(payload)
    }
  } catch {
    // User dismissed the share sheet, or the clipboard was blocked. Nothing to do.
  }
}
