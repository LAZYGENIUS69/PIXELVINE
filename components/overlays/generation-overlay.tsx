"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const DEFAULT_STEPS = [
    "Analyzing wireframe layout...",
    "Extracting moodboard aesthetics...",
    "Reading your design instructions...",
    "Composing high-fidelity components...",
    "Applying design tokens & typography...",
    "Polishing the final design...",
];

interface GenerationOverlayProps {
    /** Real-time progress from the Design Agent pipeline */
    progress?: {
        completed: number;
        total: number;
        percent: number;
    };
    /** Current screen name being generated */
    currentScreenName?: string;
    /** Job status: "analyzing" | "designing" | "done" | "error" */
    status?: string;
    /** Project ID to allow cancellation */
    projectId?: string;
}

export const GenerationOverlay = ({
    progress,
    currentScreenName,
    status,
    projectId,
}: GenerationOverlayProps) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [dots, setDots] = useState(".");
    const cancelJobs = useMutation(api.generationJobs.cancel);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % DEFAULT_STEPS.length);
        }, 3500);
        return () => clearInterval(stepInterval);
    }, []);

    useEffect(() => {
        const dotInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
        }, 500);
        return () => clearInterval(dotInterval);
    }, []);

    const handleCancel = async () => {
        if (projectId) {
            try {
                await cancelJobs({ projectId: projectId as Id<"projects"> });
            } catch (e) {
                console.error("Cancel failed", e);
            }
        }
    };

    // Determine display text
    const isAgentMode = !!progress;
    const displayText = isAgentMode
        ? status === "analyzing"
            ? "AI Architect is planning your screens..."
            : currentScreenName
                ? `Designing "${currentScreenName}"...`
                : "Generating designs..."
        : DEFAULT_STEPS[stepIndex];

    const progressPercent = isAgentMode
        ? progress.percent
        : ((stepIndex + 1) / DEFAULT_STEPS.length) * 100;

    const progressLabel = isAgentMode && progress.total > 0
        ? `Screen ${progress.completed + 1} of ${progress.total}`
        : null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
                <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-500/8 blur-[100px] animate-pulse delay-700" />
            </div>

            {/* Cancel button */}
            <button
                onClick={handleCancel}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all duration-200"
                title="Cancel generation"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative flex flex-col items-center gap-8 max-w-md text-center px-8">
                {/* Sparkle icon */}
                <div className="relative">
                    <div className="absolute inset-0 animate-ping">
                        <Sparkles className="w-12 h-12 text-purple-400/30" />
                    </div>
                    <Sparkles className="w-12 h-12 text-purple-400 animate-spin" style={{ animationDuration: "3s" }} />
                </div>

                {/* Title */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-white tracking-tight">
                        Generating your design{dots}
                    </h2>
                    <p className="text-sm text-white/40 leading-relaxed transition-all duration-500">
                        {displayText}
                    </p>
                    {progressLabel && (
                        <p className="text-xs text-purple-300/60 font-medium">
                            {progressLabel}
                        </p>
                    )}
                </div>

                {/* Progress bar */}
                <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <p className="text-[10px] text-white/20 uppercase tracking-widest">
                    Powered by Kimi K2.5 · NVIDIA NIM
                </p>
            </div>
        </div>
    );
};
