import { deleteEntryUseCase } from "@/use-cases/entries";
import { assertAuthenticated } from "@/lib/session";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAuthenticated();
    await deleteEntryUseCase(parseInt(params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete entry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
