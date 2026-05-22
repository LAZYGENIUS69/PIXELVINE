import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ---------- Mutations ----------

export const create = mutation({
    args: {
        projectId: v.id("projects"),
        designMode: v.optional(v.union(v.literal("mobile"), v.literal("web"))),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("generationJobs", {
            projectId: args.projectId,
            status: "analyzing",
            totalScreens: 0,
            completedScreens: 0,
            startedAt: Date.now(),
            designMode: args.designMode,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("generationJobs"),
        status: v.optional(
            v.union(
                v.literal("analyzing"),
                v.literal("designing"),
                v.literal("done"),
                v.literal("error"),
            )
        ),
        analysis: v.optional(v.string()),
        theme: v.optional(v.string()),
        totalScreens: v.optional(v.number()),
        completedScreens: v.optional(v.number()),
        error: v.optional(v.string()),
        completedAt: v.optional(v.number()),
        designMode: v.optional(v.union(v.literal("mobile"), v.literal("web"))),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        // Filter out undefined values
        const patch: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                patch[key] = value;
            }
        }
        if (Object.keys(patch).length > 0) {
            await ctx.db.patch(id, patch);
        }
    },
});

// ---------- Queries ----------

export const getByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const jobs = await ctx.db
            .query("generationJobs")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
        // Return the most recent job
        const mostRecent = jobs.sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;

        // If the most recent job has been stuck in a non-terminal state for
        // more than 5 minutes, treat it as timed-out (don't block the UI forever)
        if (mostRecent && (mostRecent.status === "analyzing" || mostRecent.status === "designing")) {
            const fiveMinutesMs = 5 * 60 * 1000;
            if (Date.now() - mostRecent.startedAt > fiveMinutesMs) {
                return { ...mostRecent, status: "error" as const };
            }
        }

        return mostRecent;
    },
});

export const cancel = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const jobs = await ctx.db
            .query("generationJobs")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
        // Mark all running jobs as cancelled (error)
        for (const job of jobs) {
            if (job.status === "analyzing" || job.status === "designing") {
                await ctx.db.patch(job._id, {
                    status: "error",
                    error: "Cancelled by user",
                    completedAt: Date.now(),
                });
            }
        }
    },
});

