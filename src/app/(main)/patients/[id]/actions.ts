"use server";

import { database } from "@/db";
import { entries } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createDose({
  medicine,
  patientId,
}: {
  medicine: string;
  patientId: number;
}) {
  await database.insert(entries).values({
    type: "medicine",
    medicine,
    patientId,
    recordedAt: new Date(),
  });

  revalidatePath(`/patients/${patientId}`);
}

export async function createMedicineEntry({
  medicine,
  patientId,
  recordedAt,
  previousEntryId,
}: {
  medicine: string;
  patientId: number;
  recordedAt: Date;
  previousEntryId?: number;
}) {
  await database.insert(entries).values({
    type: "medicine",
    medicine,
    patientId,
    recordedAt,
  });

  if (previousEntryId) {
    await database
      .update(entries)
      .set({ wasGiven: true })
      .where(eq(entries.id, previousEntryId));
  }

  revalidatePath(`/patients/${patientId}`);
}

export async function createTemperatureEntry({
  temperature,
  patientId,
  recordedAt,
}: {
  temperature: number;
  patientId: number;
  recordedAt: Date;
}) {
  await database.insert(entries).values({
    type: "temperature",
    temperature: temperature.toString(),
    patientId,
    recordedAt,
  });

  revalidatePath(`/patients/${patientId}`);
}

export async function deleteEntry(id: number) {
  const [entry] = await database
    .select({ patientId: entries.patientId })
    .from(entries)
    .where(eq(entries.id, id));

  await database.delete(entries).where(eq(entries.id, id));

  if (entry) {
    revalidatePath(`/patients/${entry.patientId}`);
  }
}

export async function updateEntry({
  id,
  type,
  medicine,
  temperature,
  recordedAt,
}: {
  id: number;
  type: "medicine" | "temperature";
  medicine?: string;
  temperature?: number;
  recordedAt: Date;
}) {
  await database
    .update(entries)
    .set({
      type,
      medicine: type === "medicine" ? medicine : null,
      temperature: type === "temperature" ? temperature?.toString() : null,
      recordedAt,
    })
    .where(eq(entries.id, id));

  revalidatePath(`/patients/${id}`);
}
