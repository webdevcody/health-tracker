import { getEntriesByPatientId, createEntry, deleteEntry } from "@/db/entries";
import { Entry, NewEntry } from "@/db/schema";
import { User } from "@/db/schema";

export async function getPatientEntriesUseCase(
  patientId: number
): Promise<Entry[]> {
  return getEntriesByPatientId(patientId);
}

export async function createEntryUseCase(entry: NewEntry): Promise<Entry> {
  return createEntry(entry);
}

export async function deleteEntryUseCase(id: number): Promise<void> {
  return deleteEntry(id);
}