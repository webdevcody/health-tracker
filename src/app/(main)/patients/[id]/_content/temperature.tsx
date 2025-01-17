
"use client";

import { Entry } from "@/db/schema";
import { addHours, differenceInMinutes } from "date-fns";
import { useState, useCallback } from "react";
import { createDose, deleteEntry as deleteEntryAction } from "../actions";
import { MEDICINE_CONFIG } from "@/config/config";
import { EntryCard } from "../entry-card";
import { TabsContent } from "@/components/ui/tabs";

interface EntryListProps {
  entries: Entry[];
}

export function TemperatureContent({ entries }: EntryListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creatingNewDose, setCreatingNewDose] = useState<number | null>(null);

  // Filter temperature entries
  const temperatures = entries
    .filter((entry) => entry.type === "temperature")
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

  const initializeMedicineStates = useCallback((entries: Entry[]) => {
    const initialStates: Record<number, boolean> = {};
    entries.forEach((entry) => {
      if (entry.type === "medicine" && entry.medicine) {
        const interval =
          MEDICINE_CONFIG[entry.medicine as keyof typeof MEDICINE_CONFIG]
            ?.interval || 6;
        const nextDoseTime = addHours(new Date(entry.recordedAt), interval);
        const minutesRemaining = differenceInMinutes(nextDoseTime, new Date());
        initialStates[entry.id] = minutesRemaining > 0;
      }
    });
    return initialStates;
  }, []);

  const [medicineStates, setMedicineStates] = useState<Record<number, boolean>>(
    () => initializeMedicineStates(entries)
  );

  async function handleDeleteEntry(id: number) {
    try {
      setDeletingId(id);
      await deleteEntryAction(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateNewDose(entry: Entry) {
    if (entry.type !== "medicine" || !entry.medicine) return;

    try {
      setCreatingNewDose(entry.id);
      await createDose({
        medicine: entry.medicine,
        patientId: entry.patientId,
      });

      // Scroll to top after creating new dose
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error creating new dose:", error);
    } finally {
      setCreatingNewDose(null);
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No entries found. Add your first entry using the button above.
      </div>
    );
  }

  return (
    <TabsContent value="temperature" className="mt-6">
      <div className="space-y-4 relative">
        <div className="absolute left-[26px] top-8 bottom-8 w-px bg-border" />
        {temperatures.map((entry) => (
          <div key={entry.id} className="relative">
            <div className="w-full">
              <EntryCard
                entry={entry}
                medicineStates={medicineStates}
                onDelete={handleDeleteEntry}
                onCreateNewDose={handleCreateNewDose}
                deletingId={deletingId}
                creatingNewDose={creatingNewDose}
              />
            </div>
          </div>
        ))}
        {temperatures.length === 0 && (
          <div className="text-muted-foreground text-sm">
            No temperature readings recorded yet.
          </div>
        )}
      </div>
    </TabsContent>
  );
}
