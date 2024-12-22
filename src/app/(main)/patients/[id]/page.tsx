import { assertAuthenticated } from "@/lib/session";
import { getPatientByIdUseCase } from "@/use-cases/patients";
import { getPatientEntriesUseCase } from "@/use-cases/entries";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { pageTitleStyles } from "@/styles/common";
import { PageHeader } from "@/components/page-header";
import { CreateEntryDialog } from "./create-entry-dialog";
import { EntryList } from "./entry-list";

interface PatientPageProps {
  params: {
    id: string;
  };
}

export default async function PatientPage({ params }: PatientPageProps) {
  await assertAuthenticated();
  const { id } = await params;
  const patientId = parseInt(id);

  const patient = await getPatientByIdUseCase(patientId);
  if (!patient) {
    notFound();
  }

  const entries = await getPatientEntriesUseCase(patientId);

  return (
    <>
      <PageHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <h1
            className={cn(pageTitleStyles, "flex justify-between items-center")}
          >
            {patient.name} {">"} Med History
          </h1>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <CreateEntryDialog patientId={patientId} />
          </div>
        </div>
      </PageHeader>

      <div className="max-w-2xl mx-auto my-12">
        <EntryList entries={entries} />
      </div>
    </>
  );
}
