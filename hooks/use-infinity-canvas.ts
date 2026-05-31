
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
// Persistence is handled exclusively by syncMiddleware — no direct Convex calls here
import {
    updateShape,
    addShape,
    selectShape,
    setHoveredShape,
    removeShape,
    Shape,
    setShapes,
    setInteracting,
    setDragging,
    setEditingShape,
    forceSync
} from "../store/slices/canvasSlice";
import { RootState } from "../store/store";

// Helper for Matrix Transformation
const transformPoint = (x: number, y: number, matrix: DOMMatrix) => {
    return new DOMPoint(x, y).matrixTransform(matrix);
};

const invertTransformPoint = (x: number, y: number, matrix: DOMMatrix) => {
    return new DOMPoint(x, y).matrixTransform(matrix.inverse());
};

const drawGrid = (ctx: CanvasRenderingContext2D, matrix: DOMMatrix, width: number, height: number, zoom: number) => {
    const cellSize = 50;
    const startX = Math.floor(invertTransformPoint(0, 0, matrix).x / cellSize) * cellSize;
    const endX = Math.ceil(invertTransformPoint(width, 0, matrix).x / cellSize) * cellSize;
    const startY = Math.floor(invertTransformPoint(0, 0, matrix).y / cellSize) * cellSize;
    const endY = Math.ceil(invertTransformPoint(0, height, matrix).y / cellSize) * cellSize;

    ctx.save();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1 / zoom;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += cellSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += cellSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
    }
    ctx.stroke();
    ctx.restore();
};

const getHandleAtPosition = (wx: number, wy: number, shape: Shape, zoom: number): string | null => {
    const handleRadius = 10 / zoom; // Hit area
    let lx = wx - shape.x;
    let ly = wy - shape.y;

    if (shape.rotation) {
        const rad = -shape.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const nx = lx * cos - ly * sin;
        const ny = lx * sin + ly * cos;
        lx = nx;
        ly = ny;
    }

    const w = shape.width || (shape.type === 'image' ? 200 : (shape.radius ? shape.radius * 2 : 0));
    const h = shape.height || (shape.type === 'image' ? 200 : (shape.radius ? shape.radius * 2 : 0));

    const handles = {
        nw: { x: 0, y: 0 },
        n: { x: w / 2, y: 0 },
        ne: { x: w, y: 0 },
        w: { x: 0, y: h / 2 },
        e: { x: w, y: h / 2 },
        sw: { x: 0, y: h },
        s: { x: w / 2, y: h },
        se: { x: w, y: h }
    };

    for (const [key, pos] of Object.entries(handles)) {
        const dx = lx - pos.x;
        const dy = ly - pos.y;
        if (dx * dx + dy * dy <= handleRadius * handleRadius) return key;
    }
    return null;
};

