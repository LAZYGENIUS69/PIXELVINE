'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { setShapes, setViewport, setProjectId } from '@/store/slices/canvasSlice';
import { Id } from '../convex/_generated/dataModel';

interface UseSyncCanvasProps {
    projectId: string;
}

export function useSyncCanvas({ projectId }: UseSyncCanvasProps) {
    const dispatch = useDispatch();
    // Use the get query to fetch project data
    const project = useQuery(api.projects.get, { id: projectId as Id<"projects"> });
    const isHydrated = useRef(false);
    const lastProjectId = useRef<string | null>(null);

    useEffect(() => {
        // Reset hydration if projectId changes
        if (projectId !== lastProjectId.current) {
            isHydrated.current = false;
            lastProjectId.current = projectId;
        }

        if (!project || isHydrated.current) return;

        console.log("Hydrating Canvas for Project:", projectId);

        // Hydrate Sketches
        if (project.sketchesData) {
            try {
                const parsed = JSON.parse(project.sketchesData);

                // Handle both legacy (array) and new (normalized) formats
                if (Array.isArray(parsed)) {
                    dispatch(setShapes(parsed));
                } else if (parsed.ids && parsed.entities) {
                    // Reconstruct sorted array to preserve Z-index
                    const sortedEntities = parsed.ids.map((id: string) => parsed.entities[id]).filter(Boolean);
                    dispatch(setShapes(sortedEntities));
                }
            } catch (e) {
                console.error("Failed to parse sketchesData", e);
            }
        }

        // Hydrate Viewport
        if (project.viewportData) {
            dispatch(setViewport(project.viewportData));
        }

        // Ensure projectId is set in Redux
        dispatch(setProjectId(projectId));

        isHydrated.current = true;

    }, [project, projectId, dispatch]);

    return { isLoading: !project, project };
}
