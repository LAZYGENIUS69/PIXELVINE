// Forces rebuild
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";
const GEMINI_MODEL = "gemini-2.5-flash";

const getGeminiClient = () => {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_API_KEY (or GEMINI_API_KEY)");
    }
    return new GoogleGenerativeAI(apiKey);
};

const cleanModelJsonText = (text: string) => {
    const withoutFences = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBrace = withoutFences.indexOf("{");
    const lastBrace = withoutFences.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return withoutFences.slice(firstBrace, lastBrace + 1);
    }
    return withoutFences;
};

// Strip common markdown fences around code blocks so we can return raw React/Tailwind code.
const cleanModelCodeText = (text: string) => {
    return text
        .replace(/```tsx/g, "")
        .replace(/```jsx/g, "")
        .replace(/```typescript/g, "")
        .replace(/```javascript/g, "")
        .replace(/```/g, "")
        .trim();
};
// Helper to retry Gemini calls on 429
const generateContentWithRetry = async (model: any, prompt: any, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error: any) {
            if (error.message?.includes("429") || error.status === 429) {
                if (i === retries - 1) throw error;
                console.log(`Gemini 429 hit. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
};

export const parseDesignIntent = action({
    args: {
        projectId: v.id("projects"),
        imageBase64: v.string(),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        // 1. Set Analyzing State
        await ctx.runMutation(api.projects.setAnalyzing, {
            id: args.projectId,
            isAnalyzing: true
        });

        try {
            // 2. Prepare Image for Gemini
            // Remove header if present "data:image/png;base64,"
            const base64Data = args.imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

            const model = getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });

            const prompt = `You are a Senior UX Architect. Analyze this UI sketch. Identify every element (Button, Input, Text, Container) and their spatial relationships. Output a JSON object: { "elements": Array<{ id, type, x, y, w, h, label, intent }>, "layout_score": number, "primary_vibe": string }. Assign a unique 'id' (e.g., "el_1") to each element. Return ONLY the JSON string, no markdown formatting.`;

            const result = await generateContentWithRetry(model, [
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png",
                    },
                },
            ]);

            const responseText = result.response.text();

            // Clean markdown code blocks if Gemini returns them
            const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

            // 3. Save AST to DB
            await ctx.runMutation(api.projects.saveDesignAST, {
                id: args.projectId,
                designAST: cleanJson,
            });

            return { success: true };

        } catch (error) {
            console.error("Gemini Analysis Failed:", error);
            // Reset analyzing state on failure
            await ctx.runMutation(api.projects.setAnalyzing, {
                id: args.projectId,
                isAnalyzing: false
            });
            throw new Error("Failed to analyze design");
        }
    }
});

