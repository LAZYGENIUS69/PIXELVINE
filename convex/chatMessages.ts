import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ---------- Queries ----------

export const list = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("asc")
            .collect();

        return messages;
    },
});

export const getByFrame = query({
    args: { 
        projectId: v.id("projects"),
        frameId: v.id("frames")
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("frameId"), args.frameId))
            .order("asc")
            .collect();

        return messages;
    },
});

// ---------- Mutations ----------

export const send = mutation({
    args: {
        projectId: v.id("projects"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        frameId: v.optional(v.id("frames")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("chatMessages", {
            projectId: args.projectId,
            role: args.role,
            content: args.content,
            frameId: args.frameId,
            createdAt: Date.now(),
        });
    },
});

export const clear = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }
    },
});

export const clearByFrame = mutation({
    args: { 
        projectId: v.id("projects"),
        frameId: v.id("frames")
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("frameId"), args.frameId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }
    },
});
