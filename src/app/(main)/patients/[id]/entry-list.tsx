"use client";

import { Entry } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { format, addHours, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Thermometer, Pill, Plus, ThumbsUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createDose, deleteEntry as deleteEntryAction } from "./actions";
import { MEDICINE_CONFIG } from "@/config/config";
import { CreateEntryDialog } from "./create-entry-dialog";
import { EntryCard } from "./entry-card";

interface EntryListProps {
  entries: Entry[];
}

function useTimeRemaining(recordedAt: Date, intervalHours: number) {
  const [timeInfo, setTimeInfo] = useState(() => {
    const nextDoseTime = addHours(new Date(recordedAt), intervalHours);
    const now = new Date();
    const minutesRemaining = differenceInMinutes(nextDoseTime, now);
    const hoursRemaining = Math.floor(Math.abs(minutesRemaining) / 60);
    const minsRemaining = Math.abs(minutesRemaining) % 60;

    return {
      nextDoseTime,
      timeRemaining:
        minutesRemaining > 0
          ? `${hoursRemaining}h ${minsRemaining}m remaining`
          : null,
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const nextDoseTime = addHours(new Date(recordedAt), intervalHours);
      const now = new Date();
      const minutesRemaining = differenceInMinutes(nextDoseTime, now);
      const hoursRemaining = Math.floor(Math.abs(minutesRemaining) / 60);
      const minsRemaining = Math.abs(minutesRemaining) % 60;

      setTimeInfo({
        nextDoseTime,
        timeRemaining:
          minutesRemaining > 0
            ? `${hoursRemaining}h ${minsRemaining}m remaining`
            : null,
      });
    }, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [recordedAt, intervalHours]);

  return timeInfo;
}

export function EntryList({ entries }: EntryListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creatingNewDose, setCreatingNewDose] = useState<number | null>(null);

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

  useEffect(() => {
    setMedicineStates(initializeMedicineStates(entries));
  }, [entries, initializeMedicineStates]);

  const router = useRouter();

  // Track time remaining states with useEffect at the list level
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    entries.forEach((entry) => {
      if (
        entry.type === "medicine" &&
        entry.medicine &&
        entry.medicine in MEDICINE_CONFIG
      ) {
        const interval = setInterval(() => {
          const nextDoseTime = addHours(
            new Date(entry.recordedAt),
            MEDICINE_CONFIG[entry.medicine as keyof typeof MEDICINE_CONFIG]
              .interval
          );
          const minutesRemaining = differenceInMinutes(
            nextDoseTime,
            new Date()
          );

          setMedicineStates((prev) => ({
            ...prev,
            [entry.id]: minutesRemaining > 0,
          }));
        }, 1000 * 60); // Update every minute

        intervals.push(interval);
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [entries]);

  async function handleDeleteEntry(id: number) {
    try {
      setDeletingId(id);
      await deleteEntryAction(id);
      router.refresh();
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
      router.refresh();
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
    <div className="space-y-4 relative">
      <div className="absolute left-[26px] top-8 bottom-8 w-px bg-border" />
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-4 items-start relative">
          <div className="min-w-[100px] pt-8 text-sm text-foreground flex flex-col">
            <div>{format(new Date(entry.recordedAt), "MMM d")}</div>
            <div>{format(new Date(entry.recordedAt), "h:mm a")}</div>
          </div>

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
    </div>
  );
}
