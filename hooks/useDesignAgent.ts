"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { RootState } from "../store/store";
import {
    startGeneration,
    setJobStatus,
    setError,
    resetGeneration,
    setDesignType,
} from "../store/slices/generationSlice";

/**
 * useDesignAgent — custom hook for the Design Agent pipeline.
 *
 * Calls the Convex action directly via useAction (no API route needed).
 * Subscribes to Convex queries for real-time progress updates.
 */
export function useDesignAgent(projectId: Id<"projects">) {
    const dispatch = useDispatch();
    const localState = useSelector((s: RootState) => s.generation);

    // Direct Convex action — bypasses the API route entirely
    const runDesignAgent = useAction(api.designAgent.runDesignAgent);

    // Real-time Convex subscriptions
    const job = useQuery(api.generationJobs.getByProject, { projectId });
    const frames = useQuery(api.frames.getByProject, { projectId });

    // Sorted frames by order
    const sortedFrames = useMemo(() => {
        if (!frames) return [];
        return [...frames].sort((a, b) => a.order - b.order);
    }, [frames]);

    // Derived status
    const isAnalyzing = job?.status === "analyzing";
    const isDesigning = job?.status === "designing";
    const isDone = job?.status === "done";
    const isError = job?.status === "error";
    const isRunning = isAnalyzing || isDesigning;

    const progress = useMemo(() => {
        if (!job) return { completed: 0, total: 0, percent: 0 };
        const completed = job.completedScreens ?? 0;
        const total = job.totalScreens ?? 0;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percent };
    }, [job]);

    // Trigger generation — calls Convex action directly
    const generate = useCallback(
        async (userPrompt: string, designType: "mobile" | "website" = "mobile") => {
            dispatch(startGeneration(projectId));

            try {
                const result = await runDesignAgent({
                    projectId,
                    userPrompt,
                    designType,
                });

                dispatch(setJobStatus("done"));
                return result;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                dispatch(setError(message));
                throw err;
            }
        },
        [projectId, dispatch, runDesignAgent]
    );

    const reset = useCallback(() => {
        dispatch(resetGeneration());
    }, [dispatch]);

    return {
        // Backend state (real-time)
        job,
        frames: sortedFrames,

        // Derived booleans
        isAnalyzing,
        isDesigning,
        isDone,
        isError,
        isRunning,

        // Progress
        progress,

        // Local state
        localStatus: localState.jobStatus,
        localError: localState.errorMessage,

        // Actions
        generate,
        reset,
        
        // Design type
        designType: localState.designType,
        setDesignType: (type: "mobile" | "website") => dispatch(setDesignType(type)),
    };
}
