"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Loader2, Folder } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Doc } from "../../../../convex/_generated/dataModel";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableProjectCard } from "./sortable-project-card";

interface DashboardProps {
    projects: Doc<"projects">[];
}

export const Dashboard = ({ projects }: DashboardProps) => {
    const router = useRouter();
    const createProject = useMutation(api.projects.create);
    const updateOrder = useMutation(api.projects.updateProjectsOrder);
    const [isCreating, setIsCreating] = useState(false);

    // Manage local state for immediate UI feedback
    const [scrolledProjects, setScrolledProjects] = useState(projects);

    useEffect(() => {
        setScrolledProjects(projects);
    }, [projects]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            const id = await createProject({ name: "Untitled Project" });
            router.push(`/project/${id}`);
        } catch (error) {
            console.error(error);
            setIsCreating(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setScrolledProjects((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Trigger mutation with new order
                const updates = newItems.map((item, index) => ({
                    id: item._id,
                    order: index,
                }));

                updateOrder({ updates }).catch(console.error);

                return newItems;
            });
        }
    };

    return (
        <div className="h-full w-full p-6 md:p-10 space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        VisionSync Dashboard
                    </h1>
                    <p className="text-white/50 text-sm">
                        Manage your AI-powered design projects in one place.
                    </p>
                </div>

                <Button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="h-11 px-5 bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-medium flex items-center justify-center gap-2 group"
                >
                    {isCreating ? (
                        <Loader2 className="animate-spin size-5" />
                    ) : (
                        <>
                            New Project
                            <ArrowRight className="size-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={scrolledProjects.map(p => p._id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scrolledProjects.map((project) => (
                            <SortableProjectCard key={project._id} project={project} />
                        ))}

                        <GlassCard
                            hoverEffect
                            className="p-4 flex flex-col gap-4 items-center justify-center text-center cursor-pointer border border-dashed border-white/20 min-h-[250px]"
                            onClick={handleCreate}
                        >
                            <div className="size-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <Plus className="size-5 text-white/50" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/80">Create New Project</p>
                                <p className="text-xs text-white/40">Start from a blank canvas</p>
                            </div>
                        </GlassCard>
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
