import { database } from ".";
import { entries, Entry, NewEntry } from "./schema";
import { desc, eq } from "drizzle-orm";

export async function getEntriesByPatientId(
  patientId: number
): Promise<Entry[]> {
  return database
    .select()
    .from(entries)
    .where(entries.patientId === patientId)
    .orderBy(desc(entries.recordedAt));
}

export async function createEntry(entry: NewEntry): Promise<Entry> {
  const [newEntry] = await database.insert(entries).values(entry).returning();
  return newEntry;
}

export async function deleteEntry(id: number): Promise<void> {
  await database.delete(entries).where(eq(entries.id, id));
}
