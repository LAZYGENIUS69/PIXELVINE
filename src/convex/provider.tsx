"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { Loader2 } from "lucide-react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Internal component to handle loading state
function AuthLoadingWrapper({ children }: { children: ReactNode }) {
    const { isLoading } = useMockAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <>{children}</>;
}

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
    return (
        <ConvexProvider client={convex}>
            <AuthLoadingWrapper>{children}</AuthLoadingWrapper>
        </ConvexProvider>
    );
}

export const ConvexClientProvider = ConvexAuthProvider;

