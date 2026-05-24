"use client";

import { GlassCard } from "@/components/glass-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Palette, Type, LayoutGrid, MessageSquare } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ColorsTab } from "./style-guide/colors-tab";
import { TypographyTab } from "./style-guide/typography-tab";
import { MoodboardTab } from "./style-guide/moodboard-tab";
import { PromptTab } from "./style-guide/prompt-tab";

type StyleGuideTab = "moodboard" | "colours" | "typography" | "prompt";

export const StyleGuidePanel = ({
    onParseDesign,
    onGenerate,
}: {
    onParseDesign: (imageBase64: string) => Promise<void>;
    onGenerate: () => void;
}) => {
    const [activeTab, setActiveTab] = useState<StyleGuideTab>("moodboard");

    return (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-[1360px] h-full flex flex-col p-8 md:p-10 overflow-hidden border-white/10 shadow-2xl bg-black/80">

                {/* Header & Tabs */}
                <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-4xl font-semibold text-white mb-2">Style Guide</h1>
                        <p className="text-white/50 text-sm">Manage your style guide for your project.</p>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                        <TabButton
                            active={activeTab === "colours"}
                            onClick={() => setActiveTab("colours")}
                            icon={<Palette size={13} />}
                            label="Colours"
                        />
                        <TabButton
                            active={activeTab === 'typography'}
                            onClick={() => setActiveTab('typography')}
                            icon={<Type size={13} />}
                            label="Typography"
                        />
                        <TabButton
                            active={activeTab === 'moodboard'}
                            onClick={() => setActiveTab('moodboard')}
                            icon={<LayoutGrid size={13} />}
                            label="Moodboard"
                        />
                        <TabButton
                            active={activeTab === 'prompt'}
                            onClick={() => setActiveTab('prompt')}
                            icon={<MessageSquare size={13} />}
                            label="Prompt"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <ScrollArea className="flex-1">
                    {activeTab === "colours" && <ColorsTab />}
                    {activeTab === "typography" && <TypographyTab />}
                    {activeTab === "moodboard" && (
                        <MoodboardTab
                            setActiveTab={setActiveTab}
                            onParseDesign={onParseDesign}
                        />
                    )}
                    {activeTab === "prompt" && (
                        <PromptTab onGenerate={onGenerate} />
                    )}
                </ScrollArea>

            </GlassCard>
        </div>
    );
}

// Sub-components
const TabButton = ({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            active ? "bg-white/15 text-white shadow-inner" : "text-white/55 hover:text-white hover:bg-white/5"
        )}
    >
        {icon}
        {label}
    </button>
);
