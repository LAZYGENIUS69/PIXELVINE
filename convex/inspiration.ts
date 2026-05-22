
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// ---------- Queries ----------

export const getVariations = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("inspirationVariations")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("desc")
            .collect();
    },
});

export const getVariationById = query({
    args: { id: v.id("inspirationVariations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// ---------- Mutations ----------

export const saveVariation = mutation({
    args: {
        projectId: v.id("projects"),
        name: v.string(),
        style: v.string(),
        code: v.string(),
        type: v.union(v.literal("web"), v.literal("mobile")),
        previewUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("inspirationVariations", {
            projectId: args.projectId,
            name: args.name,
            style: args.style,
            code: args.code,
            type: args.type,
            previewUrl: args.previewUrl,
            isApplied: false,
            createdAt: Date.now(),
        });
    },
});

export const deleteVariation = mutation({
    args: { id: v.id("inspirationVariations") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const setApplied = mutation({
    args: {
        id: v.id("inspirationVariations"),
        isApplied: v.boolean(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { isApplied: args.isApplied });
    },
});

export const clearAppliedVariations = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const variations = await ctx.db
            .query("inspirationVariations")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();

        for (const variation of variations) {
            if (variation.isApplied) {
                await ctx.db.patch(variation._id, { isApplied: false });
            }
        }
    },
});

// ---------- Actions ----------

export const generateVariations = action({
    args: {
        projectId: v.id("projects"),
        sketch: v.optional(v.string()), // Base64 encoded sketch image
        moodboardUrls: v.array(v.string()),
        styleGuide: v.object({
            palette: v.any(),
            typography: v.any(),
        }),
        shapes: v.array(v.any()),
        activeFrame: v.optional(v.object({
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
        })),
        type: v.union(v.literal("web"), v.literal("mobile")),
    },
    handler: async (ctx, args): Promise<{ variations: any[], count: number }> => {
        // Define the visual styles to generate
        const styles = [
            { name: "Minimalist", description: "Clean, whitespace-focused design with subtle shadows and minimal color usage" },
            { name: "High-Contrast", description: "Bold typography, stark black/white contrast with vibrant accent colors" },
            { name: "Glassmorphic", description: "Frosted glass effects, blur backgrounds, translucent overlays, modern depth" },
            { name: "Bento Grid", description: "Modular card-based layout with rounded corners, soft shadows, organized grid system" },
        ];

        const generatedVariations: any[] = [];

        for (const style of styles) {
            try {
                // Call the variations API endpoint
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/variations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sketch: args.sketch,
                        moodboard: args.moodboardUrls,
                        styleGuide: args.styleGuide,
                        shapes: args.shapes,
                        activeFrame: args.activeFrame,
                        style: style.name,
                        styleDescription: style.description,
                        type: args.type,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to generate ${style.name} variation`);
                }

                const data = await response.json();

                // Save the variation to the database
                const variationId: any = await ctx.runMutation(api.inspiration.saveVariation, {
                    projectId: args.projectId,
                    name: `${style.name} Design`,
                    style: style.name,
                    code: data.code,
                    type: args.type,
                });

                generatedVariations.push({
                    id: variationId,
                    style: style.name,
                    name: `${style.name} Design`,
                });

            } catch (error) {
                console.error(`Failed to generate ${style.name} variation:`, error);
                // Continue with other styles even if one fails
            }
        }

        return { variations: generatedVariations, count: generatedVariations.length };
    },
});

export const generatePreviewImage = action({
    args: {
        variationId: v.id("inspirationVariations"),
        code: v.string(),
    },
    handler: async (_ctx, _args) => {
        // This is a placeholder for future preview image generation
        // Could use Puppeteer, Playwright, or a screenshot service
        // For now, we'll just return success
        return { success: true };
    },
});
