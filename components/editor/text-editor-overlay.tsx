
'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { updateShape, setEditingShape, forceSync } from '@/store/slices/canvasSlice';
import { toScreen } from '@/lib/canvas-utils';

export function TextEditorOverlay() {
    const dispatch = useDispatch();
    const { editingShapeId, entities, viewport, projectId } = useSelector((state: RootState) => state.canvas);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const shape = editingShapeId ? entities[editingShapeId] : null;

    useEffect(() => {
        if (shape && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
            );
        }
    }, [editingShapeId]);

    if (!shape || shape.type !== 'text') return null;

    const screenPos = toScreen({ x: shape.x, y: shape.y }, viewport);

    // Scale font size based on zoom
    const fontSize = (shape.fontSize || 16) * viewport.zoom;
    const lineHeight = 1.2; // Default line height

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(updateShape({
            id: shape.id,
            changes: { content: e.target.value }
        }));
    };

    const handleBlur = () => {
        dispatch(setEditingShape(null));
        dispatch(forceSync()); // Ensure final state is saved
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation(); // Stop canvas shortcuts
        if (e.key === 'Escape') {
            textareaRef.current?.blur();
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={shape.content || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()} // Prevent canvas drag
            style={{
                position: 'absolute',
                left: screenPos.x,
                top: screenPos.y,
                fontSize: `${fontSize}px`,
                fontFamily: shape.fontFamily || 'Inter',
                color: shape.fill || 'black',
                background: 'transparent',
                border: 'none', // Seamless look
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                zIndex: 1000, // Above canvas
                minWidth: '100px',
                minHeight: '1.2em',
                // Auto-expand logic could go here roughly
                width: `${Math.max(100, (shape.width || 100) * viewport.zoom)}px`,
                height: `${Math.max(50, (shape.height || 50) * viewport.zoom)}px`,
                transformOrigin: 'top left',
                // Handle rotation if needed later
            }}
        />
    );
}
