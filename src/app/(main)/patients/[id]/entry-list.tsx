"use client";

import { Entry } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { format, addHours, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createDose, deleteEntry as deleteEntryAction } from "./actions";
import { MEDICINE_CONFIG } from "@/config/config";
import { CreateEntryDialog } from "./create-entry-dialog";
import { EntryCard } from "./entry-card";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TemperatureContent } from "./_content/temperature";

interface EntryListProps {
  entries: Entry[];
}

export function EntryList({ entries }: EntryListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creatingNewDose, setCreatingNewDose] = useState<number | null>(null);
  const [selectedDose, setSelectedDose] = useState<{
    patientId: number;
    medicine: keyof typeof MEDICINE_CONFIG;
  } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
    <div className="space-y-8">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming Doses</TabsTrigger>
          <TabsTrigger value="past">Past Doses</TabsTrigger>
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
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
                      <div className="flex items-start justify-between">
                        {/* Left Column */}
                        <div className="flex items-start gap-4">
                          <div className="mt-1 text-muted-foreground">
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg">
                              {upcomingDose!.medicine}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Last dose at{" "}
                              {format(
                                new Date(upcomingDose!.lastDose.recordedAt),
                                "h:mm a ', ' MMM d, yyyy"
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col items-end gap-2">
                          <div
                            className={cn(
                              "text-sm",
                              upcomingDose!.isOverdue
                                ? "text-green-500"
                                : "text-red-500"
                            )}
                          >
                            {upcomingDose!.isOverdue
                              ? `Due at ${format(upcomingDose!.nextDoseTime, "h:mm a")}`
                              : `Ready after ${format(upcomingDose!.nextDoseTime, "h:mm a")}`}
                          </div>
                          {upcomingDose!.isOverdue ? (
                            <CreateEntryDialog
                              patientId={upcomingDose!.lastDose.patientId}
                              defaultValues={{
                                type: "medicine",
                                medicine: upcomingDose!
                                  .medicine as keyof typeof MEDICINE_CONFIG,
                              }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "text-green-500 border-green-500 hover:bg-green-500/10",
                                  "transition-colors"
                                )}
                              >
                                <Pill className="h-4 w-4 mr-2" />
                                Record Dose Given
                              </Button>
                            </CreateEntryDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "text-red-500 border-red-500 hover:bg-red-500/10",
                                    "transition-colors"
                                  )}
                                >
                                  <Pill className="h-4 w-4 mr-2" />
                                  Record Early Dose Given
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ⚠️ Early Dose Warning
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="space-y-2">
                                    <p>
                                      You are attempting to give{" "}
                                      {upcomingDose!.medicine} before it is due.
                                    </p>
                                    <p>
                                      Next dose should be given at{" "}
                                      {format(
                                        upcomingDose!.nextDoseTime,
                                        "h:mm a"
                                      )}
                                      .
                                    </p>
                                    <p className="font-semibold text-red-500">
                                      Giving medication too early can be
                                      dangerous. Are you sure you want to
                                      proceed?
                                    </p>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setSelectedDose({
                                        patientId:
                                          upcomingDose!.lastDose.patientId,
                                        medicine: upcomingDose!
                                          .medicine as keyof typeof MEDICINE_CONFIG,
                                      });
                                      setShowCreateDialog(true);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Yes, Record Dose Now
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
        </TabsContent>

        <TabsContent value="past" className="mt-6">
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
        </TabsContent>

        <TemperatureContent entries={entries} />
      </Tabs>

      {/* Create Entry Dialog */}
      {selectedDose && (
        <CreateEntryDialog
          patientId={selectedDose.patientId}
          defaultValues={{
            type: "medicine",
            medicine: selectedDose.medicine,
          }}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDose(null);
            }
            setShowCreateDialog(open);
          }}
          open={showCreateDialog}
        >
          <span style={{ display: "none" }} />
        </CreateEntryDialog>
      )}
    </div>
  );
}
