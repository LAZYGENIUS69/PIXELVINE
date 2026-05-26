"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { AnimatedGrid } from "@/components/react-bits/AnimatedGrid";
import Spotlight from "@/components/react-bits/Spotlight";
import { SplitText } from "@/components/react-bits/SplitText";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from "react";
import { Plus, Folder, MoreVertical, Calendar } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface Project {
    _id: Id<"projects">;
    name: string;
    lastModified: number;
    userId: Id<"users">;
}

// Sortable Project Card Item
function SortableProjectItem({ project, onClick }: { project: Project, onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: project._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
            <Spotlight className="group relative h-48 w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <div className="flex h-full flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 group-hover:text-indigo-300">
                            <Folder className="h-6 w-6" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-200">{project.name}</h3>
                        <div className="mt-2 flex items-center text-xs text-zinc-500">
                            <Calendar className="mr-1.5 h-3 w-3" />
                            <span>Last edited {new Date(project.lastModified).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </Spotlight>
        </div>
    );
}

export default function DashboardPage() {
    const convexProjects = useQuery(api.projects.getRecent);
    const createProject = useMutation(api.projects.create);
    const router = useRouter();

    // Local state for dnd sorting (optimistic UI)
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        if (convexProjects) {
            setProjects(convexProjects);
        }
    }, [convexProjects]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Requires 5px movement to start drag (allows clicking)
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setProjects((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateProject = async () => {
        setIsCreating(true);
        try {
            // Generate unique name with timestamp to ensure each project is distinct
            const uniqueName = `Untitled Generation ${new Date().getTime()}`;
            const id = await createProject({ name: uniqueName });
            
            // Force full page navigation to ensure fresh project load
            // This prevents any caching issues that might redirect to an existing project
            window.location.href = `/project/${id}`;
        } catch (error) {
            console.error("Failed to create project:", error);
            setIsCreating(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
            <AnimatedGrid />

            <main className="relative z-10 container mx-auto px-4 pt-32 pb-12">
                <div className="mb-12 flex items-end justify-between">
                    <div>
                        <h2 className="text-sm font-medium text-indigo-400 uppercase tracking-wider mb-2">Workspace</h2>
                        <SplitText text="My Projects" className="text-4xl font-bold text-white md:text-5xl" />
                    </div>
                    <Button
                        onClick={handleCreateProject}
                        disabled={isCreating}
                        className="rounded-full bg-white px-6 text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent mr-2" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        {isCreating ? "Creating..." : "New Project"}
                    </Button>
                </div>

                {/* Dashboard Grid */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={projects.map(p => p._id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {projects === undefined ? (
                                // Loading Skeletons
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-48 rounded-xl border border-white/5 bg-white/5 animate-pulse" />
                                ))
                            ) : projects.length === 0 ? (
                                // Empty State
                                <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <Folder className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
                                    <h3 className="text-lg font-medium text-white">No projects yet</h3>
                                    <p className="text-zinc-400 mt-1 mb-6">Create your first AI generation to get started</p>
                                    <Button
                                        onClick={handleCreateProject}
                                        disabled={isCreating}
                                        variant="outline"
                                        className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                                    >
                                        {isCreating ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                        ) : null}
                                        {isCreating ? "Creating..." : "Create Project"}
                                    </Button>
                                </div>
                            ) : (
                                projects.map((project) => (
                                    <SortableProjectItem
                                        key={project._id}
                                        project={project}
                                        onClick={() => router.push(`/project/${project._id}`)}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </main>
        </div>
    );
}
