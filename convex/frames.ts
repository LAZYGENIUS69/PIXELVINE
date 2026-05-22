import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ---------- Mutations ----------

export const create = mutation({
    args: {
        projectId: v.id("projects"),
        screenId: v.string(),
        name: v.string(),
        purpose: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("frames", {
            projectId: args.projectId,
            screenId: args.screenId,
            name: args.name,
            purpose: args.purpose,
            htmlContent: "",
            status: "pending",
            order: args.order,
        });
    },
});

export const deleteFrame = mutation({
    args: { id: v.id("frames") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const updateContent = mutation({
    args: {
        id: v.id("frames"),
        htmlContent: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("generating"),
            v.literal("done"),
            v.literal("error"),
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            htmlContent: args.htmlContent,
            status: args.status,
        });
    },
});

export const setStatus = mutation({
    args: {
        id: v.id("frames"),
        status: v.union(
            v.literal("pending"),
            v.literal("generating"),
            v.literal("done"),
            v.literal("error"),
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

// ---------- Queries ----------

export const getById = query({
    args: { id: v.id("frames") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("frames")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
    },
});
