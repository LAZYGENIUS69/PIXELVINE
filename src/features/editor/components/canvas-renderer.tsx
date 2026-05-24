"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface CanvasRendererHandle {
    captureCanvas: () => string;
    worldToScreen: (x: number, y: number) => { x: number; y: number };
    screenToWorld: (x: number, y: number) => { x: number; y: number };
}

interface CanvasRendererProps {
    projectId: string;
    initialData?: string;
    onMount: (
        staticCanvas: HTMLCanvasElement,
        activeCanvas: HTMLCanvasElement,
        container: HTMLDivElement
    ) => void;
    onPointerDown?: (e: React.PointerEvent) => void;
    onPointerMove?: (e: React.PointerEvent) => void;
    onPointerUp?: (e: React.PointerEvent) => void;
    onPointerLeave?: (e: React.PointerEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
}

export const CanvasRenderer = forwardRef<CanvasRendererHandle, CanvasRendererProps>(
    ({ projectId, initialData, onMount, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onDrop, onDragOver, onDoubleClick }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const staticCanvasRef = useRef<HTMLCanvasElement>(null);
        const activeCanvasRef = useRef<HTMLCanvasElement>(null);

        useImperativeHandle(ref, () => ({
            captureCanvas: () => {
                // Combine canvases for capture if needed, or just capture static
                // For now returning static as a placeholder, logic usually involves drawing both to a temp canvas
                if (!staticCanvasRef.current) return "";
                return staticCanvasRef.current.toDataURL("image/png");
            },
            worldToScreen: (x, y) => {
                // Placeholder - implementation will be injected or handled via hook state
                // Actually, the hook handles the logic. The renderer just provides the DOM.
                // We might need to expose the matrix from the hook back to here, 
                // OR better, the hook should attach these methods to the ref passed to it.
                // For this architecture, we'll let the hook override/implement these if possible,
                // or we accept them as props? 
                // Wait, the plan was the hook manages the matrix. 
                // So the hook should probably expose these functions. 
                // But the parent holds the ref.
                // Let's stick to the plan: Renderer is a wrapper. 
                // The HOOK will return these functions or we pass the ref TO the hook.
                return { x, y };
            },
            screenToWorld: (x, y) => {
                return { x, y };
            }
        }));

        useEffect(() => {
            const container = containerRef.current;
            const staticCanvas = staticCanvasRef.current;
            const activeCanvas = activeCanvasRef.current;

            if (container && staticCanvas && activeCanvas) {
                // Set explicit width/height to match container size
                // This prevents the "black screen" or blurry rendering issues
                const width = container.clientWidth;
                const height = container.clientHeight;

                staticCanvas.width = width;
                staticCanvas.height = height;
                activeCanvas.width = width;
                activeCanvas.height = height;

                onMount(staticCanvas, activeCanvas, container);

                // Optional: Handle Resize
                const handleResize = () => {
                    const newWidth = container.clientWidth;
                    const newHeight = container.clientHeight;
                    staticCanvas.width = newWidth;
                    staticCanvas.height = newHeight;
                    activeCanvas.width = newWidth;
                    activeCanvas.height = newHeight;
                    // Note: We might need to re-draw or notify the hook about resize here
                    // But strictly solving the "black screen on mount" issue.
                };
                window.addEventListener("resize", handleResize);
                return () => window.removeEventListener("resize", handleResize);
            }
        }, [onMount]);

        return (
            <div
                ref={containerRef}
                className="relative w-full h-screen overflow-hidden bg-[#050505]"
                style={{ touchAction: "none" }} // Prevent native browser scaling/scrolling
                tabIndex={0} // Make focusable for paste events
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerLeave}
                onDoubleClick={onDoubleClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
            >
                {/* Static Layer (Grid, Shapes) */}
                <canvas
                    ref={staticCanvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]"
                />

                {/* Active Layer (Selection, Dragging, Interaction) */}
                <canvas
                    ref={activeCanvasRef}
                    className="absolute top-0 left-0 w-full h-full z-50"
                />
            </div>
        );
    }
);

CanvasRenderer.displayName = "CanvasRenderer";
