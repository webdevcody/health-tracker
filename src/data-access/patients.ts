import { eq } from "drizzle-orm";
import { database } from "@/db";
import { patients } from "@/db/schema";

export async function createPatient(userId: string, name: string) {
  await database
    .insert(patients)
    .values({
      name,
      userId: Number(userId),
    })
    .returning();
}

export async function getPatients(userId: string) {
  return await database.query.patients.findMany({
    where: eq(patients.userId, Number(userId)),
    orderBy: (patients, { asc }) => [asc(patients.id)],
  });
}