export const critiqueDesign = action({
    args: {
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        // 1. Fetch Design AST
        const project = await ctx.runQuery(api.projects.get, { id: args.projectId });
        if (!project || !project.designAST) throw new Error("No design to critique");

        // 2. Call Gemini Pro
        const model = getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `
            You are a Critical UX Design Agent. Review this Design AST and critique it.
            
            Design AST:
            ${project.designAST}

            Evaluate against:
            1. WCAG Accessibility (Contrast, Sizing)
            2. Visual Hierarchy (Clear CTA?)
            3. Cognitive Load (Clutter?)

            Return a JSON object with a "issues" array:
            { 
               "issues": Array<{ 
                  "severity": "high" | "medium" | "low", 
                  "element_id": string, 
                  "issue": string, 
                  "suggestion": string, 
                  "heuristic": string 
               }> 
            }
            Return ONLY JSON.
         `;

        try {
            const result = await generateContentWithRetry(model, prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

            // 3. Save Critique
            await ctx.runMutation(api.projects.saveCritique, {
                id: args.projectId,
                critique: cleanJson,
            });

            return { success: true };

        } catch (error) {
            console.error("Critique Failed:", error);
            throw new Error("Failed to critique design");
        }
    }
});

export const generateRenderPrompt = action({
    args: {
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        const project = await ctx.runQuery(api.projects.get, { id: args.projectId });
        if (!project || !project.designAST) throw new Error("No design to render");

        const model = getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `
            You are a Prompt Engineer for Flux.1 Pro. Convert this Design AST into a detailed image generation prompt.
            
            Design AST:
            ${project.designAST}
            
            Rules:
            1. Describe the layout precisely based on the AST (coordinates).
            2. Infer a "Modern SaaS" aesthetic (Glassmorphism, Dark Mode, Purple/Blue neon accents) unless hints say otherwise.
            3. Include "high fidelity, ui design, dribbble, 8k, ray tracing".
            4. Output ONLY the raw prompt string.
        `;

        const result = await generateContentWithRetry(model, prompt);
        return result.response.text();
    }
});

export const generateImage = action({
    args: {
        projectId: v.id("projects"),
        prompt: v.string(),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        await ctx.runMutation(api.projects.setAnalyzing, {
            id: args.projectId,
            isAnalyzing: true
        });

        try {
            // Call Replicate API
            const response = await fetch("https://api.replicate.com/v1/predictions", {
                method: "POST",
                headers: {
                    "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    version: process.env.REPLICATE_FLUX_VERSION || "4c5f9e6c8c5f4e4c8e4c8e4c8c5f9e6c8c5f4e4c",
                    input: {
                        prompt: args.prompt,
                        aspect_ratio: "16:9",
                        output_format: "jpg",
                        output_quality: 90,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Replicate API error: ${response.statusText}`);
            }

            const prediction = await response.json();

            // Poll for completion
            let imageUrl = null;
            let attempts = 0;
            const maxAttempts = 60; // 60 seconds timeout

            while (!imageUrl && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));

                const statusResponse = await fetch(prediction.urls.get, {
                    headers: {
                        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
                    }
                });

                const status = await statusResponse.json();

                if (status.status === "succeeded") {
                    imageUrl = Array.isArray(status.output) ? status.output[0] : status.output;
                } else if (status.status === "failed") {
                    throw new Error("Image generation failed");
                }

                attempts++;
            }

            if (!imageUrl) {
                throw new Error("Image generation timed out");
            }

            await ctx.runMutation(api.projects.saveRender, {
                id: args.projectId,
                url: imageUrl
            });

            return { success: true, url: imageUrl };

        } catch (error) {
            console.error("Image generation failed:", error);
            await ctx.runMutation(api.projects.setAnalyzing, {
                id: args.projectId,
                isAnalyzing: false
            });
            throw new Error("Failed to generate image");
        }
    }
});


export const generateStyleGuide = action({
    args: {
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        // 1. Fetch Moodboard Images
        // We need to fetch the images first to get their storage IDs or URLs.
        // Since this is an action, we can call queries.
        const moodBoards = await ctx.runQuery(api.moodBoards.get, { projectId: args.projectId });
        const imageUrls = moodBoards.map((m: any) => m.url).filter((u: any) => u !== null) as string[];

        if (imageUrls.length === 0) {
            throw new Error("No inspiration images found.");
        }

        await ctx.runMutation(api.projects.setAnalyzing, {
            id: args.projectId,
            isAnalyzing: true
        });

        try {
            const model = getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });

            const prompt = `
            You are a Design System Expert. Analyze these moodboard images.
            Extract a cohesive design system (Color Palette and Typography).

            Output a JSON object:
            {
              "palette": {
                "background": "Hex Code (Page Background - usually dark/black for modern SaaS)",
                "foreground": "Hex Code (Main Text)",
                "card": "Hex Code (Surface/Container)",
                "cardForeground": "Hex Code (Text on Card)",
                "primary": "Hex Code (Main Brand Color)",
                "primaryForeground": "Hex Code (Text on Primary)",
                "secondary": "Hex Code (Supporting Color)",
                "secondaryForeground": "Hex Code (Text on Secondary)",
                "muted": "Hex Code (Subtle Backgrounds)",
                "mutedForeground": "Hex Code (Subtle Text)",
                "accent": "Hex Code (Interactive/Highlight)",
                "accentForeground": "Hex Code (Text on Accent)",
                "popover": "Hex Code (Modal/Dropdown Background)",
                "popoverForeground": "Hex Code (Text on Popover)",
                "border": "Hex Code (Borders)",
                "input": "Hex Code (Form Inputs)",
                "ring": "Hex Code (Focus Rings)",
                "destructive": "Hex Code (Error/Danger)",
                "destructiveForeground": "Hex Code (Text on Destructive)"
              },
              "typography": {
                "fontFamily": "Name of a standard web font (Inter, Roboto, Playfair Display) that matches the vibe",
                "weights": {
                  "displayLarge": "Font weight (e.g. '800', 'Bold')",
                  "heading1": "Font weight (e.g. '700', 'Bold')",
                  "heading2": "Font weight (e.g. '600', 'SemiBold')",
                  "bodyLarge": "Font weight (e.g. '500', 'Medium')",
                  "bodyRegular": "Font weight (e.g. '400', 'Regular')",
                  "bodySmall": "Font weight (e.g. '300', 'Light')"
                }
              }
            }
            Return ONLY the valid JSON string. No markdown formatting.
            `;

            // Prepare images for Gemini (Flash supports image URLs or base64? 
            // The node SDK usually prefers base64 or FileData.
            // For simplicity and speed with local/storage URLs, let's fetch them and convert to base64 parts.)

            const imageParts = await Promise.all(imageUrls.map(async (url) => {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch moodboard image: ${response.status}`);
                }
                const contentType = response.headers.get("content-type") || "image/jpeg";
                const buffer = await response.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = "";
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                return {
                    inlineData: {
                        data: base64,
                        mimeType: contentType
                    }
                };
            }));

            const result = await generateContentWithRetry(model, [
                prompt,
                ...imageParts
            ]);

            const responseText = result.response.text();
            const cleanJson = cleanModelJsonText(responseText);
            const parsed = JSON.parse(cleanJson);

            // Turn off analyzing
            await ctx.runMutation(api.projects.setAnalyzing, {
                id: args.projectId,
                isAnalyzing: false
            });

            return parsed;

        } catch (error) {
            console.error("Style Guide Gen Failed:", error);
            await ctx.runMutation(api.projects.setAnalyzing, {
                id: args.projectId,
                isAnalyzing: false
            });
            const details = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to generate style guide: ${details}`);
        }
    }
});

export const generateHighFidelityDesign = action({
    args: {
        projectId: v.id("projects"),
        shapes: v.array(v.any()),
        activeFrame: v.optional(v.object({
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
        })),
        styleGuide: v.object({
            palette: v.any(),
            typography: v.any(),
        }),
        userPrompt: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // const userId = await auth.getUserId(ctx);
        // if (!userId) throw new Error("Unauthorized");

        // Fetch moodboard inspiration for this project
        const moodBoards = await ctx.runQuery(api.moodBoards.get, { projectId: args.projectId });
        const imageUrls = moodBoards.map((m: any) => m.url).filter((u: any) => u !== null) as string[];

        const model = getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });

        // Scope shapes to the active frame (if provided)
        let scopedShapes = args.shapes;
        if (args.activeFrame) {
            const frame = args.activeFrame;
            scopedShapes = args.shapes.filter((shape: any) => {
                if (!shape) return false;
                // Frames are allowed if they match the active frame id, but since
                // this action receives raw shapes we scope by geometry only.
                const w = shape.width || 0;
                const h = shape.height || 0;
                const cx = shape.x + w / 2;
                const cy = shape.y + h / 2;
                return (
                    cx >= frame.x &&
                    cx <= frame.x + frame.width &&
                    cy >= frame.y &&
                    cy <= frame.y + frame.height
                );
            });
        }

        const paletteJson = JSON.stringify(args.styleGuide?.palette ?? {}, null, 2);
        const typographyJson = JSON.stringify(args.styleGuide?.typography ?? {}, null, 2);
        const wireframeJson = JSON.stringify(
            {
                shapes: scopedShapes ?? [],
                activeFrame: args.activeFrame ?? null,
            },
            null,
            2
        );

        const userGoal = args.userPrompt || "Generate a high-fidelity React UI based on this wireframe and moodboard.";

        const systemPrompt = `
You are a Senior Lead UI/UX Engineer at a top-tier design agency.
Your mission is to synthesize a high-fidelity website design by following a strict hierarchy of priorities.

PRIORITY HIERARCHY:
  1. HIGH PRIORITY — User Text Prompt (Defines the 'Soul' and specific details)
  2. MEDIUM PRIORITY — Moodboard Images (Defines the 'Skin' and visual quality)
  3. LOW PRIORITY — Wireframe Sketch (Defines ONLY the general 'Skeleton')

EXECUTION STEPS:
  STEP 1: Identify the "Aesthetic North Star" from the User Text Prompt. This defines the brand personality, tone, and specific features to implement.
  STEP 2: Use the Moodboard Images to select production-ready UI component styles (rounded corners, specific shadows, glassmorphism, gradients, depth layers).
  STEP 3: Place those styled components according to the Wireframe's spatial layout.
  STEP 4: Apply the 18-color palette variables precisely using inline styles with exact hex values:
     - background/foreground for page-level
     - card/cardForeground for containers
     - primary/primaryForeground for CTAs and brand elements
     - accent/accentForeground for highlights and interactive states
     - muted/mutedForeground for subtle backgrounds and secondary text
     - destructive for error states
     - border/input/ring for form elements
  STEP 5: Apply the 6-level typography hierarchy:
     - Display Large for hero/banner text
     - Heading 1 for page titles
     - Heading 2 for section titles
     - Body Large for lead paragraphs
     - Body Regular for standard text
     - Body Small for captions and meta

OUTPUT REQUIREMENTS:
- Pure React + Tailwind CSS code.
- Export as: export default function Component() { ... }
- Import only from 'lucide-react' if needed. No other imports.
- Zero "placeholder" text — generate real, context-aware marketing copy based on the User Text Prompt.
- Use Lucide icons that match the moodboard style.
- Implement a modern, "Dribbble-quality" finish with depth (shadows, layers, gradients) and consistent spacing (8px grid).
- Desktop-first layout (1440px viewport).
- Do NOT transcribe text from moodboard images.
- Do NOT include markdown code fences in your output.
`;

        const userPromptBlock = `
TEXT BLUEPRINT (Priority 1 — the Soul):
"${userGoal}"

STYLE DNA (18-color palette + 6-level typography):
  Palette: ${paletteJson}
  Typography: ${typographyJson}
  Font Family: ${args.styleGuide?.typography?.fontFamily || 'Inter'}

SPATIAL SKELETON (Priority 3 — general layout only):
${wireframeJson}

VISUAL DNA (Priority 2): [See attached moodboard images — extract visual quality, not text]
`;

        // Prepare moodboard images as inline data for Gemini Vision
        const imageParts = await Promise.all(
            imageUrls.map(async (url) => {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch moodboard image: ${response.status}`);
                }
                const contentType = response.headers.get("content-type") || "image/jpeg";
                const buffer = await response.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = "";
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                return {
                    inlineData: {
                        data: base64,
                        mimeType: contentType,
                    },
                };
            })
        );

        const result = await generateContentWithRetry(model, [
            { text: systemPrompt + "\n\n" + userPromptBlock },
            ...imageParts,
        ]);

        const raw = result.response.text();
        const code = cleanModelCodeText(raw);

        return { code };
    },
});
