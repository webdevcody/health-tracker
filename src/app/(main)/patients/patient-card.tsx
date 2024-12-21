import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/db/schema";
import Link from "next/link";

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-blue-500 text-lg font-semibold">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-lg">
              <Link
                href={`/patients/${patient.id}`}
                className="hover:underline cursor-pointer"
              >
                {patient.name}
              </Link>
            </h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
