import { database } from ".";
import { patients, Patient } from "./schema";
import { eq } from "drizzle-orm";

export async function getPatientById(id: number): Promise<Patient | undefined> {
  const [patient] = await database
    .select()
    .from(patients)
    .where(eq(patients.id, id));
  return patient;
}
