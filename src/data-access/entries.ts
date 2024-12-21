import { database } from "../db";
import { entries, Entry, NewEntry } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getEntriesByPatientId(
  patientId: number
): Promise<Entry[]> {
  return database.query.entries.findMany({
    where: eq(entries.patientId, patientId),
    orderBy: (entries, { desc }) => [desc(entries.recordedAt)],
  });
}

export async function createEntry(entry: NewEntry): Promise<Entry> {
  const [newEntry] = await database.insert(entries).values(entry).returning();
  return newEntry;
}

export async function deleteEntry(id: number): Promise<void> {
  await database.delete(entries).where(eq(entries.id, id));
}
