"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  Image as ImageIcon,
  Pencil,
  Sparkles,
  Smartphone,
  Monitor,
  Loader2,
} from "lucide-react";

interface InspirationBoardProps {
  projectId: string;
  onGenerateStart?: () => void;
  onGenerateComplete?: () => void;
}

type TabType = "wireframes" | "references";
type DesignMode = "mobile" | "web";

export const InspirationBoard = ({
  projectId,
  onGenerateStart,
  onGenerateComplete,
}: InspirationBoardProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("wireframes");
  const [designMode, setDesignMode] = useState<DesignMode>("mobile");
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const wireframeInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const wireframes = useQuery(api.moodBoards.getByType, {
    projectId: projectId as Id<"projects">,
    imageType: "wireframe",
  });
  const references = useQuery(api.moodBoards.getByType, {
    projectId: projectId as Id<"projects">,
    imageType: "reference",
  });

  // Mutations
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const addMoodBoardImage = useMutation(api.moodBoards.add);
  const removeMoodBoardImage = useMutation(api.moodBoards.remove);

  // Actions
  const generateFromInspirationBoard = useAction(
    api.designAgent.generateFromInspirationBoard
  );

  const currentImages = activeTab === "wireframes" ? wireframes : references;

  const handleUploadClick = () => {
    if (activeTab === "wireframes") {
      wireframeInputRef.current?.click();
    } else {
      referenceInputRef.current?.click();
    }
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
        projectId: projectId as Id<"projects">,
        storageId,
        x: 0,
        y: 0,
        imageType: activeTab === "wireframes" ? "wireframe" : "reference",
      });
    } catch (error) {
      console.error("Upload failed:", error);
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemoveImage = async (id: Id<"moodBoards">) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await removeMoodBoardImage({ id });
    } catch (error) {
      console.error("Failed to remove image:", error);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleGenerate = async () => {
    if (wireframes?.length === 0) {
      alert("Please upload at least one wireframe sketch first.");
      return;
    }

    setIsGenerating(true);
    onGenerateStart?.();

    try {
      await generateFromInspirationBoard({
        projectId: projectId as Id<"projects">,
        designMode,
        userPrompt: `Generate ${designMode} app designs from wireframes`,
      });
      onGenerateComplete?.();
    } catch (error) {
      console.error("Generation failed:", error);
      alert(`Failed to generate designs: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 p-3 pb-2">
        <button
          onClick={() => setActiveTab("wireframes")}
          className={cn(
            "flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === "wireframes"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/70 hover:bg-white/5"
          )}
        >
          <Pencil className="w-3.5 h-3.5" />
          Wireframes
          {wireframes && wireframes.length > 0 && (
            <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">
              {wireframes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("references")}
          className={cn(
            "flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === "references"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/70 hover:bg-white/5"
          )}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          References
          {references && references.length > 0 && (
            <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">
              {references.length}
            </span>
          )}
        </button>
      </div>

      {/* Design Mode Toggle */}
      <div className="px-3 pb-3">
        <div className="flex bg-black/20 rounded-lg p-1">
          <button
            onClick={() => setDesignMode("mobile")}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5",
              designMode === "mobile"
                ? "bg-purple-500/30 text-purple-200"
                : "text-white/50 hover:text-white/70"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
          <button
            onClick={() => setDesignMode("web")}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5",
              designMode === "web"
                ? "bg-blue-500/30 text-blue-200"
                : "text-white/50 hover:text-white/70"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            Web
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-3 pb-3">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (wireframes?.length || 0) === 0}
          className={cn(
            "w-full h-11 font-medium transition-all",
            designMode === "mobile"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating {designMode} designs...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate {designMode === "mobile" ? "Mobile" : "Web"} Designs
            </>
          )}
        </Button>
        {(wireframes?.length || 0) === 0 && (
          <p className="text-[10px] text-white/40 text-center mt-2">
            Upload wireframes to enable generation
          </p>
        )}
      </div>

      {/* Image Grid */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-3 pb-4">
          {/* Upload Zone */}
          <button
            onClick={handleUploadClick}
            className={cn(
              "w-full h-24 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2",
              "border-white/10 hover:border-white/20 hover:bg-white/5",
              activeTab === "wireframes"
                ? "bg-purple-500/5 hover:bg-purple-500/10"
                : "bg-blue-500/5 hover:bg-blue-500/10"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                activeTab === "wireframes" ? "bg-purple-500/20" : "bg-blue-500/20"
              )}
            >
              <Upload
                className={cn(
                  "w-5 h-5",
                  activeTab === "wireframes"
                    ? "text-purple-400"
                    : "text-blue-400"
                )}
              />
            </div>
            <span className="text-xs text-white/50">
              {activeTab === "wireframes"
                ? "Upload wireframe sketch"
                : "Upload reference image"}
            </span>
          </button>

          {/* Images */}
          {currentImages
            ?.filter((img) => !deletingIds.has(img._id))
            .map((img) => (
              <GlassCard
                key={img._id}
                className="p-0 overflow-hidden group relative"
              >
                <button
                  onClick={() => handleRemoveImage(img._id)}
                  className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {img.url ? (
                  <img
                    src={img.url}
                    className="w-full aspect-[4/3] object-cover"
                    alt={activeTab === "wireframes" ? "Wireframe" : "Reference"}
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-white/5 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white/20" />
                  </div>
                )}

                <div className="p-2 bg-black/40 backdrop-blur-sm">
                  <p className="text-[10px] text-white/60 truncate">
                    {activeTab === "wireframes" ? "Wireframe" : "Reference"} •
                    Uploaded
                  </p>
                </div>
              </GlassCard>
            ))}

          {/* Empty State */}
          {currentImages?.length === 0 && (
            <div className="text-center py-8">
              <div
                className={cn(
                  "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                  activeTab === "wireframes"
                    ? "bg-purple-500/10"
                    : "bg-blue-500/10"
                )}
              >
                {activeTab === "wireframes" ? (
                  <Pencil
                    className={cn(
                      "w-8 h-8",
                      activeTab === "wireframes"
                        ? "text-purple-400/50"
                        : "text-blue-400/50"
                    )}
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-blue-400/50" />
                )}
              </div>
              <p className="text-sm text-white/50 mb-1">
                No {activeTab === "wireframes" ? "wireframes" : "references"}{" "}
                yet
              </p>
              <p className="text-xs text-white/30">
                Upload {activeTab === "wireframes" ? "sketches" : "inspiration"}{" "}
                to get started
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={wireframeInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={referenceInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};
