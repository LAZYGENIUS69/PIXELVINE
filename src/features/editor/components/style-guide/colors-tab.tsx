import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

type PaletteKey = keyof RootState["styleGuide"]["palette"];

const COLOR_SECTIONS: Array<{
    title: string;
    items: Array<{ key: PaletteKey; label: string; description: string }>;
}> = [
    {
        title: "Primary Colours",
        items: [
            { key: "background", label: "Background", description: "Main content area background" },
            { key: "foreground", label: "Foreground", description: "Primary text color with high contrast" },
            { key: "card", label: "Card", description: "Elevated surface color for cards" },
            { key: "cardForeground", label: "Card Foreground", description: "Text color on card surfaces" },
        ],
    },
    {
        title: "Secondary & Accent Colors",
        items: [
            { key: "primary", label: "Primary", description: "Brand color for CTAs and emphasis" },
            { key: "primaryForeground", label: "Primary Foreground", description: "Text on primary elements" },
            { key: "secondary", label: "Secondary", description: "Supporting color for secondary actions" },
            { key: "secondaryForeground", label: "Secondary Foreground", description: "Text on secondary elements" },
            { key: "accent", label: "Accent", description: "Highlight color for links and accents" },
            { key: "accentForeground", label: "Accent Foreground", description: "Text on accent elements" },
        ],
    },
    {
        title: "UI Component Colors",
        items: [
            { key: "muted", label: "Muted", description: "Subtle backgrounds and muted states" },
            { key: "mutedForeground", label: "Muted Foreground", description: "Secondary text and captions" },
            { key: "popover", label: "Popover", description: "Modal and dropdown backgrounds" },
            { key: "popoverForeground", label: "Popover Foreground", description: "Text in overlays and dropdowns" },
            { key: "border", label: "Border", description: "Subtle borders and dividers" },
            { key: "input", label: "Input", description: "Form field backgrounds" },
        ],
    },
    {
        title: "Utility & Form Colors",
        items: [
            { key: "ring", label: "Ring", description: "Focus indicators for controls" },
        ],
    },
    {
        title: "Status & Feedback Colors",
        items: [
            { key: "destructive", label: "Destructive", description: "Error states and destructive actions" },
            { key: "destructiveForeground", label: "Destructive Foreground", description: "Text on destructive elements" },
        ],
    },
];

const ColorCard = ({
    label,
    hex,
    description,
}: {
    label: string;
    hex: string;
    description: string;
}) => (
    <div className="flex items-start gap-3 py-2">
        <div
            className="h-8 w-8 shrink-0 rounded-md border border-white/15"
            style={{ backgroundColor: hex || "#000000" }}
        />
        <div className="space-y-0.5">
            <p className="text-[13px] font-medium text-white">{label}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/55">{hex || "N/A"}</p>
            <p className="text-[11px] text-white/35">{description}</p>
        </div>
    </div>
);

export const ColorsTab = () => {
    const { palette } = useSelector((state: RootState) => state.styleGuide);

    return (
        <div className="animate-in slide-in-from-bottom-5 duration-300 pb-10">
            {COLOR_SECTIONS.map((section) => (
                <section key={section.title} className="mb-6">
                    <h3 className="mb-3 text-sm font-medium text-white/55">
                        {section.title}
                    </h3>
                    <div className="grid grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-2 xl:grid-cols-4">
                        {section.items.map((item) => (
                            <ColorCard
                                key={item.key}
                                label={item.label}
                                hex={palette?.[item.key] || "#000000"}
                                description={item.description}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};
