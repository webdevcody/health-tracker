import { getPatients, createPatient } from "@/data-access/patients";
import { UserSession } from "./types";

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
