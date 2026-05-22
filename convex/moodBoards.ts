
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Force Convex to re-scan this file
export const get = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const images = await ctx.db
            .query("moodBoards")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();

        return Promise.all(
            images.map(async (image) => ({
                ...image,
                url: image.storageId ? await ctx.storage.getUrl(image.storageId) : image.url,
            }))
        );
    },
});

export const getByType = query({
    args: {
        projectId: v.id("projects"),
        imageType: v.string()
    },
    handler: async (ctx, args) => {
        const images = await ctx.db
            .query("moodBoards")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("imageType"), args.imageType))
            .collect();

        return Promise.all(
            images.map(async (image) => ({
                ...image,
                url: image.storageId ? await ctx.storage.getUrl(image.storageId) : image.url,
            }))
        );
    },
});

export const add = mutation({
    args: {
        projectId: v.id("projects"),
        storageId: v.id("_storage"),
        x: v.number(),
        y: v.number(),
        imageType: v.string(),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("Failed to get URL for storageId");

        const imageId = await ctx.db.insert("moodBoards", {
            projectId: args.projectId,
            storageId: args.storageId,
            url: url,
            x: args.x,
            y: args.y,
            imageType: args.imageType,
        });
        return imageId;
    },
});

export const remove = mutation({
    args: { id: v.id("moodBoards") },
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.id);
        if (!image) return;
        if (image.storageId) {
            await ctx.storage.delete(image.storageId);
        }
        await ctx.db.delete(args.id);
    },
});

