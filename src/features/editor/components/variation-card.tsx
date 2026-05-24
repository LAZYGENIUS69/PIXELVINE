"use client";

import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Check, Trash2, Maximize2, Monitor, Smartphone } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface VariationCardProps {
    id: Id<"inspirationVariations">;
    name: string;
    style: string;
    type: "web" | "mobile";
    isApplied: boolean;
    isGenerating?: boolean;
    onApply: () => void;
    onDelete: () => void;
    onPreview: () => void;
}

const styleGradients: Record<string, string> = {
    "Minimalist": "from-gray-100 to-gray-300",
    "High-Contrast": "from-black to-gray-800",
    "Glassmorphic": "from-blue-100/50 to-purple-100/50",
    "Bento Grid": "from-orange-100 to-amber-100",
};

const styleIcons: Record<string, React.ReactNode> = {
    "Minimalist": <div className="w-8 h-8 rounded-full border-2 border-gray-400" />,
    "High-Contrast": <div className="w-8 h-8 rounded-full bg-black border-2 border-white" />,
    "Glassmorphic": <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur border border-white/50" />,
    "Bento Grid": <div className="w-8 h-8 rounded-lg bg-orange-400 grid grid-cols-2 gap-0.5 p-1" />,
};

export const VariationCard = ({
    id,
    name,
    style,
    type,
    isApplied,
    isGenerating,
    onApply,
    onDelete,
    onPreview,
}: VariationCardProps) => {
    const gradient = styleGradients[style] || "from-purple-100 to-blue-100";
    const icon = styleIcons[style] || <Sparkles className="w-5 h-5 text-white/70" />;

    return (
        <GlassCard
            className={cn(
                "p-3 relative group transition-all duration-300",
                isApplied && "ring-2 ring-purple-500/50 bg-purple-500/10"
            )}
        >
            {/* Preview Thumbnail */}
            <div
                className={cn(
                    "w-full aspect-[4/3] rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 relative overflow-hidden cursor-pointer",
                    gradient
                )}
                onClick={onPreview}
            >
                {/* Type Icon */}
                <div className="absolute top-2 right-2">
                    {type === "web" ? (
                        <Monitor className="w-3 h-3 text-black/40" />
                    ) : (
                        <Smartphone className="w-3 h-3 text-black/40" />
                    )}
                </div>

                {/* Style Icon */}
                <div className="flex flex-col items-center gap-2">
                    {icon}
                    <span className="text-[10px] font-medium text-black/60 uppercase tracking-wider">
                        {style}
                    </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
                </div>

                {/* Loading State */}
                {isGenerating && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Card Content */}
            <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                            {name}
                        </h4>
                        <p className="text-xs text-white/50">
                            {style} • {type}
                        </p>
                    </div>
                    {isApplied && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button
                        onClick={onApply}
                        disabled={isGenerating}
                        size="sm"
                        className={cn(
                            "flex-1 h-8 text-xs",
                            isApplied
                                ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                    >
                        {isApplied ? (
                            <>
                                <Check className="w-3 h-3 mr-1" />
                                Applied
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                Apply
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onDelete}
                        disabled={isGenerating}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-white/50 hover:text-red-400 hover:bg-red-500/10"
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
};

// Skeleton loader for loading states
export const VariationCardSkeleton = () => {
    return (
        <GlassCard className="p-3">
            <div className="w-full aspect-[4/3] rounded-lg bg-white/5 animate-pulse mb-3" />
            <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
                <div className="flex gap-2 pt-1">
                    <div className="h-8 flex-1 bg-white/10 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-white/10 rounded animate-pulse" />
                </div>
            </div>
        </GlassCard>
    );
};
