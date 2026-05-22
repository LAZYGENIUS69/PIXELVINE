import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
    ...authTables,
    users: defineTable({
        tokenIdentifier: v.string(),
        name: v.string(),
        email: v.string(),
        image: v.string(),
        credits: v.number(),
        isPro: v.boolean(),
    }).index("by_tokenIdentifier", ["tokenIdentifier"]).index("email", ["email"]),
    projects: defineTable({
        userId: v.id("users"),
        name: v.string(),
        sketchesData: v.string(),
        viewportData: v.any(),
        lastModified: v.number(),
        order: v.optional(v.number()),
        // AI Fields
        designAST: v.optional(v.string()),
        isAnalyzing: v.optional(v.boolean()),
        critique: v.optional(v.string()),
        renderUrl: v.optional(v.string()),
        // Style Guide
        palette: v.optional(v.object({
            primary: v.string(),
            secondary: v.string(),
            accent: v.string(),
        })),
    }).index("by_user", ["userId"]),
    subscriptions: defineTable({
        userId: v.id("users"),
        polarId: v.string(),
        status: v.string(),
    }).index("by_userId", ["userId"]),
    moodBoards: defineTable({
        projectId: v.id("projects"),
        storageId: v.optional(v.id("_storage")),
        url: v.optional(v.string()),
        x: v.optional(v.number()),
        y: v.optional(v.number()),
        imageType: v.optional(v.string()),
    }).index("by_project", ["projectId"]),

    // Design Agent — generated screens
    frames: defineTable({
        projectId: v.id("projects"),
        screenId: v.string(),
        name: v.string(),
        purpose: v.string(),
        htmlContent: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("generating"),
            v.literal("done"),
            v.literal("error"),
        ),
        order: v.number(),
    }).index("by_project", ["projectId"]),

    // Design Agent — job tracking
    generationJobs: defineTable({
        projectId: v.id("projects"),
        status: v.union(
            v.literal("analyzing"),
            v.literal("designing"),
            v.literal("done"),
            v.literal("error"),
        ),
        analysis: v.optional(v.string()),
        theme: v.optional(v.string()),
        totalScreens: v.optional(v.number()),
        completedScreens: v.optional(v.number()),
        error: v.optional(v.string()),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
        designMode: v.optional(v.union(v.literal("mobile"), v.literal("web"))),
    }).index("by_project", ["projectId"]),

    // Chat messages for iterative design editing
    chatMessages: defineTable({
        projectId: v.id("projects"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        frameId: v.optional(v.id("frames")),
        createdAt: v.number(),
    }).index("by_project", ["projectId"]),

    // Inspiration Board — generated design variations
    inspirationVariations: defineTable({
        projectId: v.id("projects"),
        name: v.string(),
        style: v.string(), // e.g., "Minimalist", "High-Contrast", "Glassmorphic", "Bento Grid"
        code: v.string(), // React + Tailwind code
        type: v.union(v.literal("web"), v.literal("mobile")),
        previewUrl: v.optional(v.string()), // Optional generated preview image
        isApplied: v.boolean(), // Whether this variation has been applied to a frame
        createdAt: v.number(),
    }).index("by_project", ["projectId"]),
});

export default schema;
