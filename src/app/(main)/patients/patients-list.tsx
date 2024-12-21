"use client";

import { Patient } from "@/db/schema";
import { PatientCard } from "./patient-card";

export function PatientsList({ patients }: { patients: Patient[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}
