"use client";

import { GlassCard } from "@/components/glass-card";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InspirationBoard } from "./InspirationBoard";

interface LeftSidebarProps {
    projectId: string;
    collapsed: boolean;
    onToggle: () => void;
    onGenerateStart?: () => void;
    onGenerateComplete?: () => void;
}

export const LeftSidebar = ({ 
    projectId, 
    collapsed, 
    onToggle,
    onGenerateStart,
    onGenerateComplete
}: LeftSidebarProps) => {
    return (
        <div
            className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 h-[calc(100vh-160px)] transition-all duration-300 z-[100] rounded-r-xl border-y border-r border-white/10",
                collapsed ? "w-12" : "w-[320px]"
            )}
        >
            <GlassCard className="h-full p-0 flex flex-col overflow-hidden relative">
                <Button
                    onClick={onToggle}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-50 hover:bg-white/10 text-white/70"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </Button>

                {!collapsed && (
                    <div className="flex-1 overflow-hidden">
                        <InspirationBoard
                            projectId={projectId}
                            onGenerateStart={onGenerateStart}
                            onGenerateComplete={onGenerateComplete}
                        />
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
