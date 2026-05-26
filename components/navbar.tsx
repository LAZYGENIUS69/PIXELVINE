"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { Button } from "./ui/button";
import { UserButton } from "@/src/features/auth/components/user-button";
import { Sparkles, LayoutGrid, MousePointer2 } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { Id } from "../convex/_generated/dataModel";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { cn } from "@/lib/utils";

export const Navbar = () => {
    // REAL AUTH (Commented out for Mock Mode)
    // const { isAuthenticated, isLoading } = useConvexAuth();
    // const { signIn } = useAuthActions();

    // MOCK AUTH
    const { isAuthenticated, isLoading, signIn } = useMockAuth();

    const pathname = usePathname();
    const params = useParams();

    // Fetch user data for credits
    const user = useQuery(api.users.current);

    // Check if we are in the editor
    const projectId = params.projectId as Id<"projects"> | undefined;
    const project = useQuery(api.projects.get, projectId ? { id: projectId } : "skip");

    const isEditor = pathname?.includes("/project/") && projectId;
    const isDashboard = pathname?.includes("/dashboard");

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center">
            <nav className={cn(
                "flex h-16 w-[90%] max-w-5xl items-center justify-between rounded-full border border-white/10 px-6 shadow-2xl backdrop-blur-md transition-all duration-300",
                "bg-black/60 supports-[backdrop-filter]:bg-black/40"
            )}>
                <div className="flex items-center">
                    <Link href="/" className="mr-8 flex items-center space-x-2 group">
                        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-transform group-hover:scale-105">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="hidden font-bold tracking-tight text-white sm:inline-block">
                            PixelVine
                        </span>
                    </Link>

                    {isAuthenticated && (
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            <Link
                                href="/dashboard"
                                className={`transition-colors hover:text-white ${isDashboard ? "text-white font-semibold" : "text-zinc-400"}`}
                            >
                                Dashboard
                            </Link>
                        </nav>
                    )}
                </div>

                {/* Center - Project Title in Editor */}
                {isEditor && project && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                        <div className="items-center gap-2 hidden md:flex">
                            <MousePointer2 className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm font-semibold text-zinc-200">{project.name}</span>
                            <span className="text-[10px] font-mono text-zinc-500 border border-white/5 bg-white/5 px-2 py-0.5 rounded-full">
                                v1.0
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-4">
                    {isLoading ? (
                        <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                    ) : isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            {/* Credits Badge */}
                            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
                                <Sparkles className="h-3 w-3" />
                                <span>{user?.credits ?? 0} Credits</span>
                            </div>

                            {!isEditor && (
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="sm" className="hidden sm:flex text-zinc-300 hover:text-white hover:bg-white/5 rounded-full">
                                        <LayoutGrid className="mr-2 h-4 w-4" />
                                        Projects
                                    </Button>
                                </Link>
                            )}
                            <UserButton />
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() => signIn("google")}
                            className="rounded-full bg-white text-black hover:bg-zinc-200 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Login
                            <Sparkles className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </nav>
        </div>
    );
};
