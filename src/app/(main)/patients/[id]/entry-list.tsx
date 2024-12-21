"use client";

import { Entry } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { format, addHours, isBefore, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Thermometer, Pill, Plus, Timer } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDose, deleteEntry as deleteEntryAction } from "./actions";

const MEDICINE_CONFIG = {
  Motrin: { interval: 6 },
  Tylenol: { interval: 4 },
  "Cough Medicine": { interval: 4 },
} as const;

interface EntryListProps {
  entries: Entry[];
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
  doseInfo,
  onGiveDose,
  isCreating,
}: {
  medicine: string;
  doseInfo: ReturnType<typeof getNextDoseInfo>;
  onGiveDose: () => void;
  isCreating: boolean;
}) {
  if (!doseInfo) return null;

  return (
    <div className="space-y-2">
      <div className="text-lg font-semibold">{medicine}</div>
      <div className="space-y-1 text-sm">
        <div className="text-muted-foreground">
          Every {doseInfo.interval} hours
        </div>
        <div
          className={
            doseInfo.isDue
              ? "text-destructive font-medium"
              : "text-muted-foreground"
          }
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {!doseInfo.isDue && <Timer className="h-4 w-4 animate-spin" />}
              <span>Next: {format(doseInfo.nextDoseTime, "h:mm a")}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onGiveDose}
              disabled={isCreating}
              className="h-7"
            >
              <Plus className="h-4 w-4 mr-1" />
              Dose Given
            </Button>
          </div>
          <div className="font-medium mt-1">{doseInfo.timeRemaining}</div>
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
  const isDue = isBefore(nextDoseTime, now);
  const minutesRemaining = differenceInMinutes(nextDoseTime, now);
  const hoursRemaining = Math.floor(Math.abs(minutesRemaining) / 60);
  const minsRemaining = Math.abs(minutesRemaining) % 60;
  const timeRemaining =
    minutesRemaining < 0
      ? `Overdue by ${hoursRemaining}h ${minsRemaining}m`
      : `${hoursRemaining}h ${minsRemaining}m remaining`;

  return {
    nextDoseTime,
    isDue,
    interval: config.interval,
    timeRemaining,
  };
}

export function EntryList({ entries }: EntryListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creatingNewDose, setCreatingNewDose] = useState<number | null>(null);
  const router = useRouter();

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
    <div className="space-y-4">
      {entries.map((entry) => {
        const doseInfo =
          entry.type === "medicine" ? getNextDoseInfo(entry) : null;

        const cardStyle = (() => {
          if (entry.type === "temperature") {
            if (entry.temperature >= 102) return "border-red-500";
            if (entry.temperature >= 100) return "border-yellow-500";
            return "";
          }
          if (entry.type === "medicine" && doseInfo) {
            return doseInfo.isDue ? "border-green-500" : "border-yellow-500";
          }
          return "";
        })();

        return (
          <Card key={entry.id} className={cardStyle}>
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
                    ) : (
                      <MedicineDisplay
                        medicine={entry.medicine!}
                        doseInfo={doseInfo}
                        onGiveDose={() => handleCreateNewDose(entry)}
                        isCreating={creatingNewDose === entry.id}
                      />
                    )}
                    <div className="text-sm text-muted-foreground">
                      Recorded:{" "}
                      {format(new Date(entry.recordedAt), "MMM d, h:mm a")}
                    </div>
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
        );
      })}
    </div>
  );
}
