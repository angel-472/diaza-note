import type { Category, Note } from './types'

/**
 * MOCK DATA — nothing here is persisted.
 *
 * PLUG IN: replace both exports with data fetched from the backend
 * (e.g. `GET /categories` and `GET /notes`). The shapes in `types.ts`
 * are what the UI expects, so a thin mapping layer in the fetch call is
 * enough — no component changes required.
 */

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Work' },
  { id: 'cat-personal', name: 'Personal' },
  { id: 'cat-recipes', name: 'Recipes' },
  { id: 'cat-reading', name: 'Reading' },
]

export const MOCK_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Sprint planning',
    content:
      '<p>Carry over the migration ticket. Ask about the staging database before Thursday.</p><ul><li><p>Finish the import script</p></li><li><p>Review open pull requests</p></li></ul>',
    categoryIds: ['cat-work'],
    createdAt: '2026-07-30T09:00:00.000Z',
    updatedAt: '2026-08-05T09:14:00.000Z',
    isPinned: true,
  },
  {
    id: 'note-2',
    title: 'Focaccia',
    content:
      '<p>500g flour, 400g water, 10g salt, 4g yeast.</p><p>Rest overnight in the fridge, dimple with olive oil, bake at 230°C for 20 minutes.</p>',
    categoryIds: ['cat-recipes', 'cat-personal'],
    createdAt: '2026-06-11T13:20:00.000Z',
    updatedAt: '2026-08-04T18:42:00.000Z',
    isPinned: false,
  },
  {
    id: 'note-3',
    title: 'Books to finish',
    content:
      '<ol><li><p>The Dispossessed</p></li><li><p>Piranesi</p></li><li><p>A Pattern Language</p></li></ol>',
    categoryIds: ['cat-reading'],
    createdAt: '2026-05-02T19:45:00.000Z',
    updatedAt: '2026-08-02T11:05:00.000Z',
    isPinned: true,
  },
  {
    id: 'note-4',
    title: 'Apartment stuff',
    content:
      '<p>Radiator in the back room still knocks. Call the super Monday morning, not after 6.</p>',
    categoryIds: ['cat-personal'],
    createdAt: '2026-07-26T08:15:00.000Z',
    updatedAt: '2026-07-29T20:30:00.000Z',
    isPinned: false,
  },
  {
    id: 'note-5',
    title: 'Random',
    content: '<p>That song from the coffee shop — something about a harbour.</p>',
    categoryIds: [],
    createdAt: '2026-07-28T08:10:00.000Z',
    updatedAt: '2026-07-28T08:12:00.000Z',
    isPinned: false,
  },
  {
    id: 'note-6',
    title: 'Interview questions',
    content:
      '<p>What does the first week look like?</p><blockquote><p>Who owns the roadmap?</p></blockquote>',
    categoryIds: ['cat-work'],
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-21T15:58:00.000Z',
    isPinned: false,
  },
  {
    id: 'note-8',
    title: 'Editor kitchen sink 🧪',
    // Exercises every node and mark the editor can produce, so formatting
    // regressions show up in one place. Long on purpose — the body should
    // scroll while the toolbar stays pinned.
    content: `<h1>Everything this editor can do 🎛️</h1>
      <p>Scratch note for testing formatting 🔍 — if a style looks wrong here, it looks wrong everywhere.</p>
      <h2>Marks ✍️</h2>
      <p>Plain text, then <strong>bold 💪</strong>, <em>italic 🌊</em>, <u>underline 📎</u>, and <s>struck through 🚫</s>. They stack: <strong><em><u>all three at once 🎉</u></em></strong>. Inline code reads like <code>npm run dev</code> 💻.</p>
      <p>Line one, then a soft break 👇<br>line two, same paragraph.</p>
      <h2>Headings 🔠</h2>
      <h3>This one is an h3 🥉</h3>
      <p>Not in the toolbar, but styled in <code>index.css</code>, so pasted content still lands correctly 🎨.</p>
      <h2>Lists 📋</h2>
      <ul><li><p>Groceries 🛒</p><ul><li><p>Olive oil 🫒</p></li><li><p>Flaky salt 🧂</p></li></ul></li><li><p>Nesting works with Tab ↹</p></li><li><p>Marks survive inside items: <strong>bold 🐝</strong>, <code>code 🔤</code></p></li></ul>
      <ol><li><p>Preheat to 230°C 🔥</p></li><li><p>Dimple the dough 👐</p></li><li><p>Twenty minutes ⏲️</p></li></ol>
      <h2>Quotes 💬</h2>
      <blockquote><p>A note nobody reopens is just a very slow delete. 🗑️</p></blockquote>
      <h2>Code 🧑‍💻</h2>
      <pre><code>const greet = (name) => 'hey ' + name + ' 👋'\n\nconsole.log(greet('world'))</code></pre>
      <hr>
      <h2>Links and the rest 🔗</h2>
      <p>Links keep their own color: <a href="https://tiptap.dev/docs">the TipTap docs 📚</a>. Just above sits a horizontal rule ➖.</p>
      <p>Emoji stress test 🧵: 😀🥲😴🤖👻🐙🦑🦀🐝🦋🌵🌊🔥❄️🍕🍜🥐☕️🎧📷🧭⛵️🛰️🎲🧩🏓🥋🎯💡📌🗂️✅</p>
      <p>And a last paragraph so there is something left to scroll to 📜.</p>`,
    categoryIds: ['cat-personal'],
    createdAt: '2026-08-05T10:20:00.000Z',
    updatedAt: '2026-08-05T10:32:00.000Z',
    isPinned: false,
  },
  {
    id: 'note-7',
    title: 'Untitled',
    content: '<p></p>',
    categoryIds: [],
    createdAt: '2026-07-18T07:03:00.000Z',
    updatedAt: '2026-07-18T07:03:00.000Z',
    isPinned: false,
  },
]
