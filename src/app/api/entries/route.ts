import { createEntryUseCase } from "@/use-cases/entries";
import { assertAuthenticated } from "@/lib/session";
import { NextResponse } from "next/server";
import * as z from "zod";

const MEDICINE_CONFIG = {
  Motrin: { interval: 6 },
  Tylenol: { interval: 4 },
  "Cough Medicine": { interval: 4 },
} as const;

const MEDICINES = Object.keys(
  MEDICINE_CONFIG
) as (keyof typeof MEDICINE_CONFIG)[];

const createEntrySchema = z
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
      message: "Please fill in the required field based on the selected type",
    }
  );

export async function POST(request: Request) {
  try {
    await assertAuthenticated();

    const json = await request.json();
    const body = createEntrySchema.parse(json);

    const entry = await createEntryUseCase(body);

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
