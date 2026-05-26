
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: Request) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return new Response("Missing GOOGLE_API_KEY (or GEMINI_API_KEY)", { status: 500 });
    }

    const {
        sketch,
        moodboard,
        styleGuide,
        prompt,
        shapes,
        activeFrame,
    } = await req.json();

    const paletteJson = JSON.stringify(styleGuide?.palette ?? {}, null, 2);
    const typographyJson = JSON.stringify(styleGuide?.typography ?? {}, null, 2);
    const wireframeJson = JSON.stringify(
        {
            shapes: shapes ?? [],
            activeFrame: activeFrame ?? null,
        },
        null,
        2
    );

    const systemPrompt = `You are a Senior Lead UI/UX Engineer at a top-tier design agency.
Your mission is to synthesize a high-fidelity website design by following a strict hierarchy of priorities.

PRIORITY HIERARCHY:
  1. HIGH PRIORITY: User Text Prompt (Defines the 'Soul' and specific details).
  2. MEDIUM PRIORITY: Moodboard Images (Defines the 'Skin' and visual quality).
  3. LOW PRIORITY: Wireframe Sketch (Defines ONLY the general 'Skeleton').

EXECUTION STEPS:
  STEP 1: Identify the "Aesthetic North Star" from the <text_blueprint>.
  STEP 2: Use <visual_dna> to select production-ready UI components (rounded corners, specific shadows).
  STEP 3: Place those components according to the <spatial_skeleton>.
  STEP 4: Apply the 18-color palette variables precisely.

OUTPUT REQUIREMENTS:
  - Pure React + Tailwind CSS code.
  - Zero "placeholder" text; generate real marketing copy based on the <text_blueprint>.
  - Use Lucide icons that match the moodboard style.
  - Output MUST be a single-file Next.js component ready for the "Download" trigger.
  - Export as 'export default function Component() { ... }'`;

    const userPromptBlock = `
<context_dna>
  <text_blueprint priority="1">
    ${prompt || "Generate a high-fidelity React component based on this sketch and moodboard."}
  </text_blueprint>

  <visual_dna priority="2">
    [Moodboard Images Attached]
    Palette: ${paletteJson}
    Typography: ${typographyJson}
    Font Family: ${styleGuide?.typography?.fontFamily || 'Inter'}
  </visual_dna>

  <spatial_skeleton priority="3">
    ${wireframeJson}
  </spatial_skeleton>
</context_dna>`;

    const content: any[] = [
        { type: 'text', text: userPromptBlock },
    ];

    // Add sketch image
    if (sketch) {
        content.push({ type: 'image', image: sketch });
    }

    // Add moodboard images
    if (Array.isArray(moodboard)) {
        for (const url of moodboard) {
            content.push({ type: 'image', image: url });
        }
    }

    const messages = [
        {
            role: 'user' as const,
            content,
        },
    ];

    const result = await streamText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}
