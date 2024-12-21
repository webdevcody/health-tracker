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

export async function createTemperature({
  temperature,
  patientId,
}: {
  temperature: number;
  patientId: number;
}) {
  await database.insert(entries).values({
    type: "temperature",
    temperature: temperature.toString(),
    patientId,
    recordedAt: new Date(),
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
