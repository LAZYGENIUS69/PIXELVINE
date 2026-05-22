import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        // Check if user is already stored
        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (user !== null) {
            // If user exists, update their name/email/image to keep it fresh
            if (user.name !== identity.name || user.email !== identity.email || user.image !== identity.pictureUrl) {
                await ctx.db.patch(user._id, {
                    name: identity.name || "Anonymous",
                    email: identity.email || "",
                    image: identity.pictureUrl || "",
                });
            }
            return user._id;
        }

        // If new user, create entry
        const userId = await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            name: identity.name || "Anonymous",
            email: identity.email || "",
            image: identity.pictureUrl || "",
            credits: 5,
            isPro: false,
        });

        return userId;
    },
});

export const current = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);

        if (userId === null) {
            return null;
        }

        return await ctx.db.get(userId);
    },
});
