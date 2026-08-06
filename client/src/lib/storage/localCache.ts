import Dexie, { type Table } from "dexie";
import { getWebWorkerDB } from "dexie-worker";
import type { Note } from "src/lib/types";

const DATABASE_NAME = "SecondBrainDatabase";

type NoteRow = { id: string; data: string };
type UserDataRow = { id?: number; data: string };

class AppDatabase extends Dexie {
  /** `declare` so TS types these without emitting fields that would clobber Dexie's runtime properties. */
  declare user_data: Table<UserDataRow, number>;
  declare notes: Table<NoteRow, string>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({
      user_data: "++id",
      notes: "id",
    });
  }
}

const dbWorker = getWebWorkerDB(new AppDatabase());


// 
// Data persistence functions
// 

export async function saveNote(note: Note) {
  await dbWorker.notes.put({ id: note.id, data: JSON.stringify(note)});
}

export async function getAllSavedNotes(){
  const rawData = await dbWorker.notes.toArray();
  return rawData;
}