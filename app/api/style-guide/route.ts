import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"] as const;

const cleanModelJsonText = (text: string) => {
    const withoutFences = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBrace = withoutFences.indexOf("{");
    const lastBrace = withoutFences.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return withoutFences.slice(firstBrace, lastBrace + 1);
    }
    return withoutFences;
};

export async function POST(req: Request) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing GOOGLE_API_KEY (or GEMINI_API_KEY)" }, { status: 500 });
    }

    const body = await req.json();
    const moodboard = body?.moodboard as string[] | undefined;

    if (!Array.isArray(moodboard) || moodboard.length === 0) {
        return NextResponse.json({ error: "No moodboard images provided." }, { status: 400 });
    }

    try {
        const client = new GoogleGenerativeAI(apiKey);

        const imageParts = await Promise.all(
            moodboard.map(async (url) => {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch moodboard image: ${response.status}`);
                }
                const contentType = response.headers.get("content-type") || "image/jpeg";
                const buffer = Buffer.from(await response.arrayBuffer());
                return {
                    inlineData: {
                        data: buffer.toString("base64"),
                        mimeType: contentType,
                    },
                };
            })
        );

        const prompt = `
You are a Design System Expert. Analyze these moodboard images.
Extract a cohesive design system (Color Palette and Typography).

Output a JSON object:
{
  "palette": {
    "background": "Hex Code (Page Background)",
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
    "fontFamily": "Name of a standard web font",
    "weights": {
      "displayLarge": "Weight",
      "heading1": "Weight",
      "heading2": "Weight",
      "bodyLarge": "Weight",
      "bodyRegular": "Weight",
      "bodySmall": "Weight"
    }
  }
}
Return ONLY valid JSON.
`;

        let lastError: unknown;
        let parsed: unknown = null;

        for (const modelName of MODEL_CANDIDATES) {
            try {
                const model = client.getGenerativeModel({ model: modelName });
                const result = await model.generateContent([prompt, ...imageParts]);
                const text = result.response.text();
                parsed = JSON.parse(cleanModelJsonText(text));
                break;
            } catch (error) {
                lastError = error;
                const message = error instanceof Error ? error.message : "";
                const isModelAliasError =
                    message.includes("not found for API version") ||
                    message.includes("models/") ||
                    message.includes("404");
                if (!isModelAliasError) {
                    throw error;
                }
            }
        }

        if (!parsed) {
            const details = lastError instanceof Error ? lastError.message : "No compatible Gemini model alias found.";
            throw new Error(details);
        }

        return NextResponse.json(parsed);
    } catch (error) {
        const details = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: details }, { status: 500 });
    }
}
