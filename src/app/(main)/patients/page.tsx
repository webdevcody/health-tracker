import { cn } from "@/lib/utils";
import { pageTitleStyles } from "@/styles/common";
import { assertAuthenticated } from "@/lib/session";
import { getPatientsUseCase } from "@/use-cases/patients";
import CreatePatientDialog from "./create-patient-dialog";
import { PatientsList } from "./patients-list";
import { PageHeader } from "@/components/page-header";

export default async function PatientsPage() {
  const user = await assertAuthenticated();

  const patients = await getPatientsUseCase(user);

  return (
    <>
      <PageHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <h1
            className={cn(pageTitleStyles, "flex justify-between items-center")}
          >
            Your Patients
          </h1>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <CreatePatientDialog />
          </div>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto my-12">
        <PatientsList patients={patients} />
      </div>
    </>
  );
}
