"use client";

import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { MousePointer2, Hand, Square, Circle, ArrowRight, Pencil, Type, Sparkles, Eye, Eraser, Undo2, Redo2, Frame, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
    activeTool: string;
    onChangeActiveTool: (tool: string) => void;
    onGenerate?: () => void;
    onSyncIntelligence?: () => void;
    onReviewDesign?: () => void;
    onMakeReal?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

export const Toolbar = ({
    activeTool,
    onChangeActiveTool,
    onGenerate = () => { },
    onSyncIntelligence = () => { },
    onReviewDesign = () => { },
    onMakeReal = () => { },
    onUndo = () => { },
    onRedo = () => { }
}: ToolbarProps) => {
    return (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[200]">
            <GlassCard className="flex items-center gap-x-2 p-2 rounded-full">
                {/* Pointer (V) */}
                <ToolButton
                    label="Pointer"
                    icon={MousePointer2}
                    isActive={activeTool === "select"}
                    onClick={() => onChangeActiveTool("select")}
                    shortcut="V"
                />
                {/* Hand (H) */}
                <ToolButton
                    label="Hand"
                    icon={Hand}
                    isActive={activeTool === "hand"}
                    onClick={() => onChangeActiveTool("hand")}
                    shortcut="H"
                />
                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Square (R) */}
                <ToolButton
                    label="Square"
                    icon={Square}
                    isActive={activeTool === "rect"}
                    onClick={() => onChangeActiveTool("rect")}
                    shortcut="R"
                />
                {/* Circle (O) */}
                <ToolButton
                    label="Circle"
                    icon={Circle}
                    isActive={activeTool === "circle"}
                    onClick={() => onChangeActiveTool("circle")}
                    shortcut="O"
                />
                {/* Arrow */}
                <ToolButton
                    label="Arrow"
                    icon={ArrowRight}
                    isActive={activeTool === "arrow"}
                    onClick={() => onChangeActiveTool("arrow")}
                    shortcut="A"
                />
                {/* Pen (P) */}
                <ToolButton
                    label="Pen"
                    icon={Pencil}
                    isActive={activeTool === "pen"}
                    onClick={() => onChangeActiveTool("pen")}
                    shortcut="P"
                />

                {/* Smart Line Tool (L) */}
                <ToolButton
                    label="Smart Line"
                    icon={Minus}
                    isActive={activeTool === "line"}
                    onClick={() => onChangeActiveTool("line")}
                    shortcut="L"
                />

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Text (T) */}
                <ToolButton
                    label="Text"
                    icon={Type}
                    isActive={activeTool === "text"}
                    onClick={() => onChangeActiveTool("text")}
                    shortcut="T"
                />
                {/* Frame (F) */}
                <ToolButton
                    label="Frame"
                    icon={Frame}
                    isActive={activeTool === "frame"}
                    onClick={() => onChangeActiveTool("frame")}
                    shortcut="F"
                />
                {/* Magic Wand (G) */}
                <ToolButton
                    label="Magic Wand"
                    icon={Sparkles}
                    isActive={false}
                    onClick={onGenerate}
                    shortcut="G"
                />

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Eye (L) */}
                <ToolButton
                    label="Eye"
                    icon={Eye}
                    isActive={activeTool === "view"}
                    onClick={() => onChangeActiveTool("view")}
                />
                {/* Eraser (E) */}
                <ToolButton
                    label="Eraser"
                    icon={Eraser}
                    isActive={activeTool === "eraser"}
                    onClick={() => onChangeActiveTool("eraser")}
                    shortcut="E"
                />

                <div className="w-px h-6 bg-white/10 mx-1" />

                <ToolButton
                    label="Undo"
                    icon={Undo2}
                    isActive={false}
                    onClick={onUndo}
                />
                <ToolButton
                    label="Redo"
                    icon={Redo2}
                    isActive={false}
                    onClick={onRedo}
                />
            </GlassCard>
        </div>
    );
};

interface ToolButtonProps {
    label: string;
    icon: any;
    isActive?: boolean;
    onClick: () => void;
}

const ToolButton = ({ label, icon: Icon, isActive, onClick, shortcut }: ToolButtonProps & { shortcut?: string }) => {
    return (
        <div className="relative group">
            <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                className={cn(
                    "rounded-full transition-all hover:bg-white/10 text-white/70 hover:text-white",
                    isActive && "bg-white/20 text-white"
                )}
            >
                <Icon className="size-5" />
                <span className="sr-only">{label}</span>
            </Button>
            {shortcut && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap pointer-events-none">
                    {shortcut}
                </div>
            )}
        </div>
    )
}
