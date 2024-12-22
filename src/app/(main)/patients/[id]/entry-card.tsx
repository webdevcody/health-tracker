import { Entry } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Thermometer, Pill } from "lucide-react";
import { MEDICINE_CONFIG } from "@/config/config";
import { addHours, differenceInMinutes, format } from "date-fns";
import { TemperatureDisplay } from "./temperature-display";
import { MedicineDisplay } from "./medicine-display";
import { EditEntryDialog } from "./edit-entry-dialog";

interface EntryCardProps {
  entry: Entry;
  medicineStates: Record<number, boolean>;
  onDelete: (id: number) => void;
  onCreateNewDose: (entry: Entry) => void;
  deletingId: number | null;
  creatingNewDose: number | null;
}

export function getNextDoseInfo(entry: Entry) {
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

export function EntryCard({
  entry,
  medicineStates,
  onDelete,
  onCreateNewDose,
  deletingId,
  creatingNewDose,
}: EntryCardProps) {
  const cardStyle = (() => {
    if (entry.type === "temperature") {
      const temp = parseFloat(entry.temperature as string);
      if (temp >= 102) return "border-red-500";
      if (temp >= 100) return "border-yellow-500";
      return "";
    }
    return "";
  })();

  return (
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
                <TemperatureDisplay
                  temperature={parseFloat(entry.temperature as string)}
                  recordedAt={new Date(entry.recordedAt)}
                />
              ) : entry.type === "medicine" && entry.medicine ? (
                <MedicineDisplay
                  medicine={entry.medicine}
                  recordedAt={new Date(entry.recordedAt)}
                  interval={
                    MEDICINE_CONFIG[
                      entry.medicine as keyof typeof MEDICINE_CONFIG
                    ]?.interval || 6
                  }
                  onGiveDose={() => onCreateNewDose(entry)}
                  isCreating={creatingNewDose === entry.id}
                  entryId={entry.id}
                  patientId={entry.patientId}
                  wasGiven={entry.wasGiven}
                />
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <EditEntryDialog entry={entry} />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive/90"
              onClick={() => onDelete(entry.id)}
              disabled={deletingId === entry.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
