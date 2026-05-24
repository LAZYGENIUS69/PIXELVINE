'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setProjectId, resetCanvas } from '@/store/slices/canvasSlice';
import { AppDispatch } from '@/store/store';

interface CanvasInitializerProps {
    projectId: string;
}

export function CanvasInitializer({ projectId }: CanvasInitializerProps) {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        // Reset canvas when mounting or when projectId changes
        dispatch(resetCanvas());

        // Use a small timeout to ensure state is cleared before setting new projectId
        // This helps prevent race conditions with the middleware if it tries to sync immediately
        const timer = setTimeout(() => {
            dispatch(setProjectId(projectId));
        }, 0);

        return () => {
            // Optional: clear on unmount as well to be safe
            // dispatch(resetCanvas());
            clearTimeout(timer);
        };
    }, [projectId, dispatch]);

    return null; // This component handles logic only, no UI
}
