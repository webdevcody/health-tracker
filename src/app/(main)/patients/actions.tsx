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
