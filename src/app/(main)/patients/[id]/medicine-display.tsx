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
  return (
    <div className="space-y-2">
      <div className="text-lg">{medicine}</div>
      <div className="text-sm text-muted-foreground">
        Given at {format(recordedAt, "h:mm a ', ' MMM d, yyyy")}
      </div>
      <div className="text-xs text-muted-foreground/75">
        Repeats every {interval} hours
      </div>
    </div>
  );
}
