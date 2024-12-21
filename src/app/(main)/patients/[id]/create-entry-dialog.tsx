"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createMedicineEntry, createTemperatureEntry } from "./actions";
import { MEDICINE_CONFIG } from "@/config/config";
import { format } from "date-fns";

const MEDICINES = Object.keys(
  MEDICINE_CONFIG
) as (keyof typeof MEDICINE_CONFIG)[];

const formSchema = z
  .object({
    type: z.enum(["medicine", "temperature"]),
    temperature: z.number().optional(),
    medicine: z.enum(MEDICINES).optional(),
    time: z.string().min(1, "Time is required"),
  })
  .refine(
    (data) => {
      if (data.type === "temperature") {
        return data.temperature !== undefined;
      }
      if (data.type === "medicine") {
        return data.medicine !== undefined;
      }
      return false;
    },
    {
      message: "Please fill in the required field based on the selected type",
    }
  );

interface CreateEntryDialogProps {
  patientId: number;
}

export function CreateEntryDialog({ patientId }: CreateEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "medicine",
      time: format(new Date(), "HH:mm"),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const now = new Date();
      const [hours, minutes] = values.time.split(":").map(Number);
      const recordedAt = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes
      );

      if (values.type === "medicine") {
        await createMedicineEntry({
          patientId,
          medicine: values.medicine!,
          recordedAt,
        });
      } else {
        await createTemperatureEntry({
          patientId,
          temperature: values.temperature!,
          recordedAt,
        });
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Entry</Button>
      </DialogTrigger>

      <DialogContent aria-describedby={undefined} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Entry</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entry type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "temperature" && (
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Enter temperature"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("type") === "medicine" && (
              <FormField
                control={form.control}
                name="medicine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medicine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEDICINES.map((medicine) => (
                          <SelectItem key={medicine} value={medicine}>
                            {medicine} (Every{" "}
                            {MEDICINE_CONFIG[medicine].interval} hours)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Entry"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
