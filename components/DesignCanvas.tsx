"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIPreview from "@/components/AIPreview";
import { Button } from "@/components/ui/button";
import {
  Download,
  ImageIcon,
  X,
  Maximize2,
  Grid3X3,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Code,
  FileJson,
  Share2,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { saveAs } from "file-saver";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/glass-card";
import { cn } from "@/lib/utils";

export interface Frame {
  _id: string;
  name: string;
  purpose: string;
  htmlContent: string;
  status: "pending" | "generating" | "done" | "error";
  order: number;
}

type DesignMode = "mobile" | "web";

interface DesignCanvasProps {
  frames: Frame[];
  projectId: string;
  projectName?: string;
  isGenerating?: boolean;
  progress?: { completed: number; total: number; percent: number };
  onRegenerate?: (frameId: string) => void;
  onDelete?: (frameId: string) => void;
  onReorder?: (frameIds: string[]) => void;
  designMode?: DesignMode;
  activeFrameId?: string | null;
  onFrameSelect?: (frameId: string | null) => void;
}

type ViewMode = "grid" | "list" | "detail";

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-white/30", bg: "bg-white/5" },
  generating: { icon: Loader2, color: "text-purple-400", bg: "bg-purple-500/10" },
  done: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export const DesignCanvas = ({
  frames,
  projectId,
  projectName = "Untitled Project",
  isGenerating = false,
  progress = { completed: 0, total: 0, percent: 0 },
  onRegenerate,
  onDelete,
  onReorder,
  designMode = "mobile",
  activeFrameId,
  onFrameSelect,
}: DesignCanvasProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Sync activeFrameId with selectedFrameIndex
  useEffect(() => {
    if (activeFrameId) {
      const index = frames.findIndex(f => f._id === activeFrameId);
      if (index !== -1) {
        setSelectedFrameIndex(index);
      }
    }
  }, [activeFrameId, frames]);
  
  // Handle frame selection
  const handleFrameSelect = (index: number) => {
    setSelectedFrameIndex(index);
    onFrameSelect?.(frames[index]._id);
  };

  const completedFrames = frames.filter((f) => f.status === "done");

  const handleExportPng = async (frame: Frame, index: number) => {
    const frameElement = document.getElementById(`frame-preview-${frame._id}`);
    if (!frameElement) return;

    try {
      const dataUrl = await htmlToImage.toPng(frameElement, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${frame.name || `screen-${index + 1}`}-${projectId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleExportAll = async () => {
    if (completedFrames.length === 0) return;
    setIsExporting(true);

    try {
      for (let i = 0; i < completedFrames.length; i++) {
        const frame = completedFrames[i];
        const frameElement = document.getElementById(`frame-preview-${frame._id}`);
        if (frameElement) {
          const dataUrl = await htmlToImage.toPng(frameElement, { pixelRatio: 2 });
          const link = document.createElement("a");
          link.download = `${frame.name || `screen-${i + 1}`}-${projectId}.png`;
          link.href = dataUrl;
          link.click();
          // Small delay to prevent browser throttling
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (e) {
      console.error("Batch export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCode = (frame: Frame) => {
    if (!frame.htmlContent) return;
    const blob = new Blob([frame.htmlContent], { type: "text/html;charset=utf-8" });
    saveAs(blob, `${frame.name || "screen"}-${projectId}.html`);
  };

  const handleDownloadAllCode = () => {
    if (completedFrames.length === 0) return;

    completedFrames.forEach((frame, index) => {
      if (frame.htmlContent) {
        const blob = new Blob([frame.htmlContent], { type: "text/html;charset=utf-8" });
        saveAs(blob, `${frame.name || `screen-${index + 1}`}-${projectId}.html`);
      }
    });
  };

  const navigateFrame = (direction: "prev" | "next") => {
    if (selectedFrameIndex === null) return;
    if (direction === "prev" && selectedFrameIndex > 0) {
      setSelectedFrameIndex(selectedFrameIndex - 1);
    } else if (direction === "next" && selectedFrameIndex < frames.length - 1) {
      setSelectedFrameIndex(selectedFrameIndex + 1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedFrameIndex === null) return;
      if (e.key === "ArrowLeft") navigateFrame("prev");
      if (e.key === "ArrowRight") navigateFrame("next");
      if (e.key === "Escape") setSelectedFrameIndex(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFrameIndex, frames.length]);

  return (
    <div className="h-full w-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{projectName}</h1>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {completedFrames.length} screens
            </span>
            {isGenerating && (
              <span className="flex items-center gap-1.5 text-purple-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating {progress.completed}/{progress.total}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

          {/* Export Actions */}
          {completedFrames.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/10"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
                <DropdownMenuItem
                  onClick={handleExportAll}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Export All as PNG
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadAllCode}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Download All Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={gridRef} className="flex-1 overflow-auto p-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {frames.map((frame, index) => (
              <motion.div
                key={frame._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FrameCard
                  frame={frame}
                  index={index}
                  isSelected={frame._id === activeFrameId}
                  designMode={designMode}
                  onClick={() => handleFrameSelect(index)}
                  onExport={() => handleExportPng(frame, index)}
                  onDownloadCode={() => handleDownloadCode(frame)}
                  onRegenerate={onRegenerate ? () => onRegenerate(frame._id) : undefined}
                  onDelete={onDelete ? () => onDelete(frame._id) : undefined}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {frames.map((frame, index) => (
              <motion.div
                key={frame._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <FrameListItem
                  frame={frame}
                  index={index}
                  isSelected={frame._id === activeFrameId}
                  designMode={designMode}
                  onClick={() => handleFrameSelect(index)}
                  onExport={() => handleExportPng(frame, index)}
                  onDownloadCode={() => handleDownloadCode(frame)}
                  onRegenerate={onRegenerate ? () => onRegenerate(frame._id) : undefined}
                  onDelete={onDelete ? () => onDelete(frame._id) : undefined}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFrameIndex !== null && (
          <FrameDetailModal
            frame={frames[selectedFrameIndex]}
            index={selectedFrameIndex}
            total={frames.length}
            onClose={() => setSelectedFrameIndex(null)}
            onPrev={() => navigateFrame("prev")}
            onNext={() => navigateFrame("next")}
            onExport={() => handleExportPng(frames[selectedFrameIndex], selectedFrameIndex)}
            onDownloadCode={() => handleDownloadCode(frames[selectedFrameIndex])}
            onRegenerate={
              onRegenerate ? () => onRegenerate(frames[selectedFrameIndex]._id) : undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual Frame Card (Grid View)
const FrameCard = ({
  frame,
  index,
  isSelected,
  designMode,
  onClick,
  onExport,
  onDownloadCode,
  onRegenerate,
  onDelete,
}: {
  frame: Frame;
  index: number;
  isSelected?: boolean;
  designMode?: DesignMode;
  onClick: () => void;
  onExport: () => void;
  onDownloadCode: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
}) => {
  const status = STATUS_CONFIG[frame.status];
  const StatusIcon = status.icon;

  return (
    <GlassCard className={cn(
      "group relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl",
      isSelected 
        ? "ring-2 ring-purple-500 shadow-purple-500/20" 
        : "hover:shadow-purple-500/10"
    )}>
      {/* Preview Area */}
      <div
        className="aspect-[9/19] bg-zinc-950 relative overflow-hidden"
        id={`frame-preview-${frame._id}`}
        onClick={onClick}
      >
        {frame.status === "done" && frame.htmlContent ? (
          <div className="w-full h-full overflow-hidden">
            <AIPreview code={frame.htmlContent} designType="mobile" />
          </div>
        ) : frame.status === "generating" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
              <p className="text-xs text-white/40">Designing...</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <StatusIcon className={`w-12 h-12 ${status.color}`} />
          </div>
        )}

        {/* Hover Overlay */}
        {frame.status === "done" && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              View
            </Button>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
              <span className="text-sm font-medium text-white truncate">{frame.name}</span>
            </div>
            <p className="text-xs text-white/40 mt-1 line-clamp-1">{frame.purpose}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
              {frame.status === "done" && (
                <>
                  <DropdownMenuItem
                    onClick={onExport}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Export PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDownloadCode}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Download Code
                  </DropdownMenuItem>
                </>
              )}
              {onRegenerate && (
                <DropdownMenuItem
                  onClick={onRegenerate}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </GlassCard>
  );
};

// Individual Frame List Item (List View)
const FrameListItem = ({
  frame,
  index,
  isSelected,
  designMode,
  onClick,
  onExport,
  onDownloadCode,
  onRegenerate,
  onDelete,
}: {
  frame: Frame;
  index: number;
  isSelected?: boolean;
  designMode?: DesignMode;
  onClick: () => void;
  onExport: () => void;
  onDownloadCode: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
}) => {
  const status = STATUS_CONFIG[frame.status];
  const StatusIcon = status.icon;

  return (
    <GlassCard className={cn(
      "group p-3 flex items-center gap-4 cursor-pointer transition-colors",
      isSelected 
        ? "bg-purple-500/10 ring-1 ring-purple-500" 
        : "hover:bg-white/5"
    )}>
      {/* Thumbnail */}
      <div
        className="w-16 h-28 bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0"
        id={`frame-preview-${frame._id}`}
        onClick={onClick}
      >
        {frame.status === "done" && frame.htmlContent ? (
          <div className="w-full h-full scale-[0.25] origin-top-left" style={{ width: "400%", height: "400%" }}>
            <AIPreview code={frame.htmlContent} designType="mobile" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className="font-medium text-white">{frame.name}</span>
          <span className="text-xs text-white/30">#{index + 1}</span>
        </div>
        <p className="text-sm text-white/50 mt-1 truncate">{frame.purpose}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {frame.status === "done" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadCode();
              }}
            >
              <Code className="w-4 h-4" />
            </Button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
            {onRegenerate && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </GlassCard>
  );
};

// Full-screen Detail Modal
const FrameDetailModal = ({
  frame,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  onExport,
  onDownloadCode,
  onRegenerate,
}: {
  frame: Frame;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExport: () => void;
  onDownloadCode: () => void;
  onRegenerate?: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Navigation Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={index === 0}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={index === total - 1}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-900/80 rounded-t-2xl border border-white/10 border-b-0">
          <div>
            <h2 className="text-lg font-semibold text-white">{frame.name}</h2>
            <p className="text-sm text-white/50">
              Screen {index + 1} of {total} • {frame.purpose}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {frame.status === "done" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={onExport}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Export PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={onDownloadCode}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Download Code
                </Button>
              </>
            )}
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={onRegenerate}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-zinc-950 rounded-b-2xl border border-white/10 overflow-y-auto flex flex-col items-center justify-start py-8 px-4">
          {frame.status === "done" && frame.htmlContent ? (
            <div className="flex-shrink-0">
              <AIPreview code={frame.htmlContent} designType="mobile" screenName={frame.name} />
            </div>
          ) : frame.status === "generating" ? (
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto" />
              <p className="text-white/60">Generating design...</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <p className="text-white/60">Failed to generate</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DesignCanvas;
