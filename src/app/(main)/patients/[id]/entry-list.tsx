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
import { cn } from "@/lib/utils";

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

  // Group entries by medicine type to find latest doses
  const latestDosesByMedicine = entries.reduce(
    (acc, entry) => {
      if (entry.type === "medicine" && entry.medicine) {
        if (
          !acc[entry.medicine] ||
          new Date(entry.recordedAt) > new Date(acc[entry.medicine].recordedAt)
        ) {
          acc[entry.medicine] = entry;
        }
      }
      return acc;
    },
    {} as Record<string, Entry>
  );

  // Calculate upcoming doses based on latest doses
  const upcomingDoses = Object.entries(latestDosesByMedicine)
    .map(([medicine, lastDose]) => {
      const config = MEDICINE_CONFIG[medicine as keyof typeof MEDICINE_CONFIG];
      if (!config) return null;

      const nextDoseTime = addHours(
        new Date(lastDose.recordedAt),
        config.interval
      );
      const now = new Date();
      const minutesUntilNext = differenceInMinutes(nextDoseTime, now);

      return {
        medicine,
        nextDoseTime,
        lastDose,
        isOverdue: minutesUntilNext < 0,
        minutesUntilNext,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.minutesUntilNext - b!.minutesUntilNext);

  // Filter medicine entries that have been given
  const dosesGiven = entries
    .filter((entry) => entry.type === "medicine" && entry.medicine)
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

  // Filter temperature entries
  const temperatures = entries
    .filter((entry) => entry.type === "temperature")
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

  const router = useRouter();

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
    <div className="space-y-8">
      {/* Upcoming Doses Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Doses</h2>
        <div className="space-y-4 relative">
          <div className="absolute left-[26px] top-8 bottom-8 w-px bg-border" />
          {upcomingDoses.map((upcomingDose) => (
            <div key={upcomingDose!.medicine} className="relative">
              <div className="w-full">
                <Card
                  className={cn(
                    "transition-colors",
                    upcomingDose!.isOverdue
                      ? "border-green-500"
                      : "border-red-500"
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 text-muted-foreground">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-lg">
                          {upcomingDose!.medicine}
                          <span className="text-muted-foreground ml-2">
                            {upcomingDose!.isOverdue
                              ? "Ready to give now"
                              : `Can give at ${format(upcomingDose!.nextDoseTime, "h:mm a")}`}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last dose given at{" "}
                          {format(
                            new Date(upcomingDose!.lastDose.recordedAt),
                            "h:mm a"
                          )}
                        </div>
                        <CreateEntryDialog
                          patientId={upcomingDose!.lastDose.patientId}
                          defaultValues={{
                            type: "medicine",
                            medicine: upcomingDose!
                              .medicine as keyof typeof MEDICINE_CONFIG,
                          }}
                        >
                          <Button variant="outline" size="sm" className="mt-2">
                            <Pill className="h-4 w-4 mr-2" />
                            Mark as Given
                          </Button>
                        </CreateEntryDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          {upcomingDoses.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No upcoming doses.
            </div>
          )}
        </div>
      </div>

      {/* Doses Given Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Doses Given</h2>
        <div className="space-y-4 relative">
          <div className="absolute left-[26px] top-8 bottom-8 w-px bg-border" />
          {dosesGiven.map((entry) => (
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
          {dosesGiven.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No doses have been given yet.
            </div>
          )}
        </div>
      </div>

      {/* Temperature Section */}
      {temperatures.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Temperature History</h2>
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
          </div>
        </div>
      )}
    </div>
  );
}
