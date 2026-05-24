"use client";

import { useSelector, useDispatch } from "react-redux";
import { setTextPrompt } from "@/store/slices/styleGuideSlice";
import { Sparkles } from "lucide-react";

export const PromptTab = ({
    onGenerate,
}: {
    onGenerate: () => void;
}) => {
    const dispatch = useDispatch();
    const textPrompt = useSelector((state: any) => state.styleGuide.textPrompt);
    const isGenerating = useSelector((state: any) => state.styleGuide.isGenerating);

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Instructions */}
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white/90">Design Prompt</h2>
                <p className="text-xs text-white/40">
                    Describe the vibe, specific elements, or content you want in the design.
                    The AI will combine this with your wireframe layout and moodboard style.
                </p>
            </div>

            {/* Text Area */}
            <div className="flex-1 min-h-0">
                <textarea
                    value={textPrompt}
                    onChange={(e) => dispatch(setTextPrompt(e.target.value))}
                    placeholder="e.g. Make it feel like a premium SaaS dashboard. Use glassmorphism cards, dark mode with purple accents. The hero section should have a bold headline and a CTA button..."
                    className="w-full h-full min-h-[200px] bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all"
                />
            </div>

            {/* Tips */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { title: "Layout", tip: "Drawn on Canvas" },
                    { title: "Style", tip: "From Moodboard" },
                    { title: "Instructions", tip: "This prompt" },
                ].map((item) => (
                    <div key={item.title} className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{item.title}</p>
                        <p className="text-xs text-white/60">{item.tip}</p>
                    </div>
                ))}
            </div>

            {/* Generate Button */}
            <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
                <Sparkles size={16} />
                {isGenerating ? "Generating..." : "Generate High-Fidelity Design"}
            </button>
        </div>
    );
};
