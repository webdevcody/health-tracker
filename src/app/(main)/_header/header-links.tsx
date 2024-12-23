"use client";

import { Button } from "@/components/ui/button";
import useMediaQuery from "@/hooks/use-media-query";
import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { getPatientsAction } from "../patients/actions";
import { Patient } from "@/db/schema";

export function HeaderLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  const path = usePathname();
  const { isMobile } = useMediaQuery();
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    async function fetchPatients() {
      if (isAuthenticated) {
        const result = await getPatientsAction();
        if (result[1] === null) {
          setPatients(result[0]);
        }
      }
    }
    fetchPatients();
  }, [isAuthenticated]);

  if (isMobile) return null;

  return (
    <>
      {isAuthenticated && (
        <div className="hidden md:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="link"
                className="flex items-center justify-center gap-2"
              >
                <UsersIcon className="w-4 h-4" /> Your Patients
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuItem asChild>
                <Link href="/patients" className="cursor-pointer w-full">
                  Manage All Patients
                </Link>
              </DropdownMenuItem>
              {patients.length > 0 && (
                <>
                  <DropdownMenuItem className="h-px bg-muted my-1 p-0" />
                  {patients.map((patient) => (
                    <DropdownMenuItem key={patient.id} asChild>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="cursor-pointer w-full"
                      >
                        {patient.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
}
