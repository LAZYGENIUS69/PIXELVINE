import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

export const runtime = "nodejs";
export const maxDuration = 60;

// Zod schema for strict Style Guide output
const StyleGuideSchema = z.object({
    palette: z.object({
        background: z.string().describe("Page Background hex (#RRGGBB)"),
        foreground: z.string().describe("Main Text hex"),
        card: z.string().describe("Surface/Container hex"),
        cardForeground: z.string().describe("Text on Card hex"),
        primary: z.string().describe("Main Brand Color hex"),
        primaryForeground: z.string().describe("Text on Primary hex"),
        secondary: z.string().describe("Supporting Color hex"),
        secondaryForeground: z.string().describe("Text on Secondary hex"),
        muted: z.string().describe("Subtle Backgrounds hex"),
        mutedForeground: z.string().describe("Subtle Text hex"),
        accent: z.string().describe("Interactive/Highlight hex"),
        accentForeground: z.string().describe("Text on Accent hex"),
        popover: z.string().describe("Modal/Dropdown Background hex"),
        popoverForeground: z.string().describe("Text on Popover hex"),
        border: z.string().describe("Borders hex"),
        input: z.string().describe("Form Inputs hex"),
        ring: z.string().describe("Focus Rings hex"),
        destructive: z.string().describe("Error/Danger hex"),
        destructiveForeground: z.string().describe("Text on Destructive hex"),
    }),
    typography: z.object({
        fontFamily: z.string().describe("A standard web font name (Inter, Roboto, etc.)"),
        weights: z.object({
            displayLarge: z.string().describe("Font weight for Display Large (e.g. '800')"),
            heading1: z.string().describe("Font weight for H1 (e.g. '700')"),
            heading2: z.string().describe("Font weight for H2 (e.g. '600')"),
            bodyLarge: z.string().describe("Font weight for Body Large (e.g. '500')"),
            bodyRegular: z.string().describe("Font weight for Body Regular (e.g. '400')"),
            bodySmall: z.string().describe("Font weight for Body Small (e.g. '300')"),
        }),
    }),
});

export async function POST(req: Request) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing GOOGLE_API_KEY (or GEMINI_API_KEY)" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const userPrompt = body?.userPrompt as string | undefined;
        const moodboardUrls = body?.moodboard as string[] | undefined;

        // Build multimodal content array
        const contentParts: any[] = [];

        // Text instruction comes first
        contentParts.push({
            type: "text" as const,
            text: `You are a world-class UI/UX designer and Design System architect.\n\nAnalyze the provided moodboard images and the user's design intent below. Extract a harmonious, cohesive design system that includes an 18-color palette and a 6-level typography hierarchy.\n\nUser's Design Intent: "${userPrompt || 'Create a modern, premium SaaS design system based on these images.'}"`,
        });

        // Add images
        if (Array.isArray(moodboardUrls) && moodboardUrls.length > 0) {
            for (const url of moodboardUrls) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) continue;
                    const contentType = response.headers.get("content-type") || "image/jpeg";
                    const buffer = Buffer.from(await response.arrayBuffer());
                    const base64 = buffer.toString("base64");
                    contentParts.push({
                        type: "image" as const,
                        image: `data:${contentType};base64,${base64}`,
                    });
                } catch {
                    // Skip failed images
                }
            }
        }

        const result = await generateObject({
            model: google("gemini-2.5-flash"),
            messages: [
                {
                    role: "user",
                    content: contentParts,
                },
            ],
            schema: StyleGuideSchema,
        });

        return NextResponse.json(result.object);
    } catch (error) {
        const details = error instanceof Error ? error.message : "Unknown error";
        console.error("Style guide extraction failed:", details);
        return NextResponse.json({ error: details }, { status: 500 });
    }
}
