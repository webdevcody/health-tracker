"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreatePatientForm } from "./create-patient-form";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function CreatePatientDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const onSuccess = () => {
    setOpen(false);
    toast({
      title: "Success",
      description: "Patient created successfully",
      variant: "success",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Patient</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <CreatePatientForm onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
