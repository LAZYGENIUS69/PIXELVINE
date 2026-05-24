"use client";

import { forwardRef, useImperativeHandle } from "react";
import { CanvasRenderer, CanvasRendererHandle } from "./canvas-renderer";
import { useInfinityCanvas } from "@/hooks/use-infinity-canvas";
// UI Components
import { TextEditorOverlay } from "./text-editor-overlay";
import { PropertiesSidebar } from "./properties-sidebar";
import { ContextMenu } from "./context-menu";
import { useDispatch } from "react-redux";
import { duplicateShape, removeShape, bringToFront, sendToBack } from "@/store/slices/canvasSlice";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { FrameActionsOverlay } from "./frame-actions-overlay";

export interface EditorHandle {
    captureCanvas: () => string;
    worldToScreen: (x: number, y: number) => { x: number; y: number };
    screenToWorld: (x: number, y: number) => { x: number; y: number };
}

interface EditorProps {
    projectId: string;
    initialData?: string;
    activeTool: string;
    onSelectionChange?: (selection: any) => void;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(({ projectId, initialData, activeTool, onSelectionChange }, ref) => {
    const dispatch = useDispatch();
    const parseDesignIntent = useAction(api.ai.parseDesignIntent);
    const { onMount, events, helpers, contextMenu, setContextMenu } = useInfinityCanvas(projectId, activeTool, initialData);
    const selectedShapeId = useSelector((state: RootState) => state.canvas.selectedShapeId);
    const shapes = useSelector((state: RootState) => Object.values(state.canvas.entities));


    const handleDuplicate = () => {
        if (contextMenu?.shapeId) {
            dispatch(duplicateShape(contextMenu.shapeId));
            setContextMenu(null);
        }
    };

    const handleGenerateDesign = async () => {
        if (!selectedShapeId) return;
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape || shape.type !== 'frame') return;

        // 1. Capture Canvas
        const dataUrl = helpers.captureCanvas();
        if (!dataUrl) return;

        // 2. Crop logic (Client-side)
        // We need to crop the image to the frame's bounding box
        const img = new Image();
        img.src = dataUrl;
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Get Frame in Screen Coords (Since capture is full screen)
            // Wait, captureCanvas returns STATIC layer full resolution?
            // Yes, based on canvas-renderer.
            // We need world coordinates converted to screen/canvas coordinates?
            // Actually captureCanvas is raw canvas -> 1:1 with screen pixels usually,
            // BUT we have a camera transform.
            // If captureCanvas returns the RAW static canvas, it has the transform applied?
            // No, the canvas context has the transform. The toDataURL captures the bitmap.
            // If the bitmap is full screen size, and content is drawn transformed...
            // Then we just crop the screen region.

            const screenPos = helpers.worldToScreen(shape.x, shape.y);
            // Width/Height need scaling by zoom
            // helpers.worldToScreen only gives Point.
            // We need the zoom level from the matrix.
            // Let's get the matrix from the hook helper? 
            // Or just calculate 2 points.
            const screenBottomRight = helpers.worldToScreen(shape.x + (shape.width || 0), shape.y + (shape.height || 0));
            const w = screenBottomRight.x - screenPos.x;
            const h = screenBottomRight.y - screenPos.y;

            canvas.width = w;
            canvas.height = h;

            // Draw cropped URI
            // Source X/Y is screenPos.x, screenPos.y
            ctx.drawImage(img, screenPos.x, screenPos.y, w, h, 0, 0, w, h);
            const croppedDataUrl = canvas.toDataURL('image/png');

            // 3. Send to Convex
            // We need useAction or something? 
            // We can use the exposed `parseDesignIntent` if we wrap it, 
            // but we are in a component. We need `useAction` hook.
        };

        // Wait, we need to call the mutation/action.
        // We should move this logic inside the component body where we have hooks.
    };


    const handleDelete = () => {
        if (contextMenu?.shapeId) {
            dispatch(removeShape(contextMenu.shapeId));
            setContextMenu(null);
        }
    };

    const handleBringToFront = () => {
        if (contextMenu?.shapeId) {
            dispatch(bringToFront(contextMenu.shapeId));
            setContextMenu(null);
        }
    };

    const handleSendToBack = () => {
        if (contextMenu?.shapeId) {
            dispatch(sendToBack(contextMenu.shapeId));
            setContextMenu(null);
        }
    };

    useImperativeHandle(ref, () => ({
        captureCanvas: helpers.captureCanvas,
        worldToScreen: helpers.worldToScreen,
        screenToWorld: helpers.screenToWorld
    }));

    return (
        <div className="relative w-full h-full">
            <CanvasRenderer
                // ref={ref} 
                projectId={projectId}
                initialData={initialData}
                onMount={onMount}
                {...events}
            />
            {/* UI Overlays */}
            <TextEditorOverlay worldToScreen={helpers.worldToScreen} />
            <FrameActionsOverlay
                worldToScreen={helpers.worldToScreen}
                onGenerate={handleGenerateDesign}
                onToggleInspiration={() => { console.log("Toggle Inspiration") }}
            />
            {/* PropertiesSidebar removed, handled in Page */}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onBringToFront={handleBringToFront}
                    onSendToBack={handleSendToBack}
                />
            )}
        </div>
    );
});
Editor.displayName = "Editor";
