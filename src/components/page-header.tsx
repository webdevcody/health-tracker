import { ReactNode } from "react";

export function PageHeader({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-200 dark:bg-slate-900 py-12">
      <div className="container max-w-4xl">{children}</div>
    </div>
  );
}
