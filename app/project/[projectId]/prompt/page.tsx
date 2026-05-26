"use client";

import React, { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GlassCard } from "@/components/glass-card";
import { Sparkles, ArrowRight, Wand2, Layout, Palette, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromptPageProps {
    params: Promise<{ projectId: string }>;
}

const PromptPage = ({ params }: PromptPageProps) => {
    const { projectId } = use(params);
    return <PromptPageContent projectId={projectId} />;
};

const SUGGESTIONS = [
    "A premium fitness tracking app with dark mode, progress charts, and social leaderboards",
    "A modern SaaS landing page with a hero section, pricing table, testimonials, and FAQ",
    "A sleek e-commerce product page for luxury headphones with 3D-style imagery",
    "A creative portfolio website for a photographer with a masonry grid gallery",
    "A fintech dashboard showing account balances, transaction history, and spending analytics",
    "A food delivery app with restaurant listings, menu cards, and an order tracker",
];

const PromptPageContent = ({ projectId }: { projectId: string }) => {
    const router = useRouter();
    const project = useQuery(api.projects.get, { id: projectId as Id<"projects"> });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [prompt, setPrompt] = useState("");
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleGenerate = () => {
        if (!prompt.trim() || isNavigating) return;
        setIsNavigating(true);
        const encoded = encodeURIComponent(prompt.trim());
        router.push(`/project/${projectId}?agent_prompt=${encoded}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleGenerate();
        }
    };

    return (
        <div className="h-screen w-screen bg-[var(--background)] flex items-center justify-center relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/6 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[100px]" />
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center gap-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <Wand2 className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        What would you like to design?
                    </h1>
                    <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
                        Describe your vision. Our AI Architect will plan the screens, then the Designer will build each one with production-quality React + Tailwind.
                    </p>
                </div>

                {/* Prompt input card */}
                <GlassCard className="w-full p-0 overflow-hidden border-white/10">
                    <div className="p-4">
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. Build a premium fitness app with dark mode, progress charts, workout planner, and social leaderboards..."
                            rows={5}
                            className="w-full bg-transparent text-white text-sm placeholder:text-white/20 outline-none resize-none leading-relaxed"
                        />
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4 text-[10px] text-white/25 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                                <Layout className="w-3 h-3" /> Multi-screen
                            </span>
                            <span className="flex items-center gap-1">
                                <Palette className="w-3 h-3" /> Auto-theme
                            </span>
                            <span className="flex items-center gap-1">
                                <Type className="w-3 h-3" /> Typography
                            </span>
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isNavigating}
                            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/20 transition-all duration-300 disabled:opacity-30"
                        >
                            {isNavigating ? (
                                <>
                                    <Sparkles className="w-4 h-4 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    Generate
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </GlassCard>

                {/* Suggestions */}
                <div className="w-full space-y-3">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest text-center">
                        Try a suggestion
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {SUGGESTIONS.map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(suggestion)}
                                className="text-left text-xs text-white/40 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-lg px-3 py-2.5 transition-all duration-200 line-clamp-2"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shortcut hint */}
                <p className="text-[10px] text-white/15 tracking-wide">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">⌘ Enter</kbd> to generate
                </p>
            </div>

            {/* Back link */}
            <button
                onClick={() => router.push(`/project/${projectId}`)}
                className="absolute top-6 left-6 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
                ← Back to canvas
            </button>

            {/* Project name */}
            {project && (
                <div className="absolute top-6 right-6 text-xs text-white/20">
                    {project.name}
                </div>
            )}
        </div>
    );
};

export default PromptPage;
