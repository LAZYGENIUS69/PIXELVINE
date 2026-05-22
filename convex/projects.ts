import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        let userId = null;
        const identity = await ctx.auth.getUserIdentity();

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
            userId = user?._id;
        } else {
            // MOCK MODE FALLBACK
            // If no real auth, use "Demo User"
            const demoEmail = "demo@visionsync.com";
            let user = await ctx.db
                .query("users")
                .withIndex("email", (q) => q.eq("email", demoEmail))
                .unique();

            if (!user) {
                userId = await ctx.db.insert("users", {
                    tokenIdentifier: "mock_token_identifier",
                    name: "Demo User",
                    email: demoEmail,
                    image: "https://github.com/shadcn.png", // specific avatar
                    credits: 50,
                    isPro: true,
                });
            } else {
                userId = user._id;
            }
        }

        if (!userId) throw new Error("User not found (and failed to create mock user)");

        const projectId = await ctx.db.insert("projects", {
            userId: userId,
            // ... rest is same
            name: args.name,
            sketchesData: "", // Empty string as requested
            viewportData: {}, // Empty object
            lastModified: Date.now(),
        });

        return projectId;
    }
});

export const get = query({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    }
});

export const getRecent = query({
    args: {},
    handler: async (ctx) => {
        let userId = await auth.getUserId(ctx);

        if (!userId) {
            // MOCK MODE FALLBACK
            const demoEmail = "demo@visionsync.com";
            const user = await ctx.db
                .query("users")
                .withIndex("email", (q) => q.eq("email", demoEmail))
                .unique();
            userId = user?._id ?? null;
        }

        if (!userId) {
            return [];
        }

        const projects = await ctx.db
            .query("projects")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            // .order("desc") // Removed as we do manual sort
            .collect();

        // Sort by order if present, otherwise fall back to lastModified
        return projects.sort((a, b) => {
            if (typeof a.order === 'number' && typeof b.order === 'number') {
                return a.order - b.order;
            }
            // Fallback for items without order: put them at the start or end?
            // If dragging establishes order, items without order should probably be last or first.
            // Let's say new items (no order) appear at top.
            if (typeof a.order === 'number') return 1;
            if (typeof b.order === 'number') return -1;
            return b.lastModified - a.lastModified;
        });
    }
});

export const setAnalyzing = mutation({
    args: {
        id: v.id("projects"),
        isAnalyzing: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Relaxed Auth for Mock Mode
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        // Just check if project exists for now, or assume frontend owns it if they have the ID
        // In a real app we'd repeat the Mock Fallback check here

        await ctx.db.patch(args.id, {
            isAnalyzing: args.isAnalyzing,
            lastModified: Date.now(),
        });
    }
});

export const saveDesignAST = mutation({
    args: {
        id: v.id("projects"),
        designAST: v.string(),
    },
    handler: async (ctx, args) => {
        // Relaxed Auth for Mock Mode
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, {
            designAST: args.designAST,
            lastModified: Date.now(),
        });
    }
});

export const saveViewport = mutation({
    args: {
        id: v.id("projects"),
        viewportData: v.any(),
    },
    handler: async (ctx, args) => {
        // Relaxed Auth for Mock Mode
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, {
            viewportData: args.viewportData,
            lastModified: Date.now(),
        });
    }
});



export const saveCritique = mutation({
    args: {
        id: v.id("projects"),
        critique: v.string(),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, {
            critique: args.critique,
            lastModified: Date.now(),
        });
    }
});


export const saveRender = mutation({
    args: {
        id: v.id("projects"),
        url: v.string(),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, {
            renderUrl: args.url,
            lastModified: Date.now(),
        });
    }
});

export const saveSketches = mutation({
    args: {
        id: v.id("projects"),
        sketchesData: v.string(),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, {
            sketchesData: args.sketchesData,
            lastModified: Date.now(),
        });
    }
});


export const updateProjectsOrder = mutation({
    args: {
        updates: v.array(v.object({
            id: v.id("projects"),
            order: v.number()
        }))
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        // Parallel update is fine since we have ids
        await Promise.all(
            args.updates.map((update) =>
                ctx.db.patch(update.id, { order: update.order })
            )
        );
    }
});
