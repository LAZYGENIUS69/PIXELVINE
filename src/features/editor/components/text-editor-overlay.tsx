"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { updateShape } from "@/store/slices/canvasSlice";

interface TextEditorOverlayProps {
    worldToScreen: (x: number, y: number) => { x: number; y: number };
}

export const TextEditorOverlay = ({ worldToScreen }: TextEditorOverlayProps) => {
    const dispatch = useDispatch();
    const { entities, editingShapeId, viewport } = useSelector((state: RootState) => state.canvas);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState("");

    const shape = editingShapeId ? entities[editingShapeId] : null;

    // Fix: Only run on ID change, not shape content change
    useEffect(() => {
        if (editingShapeId && entities[editingShapeId]?.type === 'text') {
            const initialContent = entities[editingShapeId].content || "";
            setValue(initialContent);

            // Focus and Select All only on initial entry
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.select();
                }
            }, 0);
        }
    }, [editingShapeId]); // Removed 'shape' and 'entities' to prevent re-run while typing

    if (!shape || shape.type !== 'text') return null;

    const screenPos = worldToScreen(shape.x, shape.y);
    const zoom = viewport.zoom;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        dispatch(updateShape({
            id: shape.id,
            changes: { content: e.target.value }
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation(); // Shield shortcuts
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y,
        fontSize: `${(shape.fontSize || 16) * zoom}px`,
        fontFamily: shape.fontFamily || 'Inter',
        fontWeight: shape.fontWeight || 'normal',
        color: shape.fill || 'white',
        backgroundColor: 'transparent', // Transparent as requested
        // transform: `translate(0, -50%)`, // Removing translate to align top-left exactly with shape
        // actually text usually renders from baseline or top-left. Fabric/Canvas usually top-left.
        // We matched canvas-renderer textBaseline="top", so we should align top-left.
        border: 'none',
        outline: '1px dashed rgba(255,255,255,0.5)', // Outline for visibility while editing
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre',
        zIndex: 30, // Above canvas (0), below Toolbar (200)
        pointerEvents: 'auto',
        padding: '0px',
        margin: 0,
        minWidth: '50px',
        minHeight: '1.2em',
        width: `${Math.max((shape.width || 0) * zoom, (value.length + 1) * ((shape.fontSize || 16) * zoom * 0.6))}px`,
        height: `${Math.max(10, (shape.height || 0) * zoom)}px`,
        lineHeight: shape.lineHeight ? `${shape.lineHeight}` : 'normal',
        letterSpacing: shape.letterSpacing ? `${shape.letterSpacing}px` : 'normal'
    };

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => e.stopPropagation()}
            style={style}
            spellCheck={false}
        />
    );
};
