import { useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useDispatch } from "react-redux";
import { setStyleGuide } from "@/store/slices/styleGuideSlice";
import { RootState } from "@/store/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

export const MoodboardTab = ({
    setActiveTab,
    onParseDesign,
}: {
    setActiveTab: (tab: "colours" | "typography" | "moodboard") => void;
    onParseDesign: (imageBase64: string) => Promise<void>;
}) => {
    const params = useParams();
    const projectId = params.projectId as Id<"projects">;
    const { toast } = useToast();
    const dispatch = useDispatch();
    type StyleGuideResult = {
        palette: RootState["styleGuide"]["palette"];
        typography: RootState["styleGuide"]["typography"];
    };

    // Data
    const moodBoardImages = useQuery(api.moodBoards.get, { projectId });

    // Actions
    const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
    const addMoodBoardImage = useMutation(api.moodBoards.add);
    const removeMoodBoardImage = useMutation(api.moodBoards.remove);
    const generateStyleGuide = useAction(api.ai.generateStyleGuide);

    // State
    const [isGenerating, setIsGenerating] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => fileInputRef.current?.click();

    const toBase64 = async (url: string) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            await addMoodBoardImage({
                projectId,
                storageId,
                x: 0,
                y: 0
            });
        } catch (error) {
            console.error("Upload failed:", error);
            toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
        }
    };

    const handleRemoveImage = async (e: React.MouseEvent, id: Id<"moodBoards">) => {
        e.stopPropagation();
        setDeletingIds(prev => new Set(prev).add(id));
        try {
            await removeMoodBoardImage({ id });
        } catch (error) {
            console.error("Failed to remove image:", error);
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleGenerateStyleGuide = async () => {
        if (!moodBoardImages || moodBoardImages.length === 0) {
            toast({ title: "No Inspiration", description: "Add images to the moodboard first.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        try {
            const moodboardUrls = moodBoardImages
                .map((img) => img.url)
                .filter((url): url is string => Boolean(url));

            const seedImage = moodBoardImages.find((img) => img.url)?.url;
            if (seedImage) {
                try {
                    const imageBase64 = await toBase64(seedImage);
                    await onParseDesign(imageBase64);
                } catch (parseError) {
                    // Style guide generation can continue even if parsing fails.
                    console.warn("parseDesignIntent failed; continuing style guide generation.", parseError);
                }
            }

            let result: StyleGuideResult;

            try {
                result = await generateStyleGuide({ projectId }) as StyleGuideResult;
            } catch (convexError) {
                const message = convexError instanceof Error ? convexError.message : "";
                const missingAction =
                    message.includes("Could not find public function") ||
                    message.includes("ai:generateStyleGuide");

                if (!missingAction) {
                    throw convexError;
                }

                const fallbackResponse = await fetch("/api/style-guide", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ moodboard: moodboardUrls }),
                });

                if (!fallbackResponse.ok) {
                    const fallbackError = await fallbackResponse.json().catch(() => ({}));
                    throw new Error(fallbackError?.error || "Fallback style guide generation failed.");
                }

                result = await fallbackResponse.json() as StyleGuideResult;
            }

            // Dispatch to Redux
            dispatch(setStyleGuide({
                palette: result.palette,
                typography: result.typography
            }));

            toast({ title: "Style Guide Generated", description: "Palette and Typography updated from moodboard." });
            setActiveTab("colours");
        } catch (error) {
            console.error("Generation failed:", error);
            const message = error instanceof Error ? error.message : "Could not generate style guide.";
            toast({ title: "Generation Failed", description: message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="animate-in slide-in-from-bottom-5 duration-300 h-full">
            <div className="grid h-full min-h-[520px] grid-cols-1 gap-6 lg:grid-cols-[1fr_180px]">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                    <div className="grid h-full grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                        {moodBoardImages?.filter(img => !deletingIds.has(img._id)).map((img) => (
                            <div key={img._id} className="relative group aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                <img src={img.url!} alt="Moodboard" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                                    <button
                                        onClick={(e) => handleRemoveImage(e, img._id)}
                                        className="p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-all"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleUploadClick}
                            className="aspect-square rounded-xl border border-dashed border-white/20 bg-white/[0.02] flex items-center justify-center hover:bg-white/[0.05] transition-colors"
                        >
                            <div className="text-center">
                                <Plus size={18} className="mx-auto mb-2 text-white/60" />
                                <span className="text-xs font-medium text-white/65">Add More</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                    <Button
                        onClick={handleUploadClick}
                        variant="outline"
                        className="h-9 justify-center border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add More
                    </Button>

                    <Button
                        onClick={handleGenerateStyleGuide}
                        disabled={isGenerating || !moodBoardImages || moodBoardImages.length === 0}
                        className={cn(
                            "h-10 justify-center rounded-full bg-white text-black hover:bg-white/90",
                            isGenerating && "cursor-not-allowed"
                        )}
                    >
                        {isGenerating ? (
                            <>
                                <span className="relative mr-2 inline-flex h-4 w-4 items-center justify-center">
                                    <Sparkles className="h-4 w-4 animate-pulse" />
                                    <Sparkles className="absolute h-4 w-4 animate-ping opacity-30" />
                                </span>
                                Analyzing DNA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate with AI
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
};