export const useInfinityCanvas = (
    projectId: string,
    activeTool: string,
    initialData?: string
) => {
    const dispatch = useDispatch();
    // saveSketches removed — middleware handles all persistence

    // Cursor Effect
    useEffect(() => {
        if (!containerRef.current) return;
        if (activeTool === 'hand') {
            containerRef.current.style.cursor = 'grab';
        } else {
            containerRef.current.style.cursor = 'default';
        }
    }, [activeTool]);

    // Canvas Refs
    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // State
    const shapes = useSelector((state: RootState) => Object.values(state.canvas.entities));
    const selectedShapeId = useSelector((state: RootState) => state.canvas.selectedShapeId);

    // Matrix State (Refs for performance)
    const currentMatrix = useRef(new DOMMatrix());
    const targetMatrix = useRef(new DOMMatrix());
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const dragStartPos = useRef({ x: 0, y: 0 }); // World coords
    const dragOffset = useRef({ x: 0, y: 0 }); // Offset from shape origin to mouse
    const activeShapeId = useRef<string | null>(null);
    const styleGuide = useSelector((state: RootState) => state.styleGuide); // Access Style Guide
    const currentPath = useRef<{ x: number; y: number }[]>([]);
    const needsStaticUpdate = useRef(true); // Optimization flag
    const imageCache = useRef<Record<string, HTMLImageElement>>({});
    const isHydrated = useRef(false); // Prevent re-hydration from useQuery updates
    const lastHoveredId = useRef<string | null>(null); // Throttle hover dispatches

    // Resize State
    const isResizing = useRef(false);
    const resizeHandle = useRef<string | null>(null);
    const resizeStartShape = useRef<Shape | null>(null);
    const resizeStartBounds = useRef({ x: 0, y: 0, width: 0, height: 0, rotation: 0 });
    const resizePreviewBounds = useRef<{ x: number; y: number; width: number; height: number; rotation?: number } | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string | null } | null>(null);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const rect = containerRef.current!.getBoundingClientRect();
        const worldPos = invertTransformPoint(
            e.clientX - rect.left,
            e.clientY - rect.top,
            currentMatrix.current
        );

        let hitId = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(worldPos.x, worldPos.y, shapes[i])) {
                hitId = shapes[i].id;
                break;
            }
        }

        if (hitId) {
            dispatch(selectShape(hitId));
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                shapeId: hitId
            });
        } else {
            setContextMenu(null);
        }
    }, [shapes, dispatch]);

    // FLICKER FIX Ref
    const dragOffsetDisplay = useRef({ x: 0, y: 0 });

    // LERP Loop
    const requestRef = useRef<number | null>(null);
    const LERP_FACTOR = 0.15;

    // --- RENDER LOOP ---
    const render = useCallback(() => {
        if (!staticCanvasRef.current || !activeCanvasRef.current) return;

        const ctxStatic = staticCanvasRef.current.getContext("2d");
        const ctxActive = activeCanvasRef.current.getContext("2d");

        // Safety Check
        if (!ctxStatic || !ctxActive || !currentMatrix.current) return;

        // Sync Current to Target (LERP)
        const cur = currentMatrix.current;
        const tgt = targetMatrix.current;
        let matrixChanged = false;

        // Uniform Scale LERP
        if (Math.abs(tgt.a - cur.a) > 0.0001 || Math.abs(tgt.e - cur.e) > 0.1 || Math.abs(tgt.f - cur.f) > 0.1) {
            cur.a += (tgt.a - cur.a) * LERP_FACTOR;
            cur.d = cur.a; // Uniform scale
            cur.e += (tgt.e - cur.e) * LERP_FACTOR;
            cur.f += (tgt.f - cur.f) * LERP_FACTOR;
            matrixChanged = true;
        } else {
            // Snap if close
            if (cur.a !== tgt.a || cur.e !== tgt.e || cur.f !== tgt.f) {
                cur.a = tgt.a;
                cur.d = tgt.d;
                cur.e = tgt.e;
                cur.f = tgt.f;
                matrixChanged = true;
            }
        }

        const width = staticCanvasRef.current.width;
        const height = staticCanvasRef.current.height;

        // --- DRAW STATIC LAYER ---
        // Only redraw static if matrix changed OR explicit request (e.g. shape added/removed/selected)
        if (matrixChanged || needsStaticUpdate.current) {
            // Clear
            ctxStatic.setTransform(1, 0, 0, 1, 0, 0);
            ctxStatic.clearRect(0, 0, width, height);

            // Apply World Transform
            ctxStatic.setTransform(cur.a, 0, 0, cur.d, cur.e, cur.f);

            // Draw Grid
            drawGrid(ctxStatic, cur, width, height, cur.a);

            // Draw Shapes (Sort: Frames First)
            const sortedShapes = [...shapes].sort((a, b) => {
                const aIsFrame = a.type === 'frame' ? 0 : 1;
                const bIsFrame = b.type === 'frame' ? 0 : 1;
                return aIsFrame - bIsFrame;
            });

            sortedShapes.forEach(shape => {
                if (shape.visible === false) return;

                // FLICKER FIX: Skip dragged shape AND its children in Static Layer
                if (isDragging.current && selectedShapeId) {
                    if (shape.id === selectedShapeId) return; // Skip dragged shape

                    // Skip children of dragged FRAME
                    if (shape.parentId === selectedShapeId) return;
                }

                drawShape(ctxStatic, shape);
            });

            needsStaticUpdate.current = false;
        }

        // --- DRAW ACTIVE LAYER ---
        // Always redraw active layer (animations, drag, selection)
        ctxActive.setTransform(1, 0, 0, 1, 0, 0);
        ctxActive.clearRect(0, 0, width, height);

        ctxActive.setTransform(cur.a, 0, 0, cur.d, cur.e, cur.f);

        // Draw Selected Shape (Drag Preview)
        if (selectedShapeId) {
            const shape = shapes.find(s => s.id === selectedShapeId);
            if (shape) {
                if (activeTool !== 'view') {
                    // FLICKER FIX: Apply activeDragDelta to render
                    const dx = dragOffsetDisplay.current?.x || 0;
                    const dy = dragOffsetDisplay.current?.y || 0;

                    let movedShape = {
                        ...shape,
                        x: shape.x + dx,
                        y: shape.y + dy,
                        endX: shape.type === 'arrow' ? (shape.endX || shape.x) + dx : undefined,
                        endY: shape.type === 'arrow' ? (shape.endY || shape.y) + dy : undefined
                    };

                    // RESIZE PREVIEW OVERRIDE
                    if (isResizing.current && resizePreviewBounds.current && shape.id === resizeStartShape.current?.id) {
                        movedShape = {
                            ...movedShape,
                            ...resizePreviewBounds.current
                        };
                    }

                    drawShape(ctxActive, movedShape);

                    // ALSO Draw Children if Frame
                    if (shape.type === 'frame') {
                        shapes.forEach(child => {
                            if (child.parentId === shape.id) {
                                const movedChild = {
                                    ...child,
                                    x: child.x + dx,
                                    y: child.y + dy,
                                    endX: child.type === 'arrow' ? (child.endX || child.x) + dx : undefined,
                                    endY: child.type === 'arrow' ? (child.endY || child.y) + dy : undefined
                                };
                                drawShape(ctxActive, movedChild);
                            }
                        });
                    }

                    drawSelectionOverlay(ctxActive, movedShape, cur.a);
                }
            }
        }

        // Draw Current Path (Pen Tool)
        if (currentPath.current.length > 0) {
            ctxActive.save();
            ctxActive.setTransform(cur.a, 0, 0, cur.d, cur.e, cur.f); // Ensure transform is applied
            ctxActive.beginPath();
            const points = currentPath.current;
            ctxActive.moveTo(points[0].x, points[0].y);
            // Simple Polyline for preview
            for (let i = 1; i < points.length; i++) {
                ctxActive.lineTo(points[i].x, points[i].y);
            }
            ctxActive.strokeStyle = "#FFF"; // Default pen color
            ctxActive.lineWidth = 2 / cur.a; // Constant visual width
            ctxActive.stroke();
            ctxActive.restore();
        }

        requestRef.current = requestAnimationFrame(render);
    }, [shapes, selectedShapeId, activeTool]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(render);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [render]);


    // --- HELPERS ---
    // Improved Hit Test for Rotated Shapes
    const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
        // Transform point to shape's local space
        // 1. Translate back by shape origin
        const dx = x - shape.x;
        const dy = y - shape.y;

        // 2. Rotate by -angle
        const angleRad = -(shape.rotation || 0) * Math.PI / 180;
        const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
        const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

        // 3. Check AABB at (0,0)
        // 3. Check AABB
        if (shape.type === 'arrow' || shape.type === 'line') {
            const ex = (shape.endX || shape.x) - shape.x;
            const ey = (shape.endY || shape.y) - shape.y;

            const minX = Math.min(0, ex) - 5;
            const maxX = Math.max(0, ex) + 5;
            const minY = Math.min(0, ey) - 5;
            const maxY = Math.max(0, ey) + 5;

            return localX >= minX && localX <= maxX && localY >= minY && localY <= maxY;
        }

        const w = shape.width || (shape.radius ? shape.radius * 2 : 0);
        const h = shape.height || (shape.radius ? shape.radius * 2 : 0);

        return localX >= 0 && localX <= w && localY >= 0 && localY <= h;
    };

    const drawShape = (ctx: CanvasRenderingContext2D, shape: any) => {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate((shape.rotation || 0) * Math.PI / 180);

        ctx.fillStyle = shape.fill || "transparent";
        ctx.strokeStyle = shape.stroke || "transparent";
        ctx.lineWidth = shape.strokeWidth || 0;

        if (shape.type === 'rect' || shape.type === 'frame') {

            // Frame: Semi-transparent dark fill
            if (shape.type === 'frame') {
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(0, 0, shape.width, shape.height, 12);
                } else {
                    // Fallback for older browsers
                    const r = 12;
                    ctx.moveTo(r, 0);
                    ctx.lineTo(shape.width - r, 0);
                    ctx.quadraticCurveTo(shape.width, 0, shape.width, r);
                    ctx.lineTo(shape.width, shape.height - r);
                    ctx.quadraticCurveTo(shape.width, shape.height, shape.width - r, shape.height);
                    ctx.lineTo(r, shape.height);
                    ctx.quadraticCurveTo(0, shape.height, 0, shape.height - r);
                    ctx.lineTo(0, r);
                    ctx.quadraticCurveTo(0, 0, r, 0);
                    ctx.closePath();
                }

                ctx.fillStyle = "rgba(30, 30, 30, 0.5)";
                ctx.fill();

                // 2px Light Grey Border
                ctx.lineWidth = (2) / (currentMatrix.current.a || 1);
                ctx.strokeStyle = "#E5E5E5";
                ctx.stroke();

                // Label pinned OUTSIDE top-left
                ctx.fillStyle = "#A1A1AA"; // Zinc-400 (Smoother grey)
                ctx.font = "12px Inter";
                ctx.fillText(shape.label || "Frame", 4, -8);
            } else {
                // Rect
                ctx.fillRect(0, 0, shape.width, shape.height);
                if (shape.strokeWidth) {
                    ctx.strokeStyle = shape.stroke || "#E5E5E5";
                    ctx.lineWidth = shape.strokeWidth;
                    ctx.strokeRect(0, 0, shape.width, shape.height);
                }
            }

        } else if (shape.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, shape.radius || 50, 0, 2 * Math.PI);
            ctx.fill();
            if (shape.strokeWidth) ctx.stroke();
        } else if (shape.type === 'path' && shape.path) {
            const p = new Path2D(shape.path);
            ctx.stroke(p);
            if (shape.fill && shape.fill !== 'transparent') ctx.fill(p);
        } else if (shape.type === 'text' && shape.content) {
            ctx.font = `${shape.fontWeight || 400} ${shape.fontSize || 16}px ${shape.fontFamily || 'Inter'}`;
            ctx.textBaseline = "top";

            if (shape.fill) ctx.fillStyle = shape.fill;
            ctx.fillText(shape.content, 0, 0);

        } else if (shape.type === 'image' && shape.content) {
            // Draw Image
            let img = imageCache.current[shape.content];
            if (!img) {
                img = new Image();
                img.src = shape.content;
                img.onload = () => {
                    // Sync Natural Dimensions if missing or default
                    if (!shape.width || !shape.height || (shape.width === 200 && shape.height === 200)) {
                        dispatch(updateShape({
                            id: shape.id,
                            changes: {
                                width: img.naturalWidth,
                                height: img.naturalHeight
                            }
                        }));
                    }
                    needsStaticUpdate.current = true;
                };
                imageCache.current[shape.content] = img;
            }

            if (img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, 0, 0, shape.width || 200, shape.height || 200);
            } else {
                // Placeholder
                ctx.fillStyle = "#333";
                ctx.fillRect(0, 0, shape.width || 200, shape.height || 200);
                ctx.fillStyle = "#FFF";
                ctx.fillText("Loading...", 10, 20);
            }
        } else if (shape.type === 'arrow' || shape.type === 'line') {
            // Draw vector from (0,0) to relative end
            // Start is 0,0 (at shape.x, shape.y)
            // End is (endX - x, endY - y)

            const dx = (shape.endX || shape.x) - shape.x;
            const dy = (shape.endY || shape.y) - shape.y;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(dx, dy);
            ctx.strokeStyle = shape.stroke || '#fff';
            ctx.lineWidth = shape.strokeWidth || 2;
            ctx.stroke();

            // Strict arrowhead conditional: lines never render heads.
            const arrowHeadSize = shape.arrowHeadSize !== undefined ? shape.arrowHeadSize : 20;
            if (shape.type === 'arrow' && arrowHeadSize > 0) {
                const headLength = shape.arrowHeadSize !== undefined ? shape.arrowHeadSize : 20;
                const angle = Math.atan2(dy, dx);

                ctx.beginPath();
                ctx.moveTo(dx, dy);
                ctx.lineTo(
                    dx - headLength * Math.cos(angle - Math.PI / 6),
                    dy - headLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    dx - headLength * Math.cos(angle + Math.PI / 6),
                    dy - headLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.lineTo(dx, dy);
                ctx.fillStyle = shape.fill || shape.stroke || '#fff';
                ctx.fill();
            }
        }


        ctx.restore();
    };

    const drawSelectionOverlay = (ctx: CanvasRenderingContext2D, shape: any, zoom: number) => {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate((shape.rotation || 0) * Math.PI / 180);

        const isLocked = shape.locked;

        // Border
        ctx.strokeStyle = isLocked ? "#FF4444" : "#0066FF"; // Red if locked
        ctx.lineWidth = 1 / zoom;

        // ARROW SELECTION (Line + Handles)
        if (shape.type === 'arrow' || shape.type === 'line') {
            const dx = (shape.endX || shape.x) - shape.x;
            const dy = (shape.endY || shape.y) - shape.y;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(dx, dy);
            ctx.stroke();

            if (!isLocked) {
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#0066FF";
                const r = 5 / zoom;
                [{ x: 0, y: 0 }, { x: dx, y: dy }].forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                });
            }
        } else {
            // STANDARD BOX SELECTION
            const w = shape.width || (shape.type === 'image' ? 200 : (shape.radius ? shape.radius * 2 : 0));
            const h = shape.height || (shape.type === 'image' ? 200 : (shape.radius ? shape.radius * 2 : 0));

            if (shape.type === 'frame') {
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(0, 0, w, h, 12);
                } else {
                    const r = 12;
                    ctx.moveTo(r, 0);
                    ctx.lineTo(w - r, 0);
                    ctx.quadraticCurveTo(w, 0, w, r);
                    ctx.lineTo(w, h - r);
                    ctx.quadraticCurveTo(w, h, w - r, h);
                    ctx.lineTo(r, h);
                    ctx.quadraticCurveTo(0, h, 0, h - r);
                    ctx.lineTo(0, r);
                    ctx.quadraticCurveTo(0, 0, r, 0);
                    ctx.closePath();
                }
                ctx.stroke();
            } else {
                ctx.strokeRect(0, 0, w, h);
            }

            // Handles (Only if NOT locked)
            if (!isLocked) {
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#0066FF";
                ctx.lineWidth = 1 / zoom;
                const handleRadius = 5 / zoom;

                const coords = [
                    { x: 0, y: 0 }, { x: w / 2, y: 0 }, { x: w, y: 0 },
                    { x: w, y: h / 2 }, { x: w, y: h }, { x: w / 2, y: h },
                    { x: 0, y: h }, { x: 0, y: h / 2 }
                ];

                coords.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, handleRadius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                });
            }
        }

        ctx.restore();
    };


    // --- EVENTS ---
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();

        if (e.ctrlKey) {
            // ZOOM
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const scaleMultiplier = 1 + delta;

            // Current Transform
            const m = targetMatrix.current;

            // Point under mouse in World Space
            const rect = containerRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const pt = invertTransformPoint(mouseX, mouseY, m);

            // Apply Scale
            m.translateSelf(pt.x, pt.y)
                .scaleSelf(scaleMultiplier, scaleMultiplier)
                .translateSelf(-pt.x, -pt.y);

        } else {
            // PAN
            targetMatrix.current.translateSelf(-e.deltaX, -e.deltaY);
        }
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Input Focus Bridge
        if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;

        // Ensure keyboard shortcuts work and canvas can receive paste events
        window.focus();

        // Focus the container so it can receive paste events
        if (containerRef.current) {
            containerRef.current.focus();
        }

        const rect = containerRef.current!.getBoundingClientRect();
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        const worldPos = invertTransformPoint(
            e.clientX - rect.left,
            e.clientY - rect.top,
            currentMatrix.current
        );

        if (activeTool === 'view') return; // Ignore interactions

        // Pointer Capture to ensure drag continues outside window
        containerRef.current?.setPointerCapture(e.pointerId);

        if (activeTool === 'hand') {
            isDragging.current = true;
            containerRef.current!.style.cursor = 'grabbing';
            // No selection changes
        } else if (activeTool === 'select' || activeTool === 'eraser') {
            // RESIZE CHECK
            if (activeTool === 'select' && selectedShapeId) {
                const shape = shapes.find(s => s.id === selectedShapeId);
                if (shape && !shape.locked) {
                    const handle = getHandleAtPosition(worldPos.x, worldPos.y, shape, currentMatrix.current.a);
                    if (handle) {
                        isResizing.current = true;
                        resizeHandle.current = handle;
                        resizeStartShape.current = shape;
                        resizeStartBounds.current = {
                            x: shape.x, y: shape.y,
                            width: shape.width || (shape.radius ? shape.radius * 2 : 0),
                            height: shape.height || (shape.radius ? shape.radius * 2 : 0),
                            rotation: shape.rotation || 0
                        };
                        isDragging.current = true;
                        dispatch(setInteracting(true));
                        dragStartPos.current = { x: worldPos.x, y: worldPos.y };
                        containerRef.current?.setPointerCapture(e.pointerId);
                        return;
                    }
                }
            }

            // Hit Test (Reverse Z-Order)
            let hitId = null;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (shapes[i].visible === false) continue; // Skip invisible
                if (isPointInShape(worldPos.x, worldPos.y, shapes[i])) {
                    hitId = shapes[i].id;
                    break;
                }
            }

            if (activeTool === 'eraser') {
                if (hitId) {
                    const s = shapes.find(sh => sh.id === hitId);
                    if (s && !s.locked) { // Cannot erase locked
                        dispatch(removeShape(hitId));
                        isDragging.current = true;
                    }
                }
                return;
            }

            dispatch(selectShape(hitId));
            if (hitId) {
                const shape = shapes.find(s => s.id === hitId);
                if (shape) {
                    // LOCKED LOGIC: Select but don't drag
                    if (!shape.locked) {
                        isDragging.current = true;
                        dispatch(setInteracting(true));
                        // Absolute Offset Calculation
                        dragOffset.current = {
                            x: worldPos.x - shape.x,
                            y: worldPos.y - shape.y
                        };
                        // FLICKER FIX: Reset Display Delta
                        dragOffsetDisplay.current = { x: 0, y: 0 };
                        needsStaticUpdate.current = true; // Remove shape from static layer
                    }
                    activeShapeId.current = hitId;
                }
            } else {
                dispatch(selectShape(null));
            }
        } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'frame') {
            // CREATE SHAPE
            const newId = crypto.randomUUID();

            let label = undefined;
            if (activeTool === 'frame') {
                const frameCount = shapes.filter(s => s.type === 'frame').length;
                label = `Frame ${frameCount + 1}`;
            }

            if (activeTool === 'frame') {
                const frameShape: Shape = {
                    id: newId,
                    type: 'frame',
                    x: worldPos.x,
                    y: worldPos.y,
                    width: 0,
                    height: 0,
                    fill: 'transparent',
                    stroke: '#4B5563', // Grey-600
                    strokeWidth: 2, // Visible border
                    radius: 0,
                    label: label,
                    children: [] // Initialize empty children array
                };
                dispatch(addShape(frameShape));
            } else {
                const newShape: Shape = {
                    id: newId,
                    type: activeTool,
                    x: worldPos.x,
                    y: worldPos.y,
                    width: 0,
                    height: 0,
                    fill: activeTool === 'rect' ? '#333' : 'transparent',
                    stroke: '#fff',
                    strokeWidth: 2,
                    radius: 0
                };
                dispatch(addShape(newShape));
            }

            dispatch(selectShape(newId));
            activeShapeId.current = newId;
            isDragging.current = true;
            dragStartPos.current = { x: worldPos.x, y: worldPos.y };
        } else if (activeTool === 'arrow' || activeTool === 'line') {
            // CREATE ARROW OR LINE
            const newId = crypto.randomUUID();
            const newShape: Shape = {
                id: newId,
                type: activeTool as 'arrow' | 'line',
                x: worldPos.x,
                y: worldPos.y,
                endX: worldPos.x,
                endY: worldPos.y,
                width: 0,
                height: 0,
                stroke: '#fff',
                strokeWidth: 2,
                fill: '#fff' // Arrow head fill
            };
            dispatch(addShape(newShape));
            dispatch(selectShape(newId));
            activeShapeId.current = newId;
            isDragging.current = true;
            dragStartPos.current = { x: worldPos.x, y: worldPos.y };
        } else if (activeTool === 'magic_pen') {
            // Wand is action-triggered from UI/shortcuts, not a drawing mode.
            return;
        } else if (activeTool === 'text') {
            // CREATE TEXT
            const newId = crypto.randomUUID();

            // Measure text approximate size
            // For better precision we should use the canvas context, but here we can estimate
            // or just set a default and let the renderer handle bounds later
            const fontSize = 24;
            const text = ""; // Start empty as requested
            const estimatedWidth = text.length * (fontSize * 0.6);

            const newShape: Shape = {
                id: newId,
                type: 'text',
                x: worldPos.x,
                y: worldPos.y,
                width: estimatedWidth,
                height: fontSize,
                content: text,
                fontSize: fontSize,
                fontFamily: styleGuide.typography?.fontFamily || "Inter",
                fontWeight: 400,
                fill: "#FFF",
                strokeWidth: 0
            };

            dispatch(addShape(newShape));
            dispatch(selectShape(newId));
            dispatch(setEditingShape(newId)); // Auto-edit
            activeShapeId.current = newId;
        } else if (activeTool === 'pen') {
            isDragging.current = true;
            currentPath.current = [{ x: worldPos.x, y: worldPos.y }];
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        // Focus Shield
        if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;

        const rect = containerRef.current!.getBoundingClientRect();
        const worldPos = invertTransformPoint(
            e.clientX - rect.left,
            e.clientY - rect.top,
            currentMatrix.current
        );

        if (isDragging.current) {
            // VIEW MODE: No interaction
            if (activeTool === 'view') return;

            // RESIZE LOGIC
            if (isResizing.current && resizeStartShape.current && resizeHandle.current) {
                const handle = resizeHandle.current;
                const start = resizeStartBounds.current;

                const dx = worldPos.x - dragStartPos.current.x;
                const dy = worldPos.y - dragStartPos.current.y;

                let newX = start.x;
                let newY = start.y;
                let newW = start.width;
                let newH = start.height;

                // Aspect Ratio Lock
                // Lock if Image OR Shift Key is pressed
                const isAspectLocked = resizeStartShape.current.type === 'image' || e.shiftKey;
                const aspectRatio = start.width / start.height;

                if (handle.includes('e')) {
                    newW = start.width + dx;
                    if (isAspectLocked) newH = newW / aspectRatio;
                }
                if (handle.includes('w')) {
                    newW = start.width - dx;
                    newX = start.x + dx;
                    if (isAspectLocked) {
                        newH = newW / aspectRatio;
                        // When locking aspect on the West handle, we change width/height.
                        // But for West, Y doesn't automatically move unless we are Corner resizing.
                        // This simple logic might drift Y if we don't adjust it for corner handles in next blocks.
                    }
                }
                if (handle.includes('s')) {
                    newH = start.height + dy;
                    if (isAspectLocked) {
                        newW = newH * aspectRatio;
                        // Determine X adjustment if corner
                    }
                }
                if (handle.includes('n')) {
                    newH = start.height - dy;
                    newY = start.y + dy;
                    if (isAspectLocked) {
                        newW = newH * aspectRatio;
                    }
                }

                // Corner Corrections for Aspect Lock (Simplified)
                // If we adjusted W/H based on one dimension, we might need to adjust X or Y if that dimension was grounded on the opposite side.
                // For now, let's keep it simple: Primary direction wins.
                // Refinements can be added for strict corner behavior.

                if (newW < 10) newW = 10;
                if (newH < 10) newH = 10;

                // Update Preview Ref (No Redux Dispatch)
                resizePreviewBounds.current = {
                    x: newX,
                    y: newY,
                    width: newW,
                    height: newH,
                    rotation: start.rotation
                };

                // Force Render
                // We don't need needsStaticUpdate because Active Layer draws the preview
                return;
            }

            // HAND TOOL: Pan logic
            if (activeTool === 'hand') {
                const deltaX = e.clientX - lastMousePos.current.x;
                const deltaY = e.clientY - lastMousePos.current.y;
                targetMatrix.current.translateSelf(deltaX, deltaY);
                lastMousePos.current = { x: e.clientX, y: e.clientY };
                return;
            }

            // Eraser Tool Update
            if (activeTool === 'eraser') {
                let hitId = null;
                for (let i = shapes.length - 1; i >= 0; i--) {
                    if (shapes[i].locked) continue;
                    if (isPointInShape(worldPos.x, worldPos.y, shapes[i])) {
                        hitId = shapes[i].id;
                        break; // Delete one at a time for control
                    }
                }
                if (hitId) {
                    dispatch(removeShape(hitId));
                }
                return;
            }

            // Pen / Magic Pen
            if (activeTool === 'pen') {
                currentPath.current.push({ x: worldPos.x, y: worldPos.y });
                return;
            }

            if (activeShapeId.current) {
                if (activeTool === 'select') {
                    const shape = shapes.find(s => s.id === activeShapeId.current);
                    if (shape && !shape.locked) {
                        const newX = worldPos.x - dragOffset.current.x;
                        const newY = worldPos.y - dragOffset.current.y;

                        // FLICKER FIX: Update Ref instead of Redux
                        // Calculate Delta relative to ORIGINAL shape position
                        const dX = newX - shape.x;
                        const dY = newY - shape.y;

                        dragOffsetDisplay.current = { x: dX, y: dY };

                        // Force Render Loop to pick up delta
                        // No dispatch here
                    }
                    lastMousePos.current = { x: e.clientX, y: e.clientY };
                } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'frame') {
                    // RESIZE (Creation)
                    const start = dragStartPos.current;
                    const width = worldPos.x - start.x;
                    const height = worldPos.y - start.y;

                    // For circle, use max dimension or distance
                    const dim = Math.max(Math.abs(width), Math.abs(height));

                    dispatch(updateShape({
                        id: activeShapeId.current,
                        changes: {
                            width: activeTool === 'rect' || activeTool === 'frame' ? Math.abs(width) : undefined,
                            height: activeTool === 'rect' || activeTool === 'frame' ? Math.abs(height) : undefined,
                            radius: activeTool === 'circle' ? dim / 2 : undefined,
                            // Adjust x/y for negative drag
                            x: width < 0 ? start.x + width : start.x,
                            y: height < 0 ? start.y + height : start.y
                        }
                    }));
                } else if (activeTool === 'arrow' || activeTool === 'line') {
                    // RESIZE (Arrow Creation)
                    dispatch(updateShape({
                        id: activeShapeId.current,
                        changes: {
                            endX: worldPos.x,
                            endY: worldPos.y,
                            width: Math.abs(worldPos.x - dragStartPos.current.x), // Bounding box width
                            height: Math.abs(worldPos.y - dragStartPos.current.y) // Bounding box height
                        }
                    }));
                }
            }
        } else {
            // HOVER CHECK (Disable for Hand/View)
            if (activeTool === 'hand' || activeTool === 'view') {
                if (lastHoveredId.current !== null) {
                    lastHoveredId.current = null;
                    dispatch(setHoveredShape(null));
                }
                return;
            }

            let hitId = null;
            // Hit Test
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (isPointInShape(worldPos.x, worldPos.y, shapes[i])) {
                    hitId = shapes[i].id;
                    break;
                }
            }
            // Only dispatch if the hovered shape actually changed
            if (hitId !== lastHoveredId.current) {
                lastHoveredId.current = hitId;
                dispatch(setHoveredShape(hitId));
            }

            // Cursor Feedback for Select Tool
            if (activeTool === 'select') {
                if (hitId) {
                    const shape = shapes.find(s => s.id === hitId);
                    if (shape?.type === 'text') {
                        containerRef.current!.style.cursor = 'text';
                    } else {
                        containerRef.current!.style.cursor = 'move';
                    }
                } else {
                    containerRef.current!.style.cursor = 'default';
                }
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        // Release Capture
        try {
            containerRef.current?.releasePointerCapture(e.pointerId);
        } catch (e) {
            // Ignore
        }

        // Reset Cursor
        if (containerRef.current) {
            if (activeTool === 'hand') {
                containerRef.current.style.cursor = 'grab';
            } else {
                containerRef.current.style.cursor = 'default';
            }
        }

        if (isDragging.current) {
            // COMMIT RESIZE
            if (isResizing.current && resizePreviewBounds.current && resizeStartShape.current) {
                dispatch(updateShape({
                    id: resizeStartShape.current.id,
                    changes: resizePreviewBounds.current
                }));
                resizePreviewBounds.current = null;
                // Add to history?
                // The 'updateShape' above should ideally be undoable. 
                // Currently updateShape is just a reducer. 
                // We might need a Thunk or handle history. 
                // For now, it works as before but smoother.
            }

            // FLICKER FIX: Commit Drag Offset to Redux & Handle Nesting
            if (activeTool === 'select' && activeShapeId.current && !isResizing.current) {
                const shape = shapes.find(s => s.id === activeShapeId.current);
                if (shape) {
                    const dx = dragOffsetDisplay.current.x;
                    const dy = dragOffsetDisplay.current.y;

                    // 1. Commit New Position
                    if (dx !== 0 || dy !== 0) {
                        const newX = shape.x + dx;
                        const newY = shape.y + dy;

                        // Commit Parent
                        const updates: Partial<Shape> = { x: newX, y: newY };
                        if (shape.type === 'arrow' || shape.type === 'line') {
                            updates.endX = (shape.endX || shape.x) + dx;
                            updates.endY = (shape.endY || shape.y) + dy;
                        }
                        dispatch(updateShape({ id: shape.id, changes: updates }));

                        // Commit Children (Group Move)
                        if (shape.type === 'frame') {
                            shapes.forEach(child => {
                                if (child.parentId === shape.id) {
                                    const childUpdates: Partial<Shape> = {
                                        x: child.x + dx,
                                        y: child.y + dy
                                    };
                                    if (child.type === 'arrow' || child.type === 'line') {
                                        childUpdates.endX = (child.endX || child.x) + dx;
                                        childUpdates.endY = (child.endY || child.y) + dy;
                                    }
                                    dispatch(updateShape({ id: child.id, changes: childUpdates }));
                                }
                            });
                        }
                    }

                    // 2. Nesting Logic (Using Final Position)
                    if (shape.type !== 'frame') {
                        const finalX = shape.x + dx;
                        const finalY = shape.y + dy;
                        const centerX = finalX + (shape.width || 0) / 2;
                        const centerY = finalY + (shape.height || 0) / 2;

                        let newParentId: string | undefined = undefined;

                        for (let i = shapes.length - 1; i >= 0; i--) {
                            const s = shapes[i];
                            if (s.type === 'frame' && s.id !== shape.id) {
                                if (centerX >= s.x && centerX <= s.x + (s.width || 0) &&
                                    centerY >= s.y && centerY <= s.y + (s.height || 0)) {
                                    newParentId = s.id;
                                    break;
                                }
                            }
                        }

                        if (shape.parentId !== newParentId) {
                            // Remove from Old
                            if (shape.parentId) {
                                const oldParent = shapes.find(s => s.id === shape.parentId);
                                if (oldParent && oldParent.children) {
                                    const newChildren = oldParent.children.filter(id => id !== shape.id);
                                    dispatch(updateShape({ id: oldParent.id, changes: { children: newChildren } }));
                                }
                            }
                            // Add to New
                            if (newParentId) {
                                const newParent = shapes.find(s => s.id === newParentId);
                                if (newParent) {
                                    const currentChildren = newParent.children || [];
                                    if (!currentChildren.includes(shape.id)) {
                                        dispatch(updateShape({ id: newParent.id, changes: { children: [...currentChildren, shape.id] } }));
                                    }
                                }
                            }
                            // Update Child
                            dispatch(updateShape({ id: shape.id, changes: { parentId: newParentId } }));
                        }
                    }
                }
            }

            // Reset Delta AFTER Nesting Check and Updates
            dragOffsetDisplay.current = { x: 0, y: 0 };
            needsStaticUpdate.current = true;

            // FRAME CLEANUP
            if (activeTool === 'frame' && activeShapeId.current) {
                const shape = shapes.find(s => s.id === activeShapeId.current);
                if (shape) {
                    if ((shape.width || 0) < 5 || (shape.height || 0) < 5) {
                        dispatch(removeShape(shape.id));
                        dispatch(selectShape(null));
                    } else {
                        // FRAME CREATION NESTING
                        const frameLeft = shape.x;
                        const frameRight = shape.x + (shape.width || 0);
                        const frameTop = shape.y;
                        const frameBottom = shape.y + (shape.height || 0);
                        const childIds: string[] = [];

                        shapes.forEach(s => {
                            if (s.id === shape.id) return;
                            if (s.type === 'frame') return;
                            const sCx = s.x + (s.width || 0) / 2;
                            const sCy = s.y + (s.height || 0) / 2;
                            if (sCx >= frameLeft && sCx <= frameRight && sCy >= frameTop && sCy <= frameBottom) {
                                childIds.push(s.id);
                                dispatch(updateShape({ id: s.id, changes: { parentId: shape.id } }));
                            }
                        });
                        if (childIds.length > 0) {
                            dispatch(updateShape({ id: shape.id, changes: { children: childIds } }));
                        }
                    }
                }
            }

            // PEN/MAGIC PEN
            if (activeTool === 'pen' && currentPath.current.length > 1) {
                const points = currentPath.current;
                const minX = Math.min(...points.map(p => p.x));
                const minY = Math.min(...points.map(p => p.y));
                const maxX = Math.max(...points.map(p => p.x));
                const maxY = Math.max(...points.map(p => p.y));
                const width = maxX - minX;
                const height = maxY - minY;

                const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - minX} ${p.y - minY}`).join(' ');
                const newShape: Shape = {
                    id: crypto.randomUUID(), type: 'path', x: minX, y: minY, width, height, path: pathData, stroke: '#FFF', strokeWidth: 2, fill: 'transparent'
                };
                dispatch(addShape(newShape));
            }

            // SAVE — trigger middleware immediately via forceSync
            if (activeTool === 'eraser' || activeTool === 'pen' || activeTool === 'line' || activeShapeId.current) {
                dispatch(forceSync());
            }
        }

        // Reset Logic
        isResizing.current = false;
        resizeHandle.current = null;
        resizeStartShape.current = null;
        resizePreviewBounds.current = null;

        isDragging.current = false;
        activeShapeId.current = null;
        currentPath.current = [];

        dispatch(setInteracting(false));
        dispatch(setDragging(false));
    };


    // --- MOUNT ---
    const mount = useCallback((staticC: HTMLCanvasElement, activeC: HTMLCanvasElement, container: HTMLDivElement) => {
        staticCanvasRef.current = staticC;
        activeCanvasRef.current = activeC;
        containerRef.current = container;

        // Resize
        const resize = () => {
            staticC.width = container.clientWidth;
            staticC.height = container.clientHeight;
            activeC.width = container.clientWidth;
            activeC.height = container.clientHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Wheel Listener (Non-passive for preventDefault)
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('resize', resize);
            container.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);


    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Ctrl+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    dispatch({ type: 'canvas/redo' });
                } else {
                    dispatch({ type: 'canvas/undo' });
                }
            }
            // Redo: Ctrl+Y
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                dispatch({ type: 'canvas/redo' });
            }
            // Left Arrow for Undo?
            if (activeTool === 'view' && e.key === 'ArrowLeft') {
                e.preventDefault();
                dispatch({ type: 'canvas/undo' });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, activeTool]);



    // INITIAL DATA LOAD — only hydrate ONCE on mount, block during interactions
    useEffect(() => {
        if (isHydrated.current) return; // Already loaded; ignore subsequent useQuery pushes
        if (isDragging.current || isResizing.current) return; // Block during active interaction

        if (initialData && initialData !== "{}") {
            try {
                const parsed = JSON.parse(initialData);
                // Check if it's legacy Fabric (has "objects" array)
                let loadedShapes = parsed.objects || parsed || [];

                // NORMALIZE (Center -> TopLeft)
                loadedShapes = loadedShapes.map((s: any) => {
                    if (s.originX === 'center') {
                        return {
                            ...s,
                            x: s.left - (s.width * s.scaleX / 2),
                            y: s.top - (s.height * s.scaleY / 2),
                            originX: 'left',
                            originY: 'top'
                        };
                    }
                    // Fabric uses 'left'/'top' for x/y. We use x/y.
                    return {
                        ...s,
                        x: s.left ?? s.x,
                        y: s.top ?? s.y
                    };
                });

                dispatch(setShapes(loadedShapes));
                needsStaticUpdate.current = true; // Force redraw on load
                isHydrated.current = true; // Mark as loaded — prevent future overwrites
            } catch (e) {
                console.error("Failed to load initial data", e);
            }
        }
    }, [initialData, dispatch]);

    // Force redraw when shapes/selection change
    useEffect(() => {
        if (!isDragging.current) {
            needsStaticUpdate.current = true;
        }
    }, [shapes, selectedShapeId]);

    // --- PERSISTENCE ---
    // All saves are handled by syncMiddleware (debounced 200ms).
    // No duplicate useEffect save or direct saveSketches call needed.

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const url = e.dataTransfer.getData("text/plain");
        if (!url) return;

        const rect = containerRef.current!.getBoundingClientRect();
        const worldPos = invertTransformPoint(
            e.clientX - rect.left,
            e.clientY - rect.top,
            currentMatrix.current
        );

        const newId = crypto.randomUUID();
        // Load image to get dimensions?
        // For now default size, user can resize.
        // Or wait for load?
        // Let's set a default size.
        const newShape: Shape = {
            id: newId,
            type: 'image',
            x: worldPos.x,
            y: worldPos.y,
            width: 200,
            height: 200,
            content: url, // Storing URL in content
            fill: 'transparent',
            stroke: 'transparent'
        };

        dispatch(addShape(newShape));
        // Auto-save
        // Need to access shapes? Dispatch is async/reducer. 
        // We can just trigger a save flag or wait for debounce.
        // Debounce will handle it.
    }, [dispatch]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDoubleClick = (e: React.MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        const worldPos = invertTransformPoint(
            e.clientX - rect.left,
            e.clientY - rect.top,
            currentMatrix.current
        );

        let hitId = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(worldPos.x, worldPos.y, shapes[i])) {
                hitId = shapes[i].id;
                break;
            }
        }

        if (hitId) {
            const shape = shapes.find(s => s.id === hitId);
            if (shape?.type === 'text') {
                dispatch(setEditingShape(hitId));
                dispatch(selectShape(hitId));
            }
        }
    };

    // --- HELPERS EXPORT ---
    const worldToScreen = useCallback((x: number, y: number) => {
        if (!currentMatrix.current) return { x, y };
        const m = currentMatrix.current;
        return {
            x: x * m.a + m.e,
            y: y * m.d + m.f
        };
    }, []);

    const screenToWorld = (x: number, y: number) => {
        const p = invertTransformPoint(x, y, currentMatrix.current);
        return { x: p.x, y: p.y };
    };

    const captureCanvas = () => {
        if (!staticCanvasRef.current) return "";
        return staticCanvasRef.current.toDataURL("image/png");
    };

    // Return events and refs for the renderer
    return {
        onMount: mount,
        events: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerLeave: handlePointerUp,
            onDoubleClick: handleDoubleClick,
            onDrop: handleDrop,
            onDragOver: handleDragOver,
            onContextMenu: handleContextMenu
        },
        helpers: {
            worldToScreen,
            screenToWorld,
            captureCanvas
        },
        contextMenu,
        setContextMenu
    };
};
