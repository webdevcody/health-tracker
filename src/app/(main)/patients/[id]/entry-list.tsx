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

function TemperatureDisplay({ temperature }: { temperature: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xl font-semibold">{temperature}°F</div>
    </div>
  );
}

function MedicineDisplay({
  medicine,
  recordedAt,
  interval,
  onGiveDose,
  isCreating,
  entryId,
  patientId,
  wasGiven,
}: {
  medicine: string;
  recordedAt: Date;
  interval: number;
  onGiveDose: () => void;
  isCreating: boolean;
  entryId: number;
  patientId: number;
  wasGiven: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { nextDoseTime, timeRemaining } = useTimeRemaining(
    recordedAt,
    interval
  );

  return (
    <div className="space-y-2">
      <div className="text-lg font-semibold">{medicine}</div>
      <div className="space-y-1 text-sm">
        <div className="text-muted-foreground">Every {interval} hours</div>
        <div className="text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span>Next dose due {format(nextDoseTime, "h:mm a")}</span>
            </div>
            {!wasGiven && (
              <CreateEntryDialog
                patientId={patientId}
                defaultValues={{
                  type: "medicine",
                  medicine: medicine as keyof typeof MEDICINE_CONFIG,
                }}
                previousEntryId={entryId}
                onOpenChange={setIsDialogOpen}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isCreating}
                  className="h-7 text-green-400"
                >
                  <Pill className="h-4 w-4 mr-1" />I Gave It
                </Button>
              </CreateEntryDialog>
            )}
          </div>
          {timeRemaining && (
            <div className="font-medium mt-1">{timeRemaining}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getNextDoseInfo(entry: Entry) {
  if (entry.type !== "medicine" || !entry.medicine) return null;

  const medicine = entry.medicine as keyof typeof MEDICINE_CONFIG;
  if (!(medicine in MEDICINE_CONFIG)) return null;

  const config = MEDICINE_CONFIG[medicine];
  const nextDoseTime = addHours(new Date(entry.recordedAt), config.interval);
  const now = new Date();
  const minutesRemaining = differenceInMinutes(nextDoseTime, now);

  return {
    nextDoseTime,
    isOverdue: minutesRemaining < 0,
    interval: config.interval,
  };
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
      {entries.map((entry) => {
        const cardStyle = (() => {
          if (entry.type === "temperature") {
            if (entry.temperature >= 102) return "border-red-500";
            if (entry.temperature >= 100) return "border-yellow-500";
            return "";
          }
          if (entry.type === "medicine") {
            const doseInfo = getNextDoseInfo(entry);
            if (doseInfo && doseInfo.isOverdue && !entry.wasGiven) {
              return "border-red-500";
            }
            if (medicineStates[entry.id]) {
              return "border-yellow-500";
            }
          }
          return "";
        })();

        return (
          <div key={entry.id} className="flex gap-4 items-start relative">
            <div className="min-w-[100px] pt-8 text-sm text-foreground flex flex-col">
              <div>{format(new Date(entry.recordedAt), "MMM d")}</div>
              <div>{format(new Date(entry.recordedAt), "h:mm a")}</div>
            </div>

            <div className="w-full">
              <Card className={`${cardStyle} transition-colors`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 text-muted-foreground">
                        {entry.type === "temperature" ? (
                          <Thermometer className="h-5 w-5" />
                        ) : (
                          <Pill className="h-5 w-5" />
                        )}
                      </div>

                      <div className="space-y-2">
                        {entry.type === "temperature" ? (
                          <TemperatureDisplay temperature={entry.temperature} />
                        ) : entry.type === "medicine" && entry.medicine ? (
                          <MedicineDisplay
                            medicine={entry.medicine}
                            recordedAt={new Date(entry.recordedAt)}
                            interval={
                              MEDICINE_CONFIG[
                                entry.medicine as keyof typeof MEDICINE_CONFIG
                              ]?.interval || 6
                            }
                            onGiveDose={() => handleCreateNewDose(entry)}
                            isCreating={creatingNewDose === entry.id}
                            entryId={entry.id}
                            patientId={entry.patientId}
                            wasGiven={entry.wasGiven}
                          />
                        ) : null}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}
