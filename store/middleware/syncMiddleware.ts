
import { Middleware } from '@reduxjs/toolkit';
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Initialize Convex Client
const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Debounce timer
// Debounce timer for sketches
let syncTimeout: NodeJS.Timeout | null = null;
// Debounce timer for viewport
let viewportTimeout: NodeJS.Timeout | null = null;

export const syncMiddleware: Middleware = store => next => action => {
    // 1. Update Redux State Instantly
    const result = next(action);

    // 2. Check for Canvas Actions (Shapes)
    if (
        (action as any).type.startsWith('canvas/addShape') ||
        (action as any).type.startsWith('canvas/updateShape') ||
        (action as any).type.startsWith('canvas/removeShape') ||
        (action as any).type.startsWith('canvas/setShapes') ||
        (action as any).type.startsWith('canvas/bringToFront') ||
        (action as any).type.startsWith('canvas/sendToBack') ||
        (action as any).type.startsWith('canvas/undo') ||
        (action as any).type.startsWith('canvas/redo')
    ) {
        const state = store.getState();

        // THROTTLED PERSISTENCE: Skip sync if dragging or interacting
        if (state.canvas.isDragging || state.canvas.isInteracting) {
            return result;
        }

        const projectId = state.canvas.projectId;

        if (projectId) {
            if (syncTimeout) clearTimeout(syncTimeout);

            syncTimeout = setTimeout(() => { // 200ms — single save channel
                const currentState = store.getState();
                // Save both ids and entities to preserve order
                const sketchesData = JSON.stringify({
                    ids: currentState.canvas.ids,
                    entities: currentState.canvas.entities
                });

                convex.mutation(api.projects.saveSketches, {
                    id: projectId,
                    sketchesData,
                }).catch((err) => {
                    console.error("Optimistic Sync Failed:", err);
                });
            }, 200);
        }
    }

    // 3. Check for Viewport Actions
    if ((action as any).type.startsWith('canvas/setViewport')) {
        const state = store.getState();
        const projectId = state.canvas.projectId;

        if (projectId) {
            if (viewportTimeout) clearTimeout(viewportTimeout);

            viewportTimeout = setTimeout(() => {
                const currentState = store.getState();
                const viewportData = currentState.canvas.viewport;

                convex.mutation(api.projects.saveViewport, {
                    id: projectId,
                    viewportData,
                }).catch((err) => {
                    console.error("Viewport Sync Failed:", err);
                });
            }, 500);
        }
    }

    // 4. Check for Force Sync
    if ((action as any).type.startsWith('canvas/forceSync')) {
        const state = store.getState();
        const projectId = state.canvas.projectId;

        if (projectId) {
            if (syncTimeout) clearTimeout(syncTimeout);

            const currentState = store.getState();
            const sketchesData = JSON.stringify({
                ids: currentState.canvas.ids,
                entities: currentState.canvas.entities
            });

            convex.mutation(api.projects.saveSketches, {
                id: projectId,
                sketchesData,
            }).catch((err) => {
                console.error("Forced Sync Failed:", err);
            });
        }
    }



    return result;
};
