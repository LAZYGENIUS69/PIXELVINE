
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GlassCard } from "@/components/glass-card";
import { Folder } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface SortableProjectCardProps {
    project: Doc<"projects">;
}

export const SortableProjectCard = ({ project }: SortableProjectCardProps) => {
    const router = useRouter();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: project._id });

    // Use CSS.Translate.toString(transform) for better GPU acceleration
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <GlassCard
                hoverEffect
                className="p-4 flex flex-col gap-4 cursor-pointer h-full"
                onClick={() => {
                    // Prevent navigation if we were dragging
                    if (!isDragging) {
                        router.push(`/project/${project._id}`);
                    }
                }}
            >
                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    {project.renderUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={project.renderUrl}
                            alt={project.name}
                            className="h-full w-full object-cover pointer-events-none" // prevent image drag
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/30">
                            <Folder className="size-10" />
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white/90 truncate">{project.name}</h2>
                    <p className="text-xs text-white/40">Last modified: {new Date(project.lastModified).toLocaleDateString()}</p>
                </div>
            </GlassCard>
        </div>
    );
};
