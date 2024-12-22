import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";
import { format } from "date-fns";
import { CreateEntryDialog } from "./create-entry-dialog";
import { MEDICINE_CONFIG } from "@/config/config";
import { useTimeRemaining } from "./hooks/use-time-remaining";

interface MedicineDisplayProps {
  medicine: string;
  recordedAt: Date;
  interval: number;
  onGiveDose: () => void;
  isCreating: boolean;
  entryId: number;
  patientId: number;
  wasGiven: boolean;
}

export function MedicineDisplay({
  medicine,
  recordedAt,
  interval,
  onGiveDose,
  isCreating,
  entryId,
  patientId,
  wasGiven,
}: MedicineDisplayProps) {
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
