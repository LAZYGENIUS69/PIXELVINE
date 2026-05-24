"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Copy, Wand2, Lightbulb, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FrameActionsOverlayProps {
    worldToScreen: (x: number, y: number) => { x: number; y: number };
    onGenerate: () => void;
    onToggleInspiration: () => void;
}

export const FrameActionsOverlay = ({ worldToScreen, onGenerate, onToggleInspiration }: FrameActionsOverlayProps) => {
    const { selectedShapeId, entities, viewport } = useSelector((state: RootState) => state.canvas);

    if (!selectedShapeId) return null;

    const shape = entities[selectedShapeId];
    if (!shape || shape.type !== 'frame') return null;

    // Calculate position: Top-Right of the frame
    // We want the buttons to sit *outside* the frame, aligned to top-right
    const screenPos = worldToScreen(shape.x + (shape.width || 0), shape.y);

    // Offset slightly higher and to the left to align nicely
    const top = screenPos.y - 40;
    const left = screenPos.x;

    return (
        <div
            style={{
                position: 'absolute',
                top: top,
                left: left,
                transform: 'translateX(-100%)', // Anchor to right
                display: 'flex',
                gap: '8px',
                zIndex: 200, // Above canvas, below some modals
                pointerEvents: 'auto'
            }}
        >
            <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-2 bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 shadow-sm"
                onClick={onToggleInspiration}
            >
                <Lightbulb className="w-3 h-3 text-yellow-500" />
                Inspiration
            </Button>

            <Button
                variant="default" // Primary color
                size="sm"
                className="h-8 text-xs gap-2 shadow-sm"
                onClick={onGenerate}
            >
                <Wand2 className="w-3 h-3" />
                Generate Design
            </Button>
        </div>
    );
};
