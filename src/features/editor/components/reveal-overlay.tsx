"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass-card";
import { X } from "lucide-react";
import Image from "next/image";

interface RevealOverlayProps {
    renderUrl: string;
    onClose: () => void;
}

export const RevealOverlay = ({ renderUrl, onClose }: RevealOverlayProps) => {
    // Reveal Slider Logic
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    // Initial "Wipe" Animation
    const [hasRevealed, setHasRevealed] = useState(false);

    useEffect(() => {
        // Auto-wipe effect on mount
        const timer = setTimeout(() => {
            setHasRevealed(true);
            setSliderPos(100); // Fully reveal
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (!renderUrl) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-[90%] h-[90%] max-w-7xl max-h-[800px] bg-[#050505] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[60] bg-black/50 p-2 rounded-full text-white/70 hover:text-white"
                >
                    <X className="size-6" />
                </button>

                {/* Image */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <img
                        src={renderUrl}
                        alt="Rendered Design"
                        className="object-contain w-full h-full"
                    />
                </div>

                {/* You could add a "Compare" slider here if we had the original screenshot as a layer underneath, 
                     but for now, simpler is creating a nice modal. */}
            </div>
        </div>
    );
};
