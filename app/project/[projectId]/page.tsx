"use client";

import React, { use, useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Editor, EditorHandle } from "@/src/features/editor/components/editor";

// Redux Imports
import { useDispatch, useSelector } from "react-redux";
import { undo, redo } from "@/store/slices/canvasSlice";
import { setIsGenerating } from "@/store/slices/styleGuideSlice";
import { RootState } from "@/store/store";

// Components
import { GenerateButton } from "@/src/features/editor/components/generate-button";
import { DesignAgentPanel } from "@/src/features/editor/components/design-agent-panel";
import { LeftSidebar } from "@/src/features/editor/components/sidebar";
import { TextEditorOverlay } from "@/src/features/editor/components/text-editor-overlay";
import { FrameActionsOverlay } from "@/src/features/editor/components/frame-actions-overlay";
import { GlassCard } from "@/components/glass-card";
import { PropertiesPanel } from "@/src/features/editor/components/properties-panel";
import { CritiqueOverlay } from "@/src/features/editor/components/critique-overlay";
import { RevealOverlay } from "@/src/features/editor/components/reveal-overlay";
import { Toolbar } from "@/src/features/editor/components/toolbar";
import { IntelligencePanel } from "@/src/features/editor/components/intelligence-panel";
import { StyleGuidePanel } from "@/src/features/editor/components/style-guide-panel";
import AIPreview from "@/components/AIPreview";
import { GenerationOverlay } from "@/components/overlays/generation-overlay";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutGrid, MessageSquare } from "lucide-react";
import { useDesignAgent } from "@/hooks/useDesignAgent";
import { DesignCanvas } from "@/components/DesignCanvas";
import { DesignChatBar } from "@/src/features/editor/components/DesignChatBar";

// Hooks
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import * as htmlToImage from "html-to-image";
import { saveAs } from "file-saver";
import { usePasteImage } from "@/hooks/use-paste-image";

interface ProjectIdPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

type ActiveView = "canvas" | "style-guide" | "design-canvas";
type DesignMode = "mobile" | "web";

const ProjectIdPage = ({
    params,
}: ProjectIdPageProps) => {
    const { projectId } = use(params);
    const [activeView, setActiveView] = useState<ActiveView>("canvas");
    return (
        <Suspense fallback={<div className="h-screen w-screen bg-[var(--background)]" />}>
            <ProjectIdPageContent projectId={projectId} activeView={activeView} setActiveView={setActiveView} />
        </Suspense>
    );
};

