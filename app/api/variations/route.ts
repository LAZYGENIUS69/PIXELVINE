
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
        shapes,
        activeFrame,
        style,
        styleDescription,
        type,
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

    const systemPrompt = `You are a Senior Lead UI/UX Engineer at a top-tier design agency specializing in ${style} design.
Your mission is to synthesize a high-fidelity ${type} design following the ${style} aesthetic principles.

STYLE GUIDELINES — ${style}:
${styleDescription}

PRIORITY HIERARCHY:
  1. HIGH PRIORITY: User Text Prompt (Defines the 'Soul' and specific details).
  2. MEDIUM PRIORITY: Moodboard Images (Defines the 'Skin' and visual quality).
  3. LOW PRIORITY: Wireframe Sketch (Defines ONLY the general 'Skeleton').

EXECUTION STEPS:
  STEP 1: Identify the "Aesthetic North Star" from the context.
  STEP 2: Apply ${style} design principles rigorously throughout the component.
  STEP 3: Use moodboard visual DNA to select production-ready UI components.
  STEP 4: Place components according to the spatial skeleton.
  STEP 5: Apply the 18-color palette variables precisely.

OUTPUT REQUIREMENTS:
  - Pure React + Tailwind CSS code.
  - Zero "placeholder" text; generate real marketing copy based on the context.
  - Use Lucide icons that match the ${style} aesthetic.
  - Output MUST be a single-file Next.js component ready for immediate use.
  - Export as 'export default function Component() { ... }'
  - NO markdown code fences in output.`;

    const userPromptBlock = `
<context_dna>
  <design_style>
    Style: ${style}
    Type: ${type}
    Description: ${styleDescription}
  </design_style>

  <visual_dna priority="1">
    [Moodboard Images Attached]
    Palette: ${paletteJson}
    Typography: ${typographyJson}
    Font Family: ${styleGuide?.typography?.fontFamily || 'Inter'}
  </visual_dna>

  <spatial_skeleton priority="2">
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

    try {
        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Variation generation failed:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate variation' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
