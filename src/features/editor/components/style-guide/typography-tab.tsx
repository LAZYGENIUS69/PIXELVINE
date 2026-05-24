import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const TYPE_SCALE = [
    { key: "displayLarge", label: "Display Large", caption: "Hero headings and large display text", sizeClass: "text-[46px] md:text-[56px]", lineHeight: "1.05" },
    { key: "heading1", label: "Heading 1", caption: "Primary section headers", sizeClass: "text-[32px] md:text-[40px]", lineHeight: "1.1" },
    { key: "heading2", label: "Heading 2", caption: "Secondary headers and subheads", sizeClass: "text-[24px] md:text-[30px]", lineHeight: "1.2" },
    { key: "bodyLarge", label: "Body Large", caption: "Large body text for emphasis", sizeClass: "text-[18px] md:text-[20px]", lineHeight: "1.5" },
    { key: "bodyRegular", label: "Body Regular", caption: "Standard body text and paragraphs", sizeClass: "text-[15px] md:text-[16px]", lineHeight: "1.6" },
    { key: "bodySmall", label: "Body Small", caption: "Small labels and captions", sizeClass: "text-[12px] md:text-[13px]", lineHeight: "1.5" },
] as const;

export const TypographyTab = () => {
    const { typography } = useSelector((state: RootState) => state.styleGuide);
    const family = typography?.fontFamily || "Inter";

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300 pb-8 max-w-4xl">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-white/45">Font Family</p>
                <p className="text-sm font-semibold text-white">{family}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
                {TYPE_SCALE.map((entry) => (
                    <TypePreview
                        key={entry.key}
                        label={entry.label}
                        caption={entry.caption}
                        sizeClass={entry.sizeClass}
                        lineHeight={entry.lineHeight}
                        fontWeight={typography?.weights?.[entry.key] || "400"}
                        fontFamily={family}
                    />
                ))}
            </div>
        </div>
    );
};

const TypePreview = ({
    label,
    caption,
    sizeClass,
    lineHeight,
    fontWeight,
    fontFamily,
}: {
    label: string;
    caption: string;
    sizeClass: string;
    lineHeight: string;
    fontWeight: string;
    fontFamily: string;
}) => (
    <div className="border-b border-white/10 py-4 last:border-b-0 last:pb-0">
        <p className="text-xs font-semibold text-white/70">{label}</p>
        <p className="mb-2 text-[10px] text-white/35">{caption}</p>
        <p
            className={`${sizeClass} text-white`}
            style={{ fontWeight, lineHeight, fontFamily }}
        >
            The quick brown fox jumps over the lazy dog
        </p>
    </div>
);