const ProjectIdPageContent = ({
    projectId,
    activeView,
    setActiveView,
}: {
    projectId: string;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
}) => {
    // AI actions: keep at the top-level of the component execution path.
    const parseDesign = useAction(api.ai.parseDesignIntent);
    const critiqueDesign = useAction(api.ai.critiqueDesign);
    const generatePrompt = useAction(api.ai.generateRenderPrompt);
    const generateImage = useAction(api.ai.generateImage);
    const generateHighFidelityDesign = useAction(api.ai.generateHighFidelityDesign);

    const dispatch = useDispatch();
    const handleUndo = () => dispatch(undo());
    const handleRedo = () => dispatch(redo());

    // Redux Selectors
    const { selectedShapeId } = useSelector((state: RootState) => state.canvas);
    const shapes = useSelector((state: RootState) => Object.values(state.canvas.entities));
    const { palette, typography, textPrompt, isGenerating } = useSelector((state: RootState) => state.styleGuide);

    const editorRef = useRef<EditorHandle>(null);
    const designPreviewRef = useRef<HTMLDivElement | null>(null);
    const [activeTool, setActiveTool] = useState("select");
    const [, setSelectedObject] = useState<unknown>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showReveal, setShowReveal] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
    const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
    const [showAgentPanel, setShowAgentPanel] = useState(false);
    const [designMode, setDesignMode] = useState<DesignMode>("mobile");
    const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
    const [showChatBar, setShowChatBar] = useState(true);

    const project = useQuery(api.projects.get, { id: projectId as Id<"projects"> });
    const moodBoards = useQuery(api.moodBoards.get, { projectId: projectId as Id<"projects"> });
    const { toast } = useToast();
    usePasteImage(projectId);
    const router = useRouter();

    // --- Design Agent Orchestration ---
    const agent = useDesignAgent(projectId as Id<"projects">);
    const regenerateFrame = useAction(api.designAgent.regenerateSingleFrame);
    const [regeneratingFrameId, setRegeneratingFrameId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const agentPromptTriggered = useRef(false);

    // Catch agent_prompt from URL (set by Prompt Page) and auto-trigger
    useEffect(() => {
        const agentPrompt = searchParams.get("agent_prompt");
        if (agentPrompt && !agentPromptTriggered.current && !agent.isRunning) {
            agentPromptTriggered.current = true;
            setShowAgentPanel(true);
            agent.generate(agentPrompt).catch((err) => {
                console.error("Design Agent failed:", err);
                toast({
                    title: "Design Agent Failed",
                    description: err instanceof Error ? err.message : "Unknown error",
                    variant: "destructive",
                });
            });
        }
    }, [searchParams, agent, toast]);

    // Show agent panel when agent has frames
    useEffect(() => {
        if (agent.frames.length > 0) {
            setShowAgentPanel(true);
        }
    }, [agent.frames.length]);

    const onChangeActiveTool = (tool: string) => {
        if (tool === "magic_pen") {
            router.push(`/project/${projectId}/prompt`);
            return;
        }
        setActiveTool(tool);
    };

    const handleImageDragStart = (e: React.DragEvent, url: string) => {
        e.dataTransfer.setData("text/plain", url);
    };

    const worldToScreen = (x: number, y: number) => {
        if (editorRef.current) {
            return editorRef.current.worldToScreen(x, y);
        }
        return { x: 0, y: 0 };
    };

    const handleGenerate = async (options?: { simple?: boolean }) => {
        if (!editorRef.current) return;

        try {
            setIsGeneratingDesign(true);
            dispatch(setIsGenerating(true));

            // AI SCOPING
            let targetShapes = shapes;
            let scopeText = "";
            let activeFrameBounds: { x: number; y: number; width: number; height: number; } | undefined = undefined;

            if (selectedShapeId) {
                const selectedShape = shapes.find(s => s.id === selectedShapeId);
                if (selectedShape && selectedShape.type === 'frame') {
                    // ... (existing logic)
                    activeFrameBounds = {
                        x: selectedShape.x,
                        y: selectedShape.y,
                        width: selectedShape.width || 1200,
                        height: selectedShape.height || 800
                    };

                    targetShapes = shapes.filter(s => {
                        if (s.id === selectedShape.id) return true;
                        // ... (existing logic)
                        const sCx = s.x + (s.width || 0) / 2;
                        const sCy = s.y + (s.height || 0) / 2;
                        return sCx >= selectedShape.x && sCx <= selectedShape.x + (selectedShape.width || 0) &&
                            sCy >= selectedShape.y && sCy <= selectedShape.y + (selectedShape.height || 0);
                    });
                }
            }

            const userPrompt = textPrompt?.trim()
                ? textPrompt
                : options?.simple
                    ? "Generate a clean, single-screen React UI for this frame. Avoid animations and advanced interactions."
                    : "Generate a high-fidelity React UI based on these wireframes and the moodboard style.";

            const result = await generateHighFidelityDesign({
                projectId: projectId as Id<"projects">,
                shapes: targetShapes,
                ...(activeFrameBounds ? { activeFrame: activeFrameBounds } : {}),
                styleGuide: { palette, typography },
                userPrompt,
            });

            const code = (result as any)?.code as string | undefined;
            if (!code) {
                throw new Error("Gemini did not return any React code.");
            }

            setGeneratedCode(code);

        } catch (e: any) {
            console.error(e);
            const message = e instanceof Error ? e.message : "Failed to generate design.";
            toast({
                title: "Generation Failed",
                description: message,
                variant: "destructive",
                action: (
                    <ToastAction altText="Retry simpler" onClick={() => handleGenerate({ simple: true })}>
                        Retry (Simpler)
                    </ToastAction>
                ),
            });
        } finally {
            setIsGeneratingDesign(false);
            dispatch(setIsGenerating(false));
        }
    };

    const handleExportDesignImage = async () => {
        if (!designPreviewRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(designPreviewRef.current, {
                pixelRatio: 2,
            });
            const link = document.createElement("a");
            link.download = `visionsync-design-${projectId}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Export failed", e);
            toast({
                title: "Export Failed",
                description: "Could not export the design preview. Try again or refresh the page.",
                variant: "destructive",
            });
        }
    };

    const handleDownloadCode = () => {
        if (!generatedCode) return;
        const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `visionsync-design-${projectId}.tsx`);
    };

    const handleSyncIntelligence = async () => {
        if (!editorRef.current) return;
        const imageBase64 = editorRef.current.captureCanvas();
        if (!imageBase64) return;
        await parseDesign({
            projectId: projectId as Id<"projects">,
            imageBase64
        });
    };

    const handleParseDesignFromMoodboard = async (imageBase64: string) => {
        if (!imageBase64) return;
        try {
            await parseDesign({
                projectId: projectId as Id<"projects">,
                imageBase64
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleReviewDesign = async () => {
        try {
            await critiqueDesign({ projectId: projectId as Id<"projects"> });
        } catch (e) {
            console.error("Critique failed", e);
        }
    };

    const handleMakeReal = async () => {
        try {
            const prompt = await generatePrompt({ projectId: projectId as Id<"projects"> });
            if (!prompt) return;
            const result = await generateImage({ projectId: projectId as Id<"projects">, prompt });
            if (result.success) {
                setShowReveal(true);
            }
        } catch (e) {
            console.error("Make Real failed", e);
        }
    };

    useKeyboardShortcuts({
        onSetTool: setActiveTool,
        onGenerate: handleGenerate,
        onTogglePreview: () => setIsPreview(prev => !prev),
        onUndo: handleUndo,
        onRedo: handleRedo,
    });

    if (activeView === "style-guide") {
        return (
            <div className="h-full w-full bg-[var(--background)] relative overflow-hidden">
                {!isPreview && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                        <GlassCard className="flex items-center p-1 rounded-full gap-1">
                            <button
                                onClick={() => setActiveView("canvas")}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                Canvas
                            </button>
                            <button
                                onClick={() => setActiveView("design-canvas")}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                Screens
                            </button>
                            <button
                                onClick={() => setActiveView("style-guide")}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${'bg-white/20 text-white'}`}
                            >
                                Style Guide
                            </button>
                        </GlassCard>
                    </div>
                )}
                <StyleGuidePanel onParseDesign={handleParseDesignFromMoodboard} onGenerate={() => handleGenerate()} />
            </div>
        );
    }

    if (activeView === "design-canvas") {
        return (
            <div className="h-full w-full bg-[var(--background)] relative overflow-hidden flex">
                {/* Header / Global Controls */}
                {!isPreview && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                        <GlassCard className="flex items-center p-1 rounded-full gap-1">
                            <button
                                onClick={() => setActiveView('canvas')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                Canvas
                            </button>
                            <button
                                onClick={() => setActiveView('design-canvas')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${'bg-white/20 text-white'}`}
                            >
                                Screens
                            </button>
                            <button
                                onClick={() => setActiveView('style-guide')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                Style Guide
                            </button>
                        </GlassCard>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex">
                    {/* Design Canvas */}
                    <div className="flex-1">
                        <DesignCanvas
                            frames={agent.frames as any}
                            projectId={projectId}
                            projectName={project?.name}
                            isGenerating={agent.isRunning || !!regeneratingFrameId}
                            progress={agent.progress}
                            designMode={designMode}
                            activeFrameId={activeFrameId}
                            onFrameSelect={(frameId) => setActiveFrameId(frameId)}
                            onRegenerate={async (frameId) => {
                                if (regeneratingFrameId) return; // prevent double-click
                                setRegeneratingFrameId(frameId);
                                try {
                                    // Grab colors from the existing job if available
                                    const jobTheme = agent.job?.theme ? JSON.parse(agent.job.theme as string) : {};
                                    await regenerateFrame({
                                        frameId: frameId as Id<"frames">,
                                        userPrompt: project?.name || "mobile app",
                                        primaryColor: jobTheme.primary,
                                        accentColor: jobTheme.accent,
                                        bgColor: jobTheme.bg,
                                    });
                                } catch (err) {
                                    console.error("Regenerate failed:", err);
                                    toast({
                                        title: "Regeneration Failed",
                                        description: err instanceof Error ? err.message : "Unknown error",
                                        variant: "destructive",
                                    });
                                } finally {
                                    setRegeneratingFrameId(null);
                                }
                            }}
                            onDelete={async (frameId) => {
                                try {
                                    // delete handled by agent panel; here just log for DesignCanvas
                                    console.log("Delete frame from DesignCanvas:", frameId);
                                    // Clear active frame if deleted
                                    if (frameId === activeFrameId) {
                                        setActiveFrameId(null);
                                    }
                                } catch (err) {
                                    console.error("Delete failed:", err);
                                }
                            }}
                        />
                    </div>

                    {/* Right Chat Bar */}
                    {showChatBar && (
                        <div className="w-[360px] h-full border-l border-white/10 bg-black/20">
                            <DesignChatBar
                                projectId={projectId}
                                activeFrameId={activeFrameId}
                                activeFrameName={activeFrameId ? agent.frames.find((f: any) => f._id === activeFrameId)?.name : undefined}
                                onClose={() => setShowChatBar(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Chat Toggle Button (when chat is closed) */}
                {!showChatBar && (
                    <button
                        onClick={() => setShowChatBar(true)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25 transition-all"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                )}

                {/* Full-screen generation overlay */}
                {agent.isRunning && (
                    <GenerationOverlay
                        projectId={projectId}
                        progress={agent.progress}
                        status={agent.job?.status}
                        currentScreenName={
                            agent.frames.find((f: any) => f.status === "generating")?.name
                        }
                    />
                )}
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[var(--background)] relative overflow-hidden">
            {/* Header / Global Controls */}
            {!isPreview && (
                <>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                        <GlassCard className="flex items-center p-1 rounded-full gap-1">
                            <button
                                onClick={() => setActiveView('canvas')}
                                className='px-4 py-1.5 rounded-full text-xs font-medium transition-colors bg-white/20 text-white'
                            >
                                Canvas
                            </button>
                            <button
                                onClick={() => setActiveView('design-canvas')}
                                className='px-4 py-1.5 rounded-full text-xs font-medium transition-colors text-white/50 hover:text-white hover:bg-white/10'
                            >
                                Screens
                            </button>
                            <button
                                onClick={() => setActiveView('style-guide')}
                                className='px-4 py-1.5 rounded-full text-xs font-medium transition-colors text-white/50 hover:text-white hover:bg-white/10'
                            >
                                Style Guide
                            </button>
                        </GlassCard>
                    </div>

                    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                        {generatedCode && (
                            <GlassCard className="flex items-center gap-2 px-3 py-1.5 rounded-full border-white/15 bg-black/50">
                                <span className="text-[11px] text-white/60 hidden md:inline">
                                    Design ready
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] px-2 border-white/30 text-white/80 hover:bg-white/10"
                                    onClick={handleExportDesignImage}
                                >
                                    PNG
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 text-[11px] px-2"
                                    onClick={handleDownloadCode}
                                >
                                    Code
                                </Button>
                            </GlassCard>
                        )}
                        <GenerateButton projectId={projectId} onClick={() => handleGenerate()} isRunning={agent.isRunning || isGeneratingDesign} />
                        <Button
                            onClick={() => router.push(`/project/${projectId}/prompt`)}
                            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/25"
                        >
                            <Sparkles className="w-4 h-4" />
                            Design with AI
                        </Button>
                    </div>
                </>
            )}

            {/* Canvas View Container - Strictly Rendered */}
            {activeView === 'canvas' && (
                <>
                    {/* Editor Canvas */}
                    <div className="absolute inset-0 z-0">
                        <Editor
                            ref={editorRef}
                            projectId={projectId}
                            initialData={project?.sketchesData ?? "{}"}
                            activeTool={activeTool}
                            onSelectionChange={setSelectedObject}
                        />
                    </div>

                    {!isPreview && (
                        <>
                            <LeftSidebar
                                projectId={projectId}
                                collapsed={isSidebarCollapsed}
                                onToggle={() => setIsSidebarCollapsed(prev => !prev)}
                            />

                            <Toolbar
                                activeTool={activeTool}
                                onChangeActiveTool={onChangeActiveTool}
                                onGenerate={() => handleGenerate()}
                                onSyncIntelligence={handleSyncIntelligence}
                                onReviewDesign={handleReviewDesign}
                                onMakeReal={handleMakeReal}
                                onUndo={handleUndo}
                                onRedo={handleRedo}
                            />

                            {selectedShapeId && (
                                <div className="absolute right-0 top-20 h-[calc(100vh-160px)] w-[300px] z-40 transition-all duration-300">
                                    <GlassCard className="h-full p-0 overflow-hidden border-r-0 rounded-r-none">
                                        <PropertiesPanel />
                                    </GlassCard>
                                </div>
                            )}

                            {(project?.isAnalyzing || project?.designAST) && (
                                <IntelligencePanel
                                    isAnalyzing={project?.isAnalyzing}
                                    designAST={project?.designAST}
                                />
                            )}
                        </>
                    )}

                    <TextEditorOverlay worldToScreen={worldToScreen} />

                    <FrameActionsOverlay
                        worldToScreen={worldToScreen}
                        onGenerate={() => handleGenerate()}
                        onToggleInspiration={() => setIsSidebarCollapsed(prev => !prev)}
                    />

                    {(project?.critique && project?.designAST) && (
                        <CritiqueOverlay
                            critique={project.critique}
                            designAST={project.designAST}
                        />
                    )}

                    {project?.renderUrl && showReveal && (
                        <RevealOverlay
                            renderUrl={project.renderUrl}
                            onClose={() => setShowReveal(false)}
                        />
                    )}

                    {/* High-fidelity preview panel — old single-code mode */}
                    {generatedCode && !showAgentPanel && (
                        <div className={`absolute z-50 transition-all duration-300 ${isFullScreenPreview
                            ? "inset-4 w-auto h-auto"
                            : "bottom-4 right-4 w-[380px] h-[260px] hidden lg:block"
                            }`}>
                            <GlassCard className="h-full p-3 flex flex-col gap-2 border-white/15 bg-black/70">
                                <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span>High-Fidelity Preview</span>
                                        {isGeneratingDesign && (
                                            <span className="text-[10px] text-purple-300 animate-pulse">
                                                Updating...
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsFullScreenPreview(!isFullScreenPreview)}
                                            className="hover:text-white p-1 rounded hover:bg-white/10"
                                        >
                                            {isFullScreenPreview ? "Minimize" : "Expand"}
                                        </button>
                                        <button
                                            onClick={() => setGeneratedCode(null)}
                                            className="hover:text-red-400 p-1 rounded hover:bg-white/10"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                                <div
                                    ref={designPreviewRef}
                                    className="flex-1 overflow-hidden rounded-md bg-black/90 relative"
                                >
                                    <div className="absolute inset-0 overflow-auto">
                                        <div className={`${isFullScreenPreview ? 'min-h-full min-w-full' : 'w-full h-full'} bg-white text-black`}>
                                            <AIPreview code={generatedCode} />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* Design Agent multi-frame panel */}
                    {showAgentPanel && agent.frames.length > 0 && (
                        <DesignAgentPanel
                            frames={agent.frames as any}
                            progress={agent.progress}
                            isRunning={agent.isRunning}
                            isDone={agent.isDone}
                            onClose={() => setShowAgentPanel(false)}
                            projectId={projectId}
                        />
                    )}

                    {/* Shimmer overlay across the active frame while generating */}
                    {isGeneratingDesign && selectedShapeId && (() => {
                        const frame = shapes.find(s => s.id === selectedShapeId && s.type === "frame");
                        if (!frame || !editorRef.current) return null;
                        const topLeft = editorRef.current.worldToScreen(frame.x, frame.y);
                        const bottomRight = editorRef.current.worldToScreen(
                            frame.x + (frame.width || 0),
                            frame.y + (frame.height || 0)
                        );
                        const width = bottomRight.x - topLeft.x;
                        const height = bottomRight.y - topLeft.y;
                        if (width <= 0 || height <= 0) return null;
                        return (
                            <div
                                className="absolute pointer-events-none z-30 overflow-hidden"
                                style={{
                                    left: topLeft.x,
                                    top: topLeft.y,
                                    width,
                                    height,
                                }}
                            >
                                <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse" />
                            </div>
                        );
                    })()}
                </>
            )}

            {/* Full-screen generation overlay */}
            {isGenerating && <GenerationOverlay />}

            {/* Design Agent generation overlay */}
            {agent.isRunning && (
                <GenerationOverlay
                    projectId={projectId}
                    progress={agent.progress}
                    status={agent.job?.status}
                    currentScreenName={
                        agent.frames.find((f: any) => f.status === "generating")?.name
                    }
                />
            )}

        </div>
    );
};

export default ProjectIdPage;
