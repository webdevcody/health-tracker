import { getPatients, createPatient } from "@/data-access/patients";
import { UserSession } from "./types";
import { getPatientById } from "@/db/patients";
import { Patient } from "@/db/schema";

export async function createPatientUseCase(
  authenticatedUser: UserSession,
  {
    name,
  }: {
    name: string;
  }
) {
  await createPatient(authenticatedUser.id.toString(), name);
}

export async function getPatientsUseCase(authenticatedUser: UserSession) {
  return await getPatients(authenticatedUser.id.toString());
}

export async function getPatientByIdUseCase(
  id: number
): Promise<Patient | undefined> {
  return getPatientById(id);
}
