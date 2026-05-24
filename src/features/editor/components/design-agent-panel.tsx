"use client";

import React, { useState, useRef } from "react";
import { GlassCard } from "@/components/glass-card";
import AIPreview from "@/components/AIPreview";
import { Button } from "@/components/ui/button";
import { Download, Image, X, Maximize2, Minimize2, CheckCircle2, Loader2, AlertCircle, Clock, Square } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { saveAs } from "file-saver";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Frame {
    _id: string;
    name: string;
    purpose: string;
    htmlContent: string;
    status: "pending" | "generating" | "done" | "error";
    order: number;
}

interface DesignAgentPanelProps {
    frames: Frame[];
    progress: { completed: number; total: number; percent: number };
    isRunning: boolean;
    isDone: boolean;
    onClose: () => void;
    projectId: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3 text-white/30" />,
    generating: <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />,
    done: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
    error: <AlertCircle className="w-3 h-3 text-red-400" />,
};

export const DesignAgentPanel = ({
    frames,
    progress,
    isRunning,
    isDone,
    onClose,
    projectId,
}: DesignAgentPanelProps) => {
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);
    const cancelJobs = useMutation(api.generationJobs.cancel);
    const deleteFrame = useMutation(api.frames.deleteFrame);

    const handleCancel = async () => {
        try {
            await cancelJobs({ projectId: projectId as Id<"projects"> });
        } catch (e) {
            console.error("Cancel failed", e);
        }
        onClose();
    };

    const handleDeleteFrame = async (frameId: string, index: number) => {
        try {
            await deleteFrame({ id: frameId as Id<"frames"> });
            // Move active index down if needed
            setActiveFrameIndex((prev) => (prev >= index && prev > 0 ? prev - 1 : prev));
        } catch (e) {
            console.error("Delete frame failed", e);
        }
    };

    const activeFrame = frames[activeFrameIndex];

    const handleExportPng = async () => {
        if (!previewRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(previewRef.current, { pixelRatio: 2 });
            const link = document.createElement("a");
            link.download = `${activeFrame?.name || "screen"}-${projectId}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Export failed", e);
        }
    };

    const handleDownloadCode = () => {
        if (!activeFrame?.htmlContent) return;
        const blob = new Blob([activeFrame.htmlContent], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `${activeFrame.name || "screen"}-${projectId}.tsx`);
    };

    if (frames.length === 0) return null;

    return (
        <div
            className={`absolute z-50 transition-all duration-300 ${isFullScreen
                ? "inset-4 w-auto h-auto"
                : "bottom-4 right-4 w-[480px] h-[360px]"
                }`}
        >
            <GlassCard className="h-full p-0 flex flex-col overflow-hidden border-white/10 bg-black/80 backdrop-blur-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-white/80">
                            Design Agent
                        </span>
                        {isRunning && (
                            <span className="text-[10px] text-purple-300 animate-pulse flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {progress.completed}/{progress.total} screens
                            </span>
                        )}
                        {isDone && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {progress.total} screens ready
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {isRunning && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-400/10 gap-1"
                                onClick={handleCancel}
                                title="Stop generation"
                            >
                                <Square className="w-2.5 h-2.5 fill-current" />
                                Stop
                            </Button>
                        )}
                        {activeFrame?.htmlContent && (
                            <>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-white/40 hover:text-white/80"
                                    onClick={handleExportPng}
                                    title="Export PNG"
                                >
                                    <Image className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-white/40 hover:text-white/80"
                                    onClick={handleDownloadCode}
                                    title="Download Code"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </Button>
                            </>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-white/40 hover:text-white/80"
                            onClick={() => setIsFullScreen(!isFullScreen)}
                        >
                            {isFullScreen ? (
                                <Minimize2 className="w-3.5 h-3.5" />
                            ) : (
                                <Maximize2 className="w-3.5 h-3.5" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-white/40 hover:text-red-400"
                            onClick={onClose}
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Tab bar — screen names */}
                <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-hide">
                    {frames.map((frame, i) => (
                        <div
                            key={frame._id}
                            className={`group flex items-center gap-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${i === activeFrameIndex
                                    ? "bg-white/10 text-white"
                                    : "text-white/35 hover:text-white/60 hover:bg-white/5"
                                }`}
                        >
                            <button
                                onClick={() => setActiveFrameIndex(i)}
                                className="flex items-center gap-1.5 px-2.5 py-1"
                            >
                                {STATUS_ICON[frame.status]}
                                {frame.name}
                            </button>
                            {/* Delete this screen */}
                            {!isRunning && (
                                <button
                                    onClick={() => handleDeleteFrame(frame._id, i)}
                                    title={`Delete "${frame.name}" permanently`}
                                    className="opacity-0 group-hover:opacity-100 pr-1.5 text-white/25 hover:text-red-400 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Preview area */}
                <div ref={previewRef} className="flex-1 overflow-hidden relative bg-black/90">
                    {activeFrame?.status === "done" && activeFrame.htmlContent ? (
                        <div className="absolute inset-0 overflow-auto">
                            <div
                                className={`${isFullScreen ? "min-h-full min-w-full" : "w-full h-full"
                                    } bg-white text-black`}
                            >
                                <AIPreview code={activeFrame.htmlContent} />
                            </div>
                        </div>
                    ) : activeFrame?.status === "generating" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-3">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                                <p className="text-xs text-white/40">
                                    Designing "{activeFrame.name}"...
                                </p>
                            </div>
                        </div>
                    ) : activeFrame?.status === "error" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-2">
                                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                                <p className="text-xs text-white/40">
                                    Failed to generate this screen
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-2">
                                <Clock className="w-6 h-6 text-white/20 mx-auto" />
                                <p className="text-[11px] text-white/25">Waiting...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {isRunning && (
                    <div className="h-0.5 bg-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700 ease-out"
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
