"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/glass-card";

interface Issue {
    severity: "high" | "medium" | "low";
    element_id: string; // We might need to map this to coordinates if we don't have direct object ref
    issue: string;
    suggestion: string;
    heuristic: string;
}

interface DesignElement {
    id?: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface CritiqueOverlayProps {
    critique: string;
    designAST: string;
}

export const CritiqueOverlay = ({ critique, designAST }: CritiqueOverlayProps) => {

    // Parse Data
    let issues: Issue[] = [];
    let elements: DesignElement[] = [];

    try {
        if (critique) {
            const parsed = JSON.parse(critique);
            issues = parsed.issues || [];
        }
        if (designAST) {
            const parsed = JSON.parse(designAST);
            elements = parsed.elements || [];
        }
    } catch (e) {
        console.error("Critique Parse Error", e);
    }

    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

    if (issues.length === 0) return null;

    // Helper to find coords
    const getCoords = (elementId: string) => {
        // Simple fuzzy match or exact match on ID
        // Phase 1 now generates "el_1" etc. Phase 2 returns "el_1". 
        // We look for match.
        const el = elements.find(e => e.id === elementId);
        // Fallback: Gemini might hallucinate ID, or refer to "Button". 
        // We can't do much if ID is wrong, but phase 1 update helps.
        return el;
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {issues.map((issue, i) => {
                const el = getCoords(issue.element_id);
                if (!el) return null;

                // Position pulse
                return (
                    <div
                        key={i}
                        className="absolute pointer-events-auto cursor-pointer group"
                        style={{
                            left: el.x,
                            top: el.y,
                            width: el.w,
                            height: el.h,
                        }}
                        onClick={() => setSelectedIssue(issue)}
                    >
                        {/* Pulse Ring */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 1.2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                            className={`absolute inset-0 rounded-lg border-2 ${getSeverityColor(issue.severity)}`}
                        />
                        {/* Solid Border on Hover/Active */}
                        <div className={`absolute inset-0 rounded-lg border-2 opacity-50 group-hover:opacity-100 transition-opacity ${getSeverityColor(issue.severity)}`} />

                        {/* Icon Badge */}
                        <div className="absolute -top-3 -right-3 bg-[#050505] rounded-full p-1 border border-white/10">
                            {getSeverityIcon(issue.severity)}
                        </div>
                    </div>
                );
            })}

            {/* Critique Details Tooltip / Modal */}
            <AnimatePresence>
                {selectedIssue && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-24 right-4 w-80 pointer-events-auto"
                    >
                        <GlassCard className="border-l-4 border-l-red-500 p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    {getSeverityIcon(selectedIssue.severity)}
                                    {selectedIssue.heuristic}
                                </h4>
                                <button onClick={() => setSelectedIssue(null)} className="text-white/30 hover:text-white">✕</button>
                            </div>
                            <p className="text-sm text-white/80">{selectedIssue.issue}</p>
                            <div className="bg-white/5 p-2 rounded text-xs text-green-400 mt-2">
                                <span className="font-bold block mb-1">Suggestion:</span>
                                {selectedIssue.suggestion}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const getSeverityColor = (s: string) => {
    if (s === "high") return "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
    if (s === "medium") return "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
    return "border-yellow-500";
};

const getSeverityIcon = (s: string) => {
    if (s === "high") return <AlertCircle className="size-4 text-red-500" />;
    if (s === "medium") return <AlertTriangle className="size-4 text-orange-500" />;
    return <Info className="size-4 text-yellow-500" />;
};
