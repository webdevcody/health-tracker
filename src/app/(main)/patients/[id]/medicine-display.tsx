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
  const givenAt = format(new Date(recordedAt), "h:mm a");

  return (
    <div className="space-y-2">
      <div className="text-lg">
        {medicine}
        <span className="text-muted-foreground">
          {" @ "}
          {givenAt}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        <div className="text-xs text-muted-foreground/75">
          Repeats every {interval} hours
        </div>
      </div>
    </div>
  );
}
