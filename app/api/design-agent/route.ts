import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes — the agent may take a while

/**
 * POST /api/design-agent
 *
 * Triggers the dual-step Design Agent pipeline.
 * Body: { projectId: string, userPrompt: string }
 *
 * The frontend should subscribe to `api.generationJobs.getByProject` and
 * `api.frames.getByProject` via Convex's useQuery to receive real-time
 * progress updates as screens are generated one by one.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, userPrompt } = body;

        if (!projectId || !userPrompt) {
            return NextResponse.json(
                { error: "projectId and userPrompt are required" },
                { status: 400 }
            );
        }

        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
            return NextResponse.json(
                { error: "NEXT_PUBLIC_CONVEX_URL not configured" },
                { status: 500 }
            );
        }

        const client = new ConvexHttpClient(convexUrl);

        // Fire the Convex action using the anyApi reference to avoid
        // import issues with Turbopack and convex/_generated/api.
        const { anyApi } = await import("convex/server");
        const result = await client.action(
            (anyApi as any).designAgent.runDesignAgent,
            { projectId, userPrompt }
        );

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[/api/design-agent] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
