"use client";

import { Button } from "@/components/ui/button";
import useMediaQuery from "@/hooks/use-media-query";
import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  const path = usePathname();
  const { isMobile } = useMediaQuery();

  if (isMobile) return null;

  return (
    <>
      {isAuthenticated && (
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant={"link"}
            asChild
            className="flex items-center justify-center gap-2"
          >
            <Link href={"/patients"}>
              <UsersIcon className="w-4 h-4" /> Your Patients
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
