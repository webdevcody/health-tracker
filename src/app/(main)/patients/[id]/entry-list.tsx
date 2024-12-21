"use client";

import { Entry } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { format, addHours, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MEDICINE_CONFIG = {
  Motrin: { interval: 6 },
  Tylenol: { interval: 4 },
  "Cough Medicine": { interval: 4 },
} as const;

interface EntryListProps {
  entries: Entry[];
}

export function EntryList({ entries }: EntryListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  function getNextDoseInfo(entry: Entry) {
    if (entry.type !== "medicine" || !entry.medicine) return null;

    const medicine = entry.medicine as keyof typeof MEDICINE_CONFIG;
    if (!(medicine in MEDICINE_CONFIG)) return null;

    const config = MEDICINE_CONFIG[medicine];
    const nextDoseTime = addHours(new Date(entry.recordedAt), config.interval);
    const now = new Date();
    const isDue = isBefore(nextDoseTime, now);

    return {
      nextDoseTime,
      isDue,
      interval: config.interval,
    };
  }

  async function deleteEntry(id: number) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete entry");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setDeletingId(null);
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

        return (
          <Card key={entry.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {entry.type === "temperature" ? (
                      <span>Temperature: {entry.temperature}°F</span>
                    ) : (
                      <div className="space-y-1">
                        <div>Medicine: {entry.medicine}</div>
                        {doseInfo && (
                          <div className="text-sm">
                            <div>Interval: Every {doseInfo.interval} hours</div>
                            <div
                              className={
                                doseInfo.isDue
                                  ? "text-destructive font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              Next dose: {format(doseInfo.nextDoseTime, "PPpp")}
                              {doseInfo.isDue && " (Due now)"}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Recorded: {format(new Date(entry.recordedAt), "PPpp")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/90"
                  onClick={() => deleteEntry(entry.id)}
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
