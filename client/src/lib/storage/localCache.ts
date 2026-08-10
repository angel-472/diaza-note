import Dexie, { type Table } from "dexie";
import { getWebWorkerDB } from "dexie-worker";
import type { Note, Category } from "src/lib/types";

const DATABASE_NAME = "SecondBrainDatabase";

type NoteRow = { id: string; data: string };
type UserDataRow = { id?: string; data: string };

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

export async function deleteNote(noteId: string) {
  await dbWorker.notes.delete(noteId);
}

export async function getAllSavedNotes(){
  const rawData = await dbWorker.notes.toArray();
  return rawData;
}

export async function saveCategories(categories: Category[]){
  await dbWorker.user_data.put({id: 'categories', data: JSON.stringify(categories)})
}

export async function getCategories(){
  const rawData = await dbWorker.user_data.get({id: 'categories'});
  if(rawData == undefined){
    return [];
  }
  return JSON.parse(rawData.data);
}