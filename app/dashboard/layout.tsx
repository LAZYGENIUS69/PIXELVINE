"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { useMockAuth } from "@/hooks/use-mock-auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading } = useMockAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/Auth/sign-in");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return null; // Handled by global provider, but safe fallback
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return <DashboardWrapper>{children}</DashboardWrapper>;
}

function DashboardWrapper({ children }: { children: React.ReactNode }) {
    // In Mock Mode, we might skip the user store if it fails without real token
    // But let's try to keep it if possible, or wrap in try/catch
    const storeUser = useMutation(api.users.store);

    useEffect(() => {
        // Only run if we had a real identity. In mock mode, this might throw if not careful.
        // For now, let's skip storeUser in purely mock frontend mode unless we mock the backend auth too.
        // storeUser({}); 
    }, [storeUser]);

    return <>{children}</>;
}
