"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { Dashboard } from "@/src/features/dashboard/components/dashboard";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/hooks/use-mock-auth";

export default function Home() {
  const { isAuthenticated, isLoading } = useMockAuth();
  const router = useRouter();
  const projects = useQuery(api.projects.getRecent);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/Auth/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="size-8 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--background)] text-white/50">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--background)]">
      <main className="p-8">
        <Dashboard projects={projects ?? []} />
      </main>
    </div>
  );
}
