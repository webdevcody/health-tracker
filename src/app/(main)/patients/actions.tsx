"use server";

import { authenticatedAction } from "@/lib/safe-action";
import { createPatientUseCase, getPatientsUseCase } from "@/use-cases/patients";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const createPatientAction = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      name: z.string(),
    })
  )
  .handler(async ({ input, ctx }) => {
    await createPatientUseCase(ctx.user, { name: input.name });
    revalidatePath(`/patients`);
  });

export const getPatientsAction = authenticatedAction
  .createServerAction()
  .input(z.void())
  .handler(async ({ ctx }) => {
    return await getPatientsUseCase(ctx.user);
  });

const MEDICINES = [
  "Motrin",
  "Tylenol",
  "Cough Medicine",
  "SMZ",
  "Gabapentin",
  "Lorazepam",
  "Hydromorphone",
  "Clindamycin",
] as const;

export const createEntryAction = authenticatedAction
  .createServerAction()
  .input(
    z
      .object({
        patientId: z.number(),
        type: z.enum(["medicine", "temperature"]),
        temperature: z.number().optional(),
        medicine: z.enum(MEDICINES).optional(),
      })
      .refine(
        (data) => {
          if (data.type === "temperature") {
            return data.temperature !== undefined;
          }
          if (data.type === "medicine") {
            return data.medicine !== undefined;
          }
          return false;
        },
        {
          message:
            "Please fill in the required field based on the selected type",
        }
      )
  )
  .handler(async ({ input, ctx }) => {
    const res = await fetch(`${process.env.API_URL}/api/entries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error("Failed to create entry");
    }

    revalidatePath(`/patients/${input.patientId}`);
  });
