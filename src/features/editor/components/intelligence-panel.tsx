"use client";

import { GlassCard } from "@/components/glass-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Zap, LayoutTemplate, Type, Box, MousePointer2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DesignElement {
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label?: string;
    intent?: string;
}

interface IntelligencePanelProps {
    isAnalyzing?: boolean;
    designAST?: string; // JSON String
}

export const IntelligencePanel = ({ isAnalyzing, designAST }: IntelligencePanelProps) => {

    let elements: DesignElement[] = [];
    try {
        if (designAST) {
            const parsed = JSON.parse(designAST);
            elements = parsed.elements || [];
        }
    } catch (e) {
        console.error("Failed to parse Design AST", e);
    }

    if (!isAnalyzing && elements.length === 0) {
        return null; // Don't show if empty and not analyzing? Or show empty state? User said "populate sidebar", implying it might be there. Let's return nothing if idle and empty to save space, or maybe a small minimized indicator.
        // Actually, let's show nothing initially for "Vision Eye" vibe, appearing when needed.
    }

    return (
        <div className="absolute top-20 right-4 w-[280px] h-[calc(100vh-160px)] z-30 pointer-events-none">
            {/* Pointer events none so we can click through to canvas, but enable on the card */}
            <GlassCard className="pointer-events-auto h-full flex flex-col p-0 overflow-hidden border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-gradient-to-r from-purple-900/20 to-transparent">
                    <Zap className="size-4 text-purple-400 fill-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Vision Intelligence</h3>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        <AnimatePresence>
                            {isAnalyzing && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 text-white/50 text-xs p-2 bg-purple-500/10 rounded-lg border border-purple-500/20"
                                >
                                    <Loader2 className="size-3 animate-spin text-purple-400" />
                                    <span>Scanning Canvas...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {elements.map((el, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group flex flex-col gap-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2 text-white/90">
                                    {getIconForType(el.type)}
                                    <span className="text-xs font-medium">{el.label || el.type}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-white/40 font-mono pl-6">
                                    <span>{el.intent || "Component"}</span>
                                    <span>{Math.round(el.x)}, {Math.round(el.y)}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Scanline Animation Overlay */}
                {isAnalyzing && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <motion.div
                            initial={{ top: "-100%" }}
                            animate={{ top: "100%" }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent w-full opacity-50"
                        />
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("button")) return <MousePointer2 className="size-3 text-blue-400" />;
    if (t.includes("input") || t.includes("text")) return <Type className="size-3 text-green-400" />;
    if (t.includes("container") || t.includes("card")) return <LayoutTemplate className="size-3 text-orange-400" />;
    return <Box className="size-3 text-white/50" />;
};
