import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useToast } from "./use-toast";

export const usePasteImage = (projectId: string) => {
    const { toast } = useToast();
    const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
    const addToMoodboard = useMutation(api.moodBoards.add);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf("image") !== -1) {
                    const blob = item.getAsFile();
                    if (!blob) continue;

                    e.preventDefault(); // Prevent default paste behavior (e.g., pasting into text inputs)

                    // Allow pasting into inputs if focused?
                    // Usually we want global paste to work unless an input expects text.
                    // But if it's an image, inputs won't accept it anyway usually.
                    // Let's block default to avoid double-handling if any.

                    setIsUploading(true);
                    const toastId = toast({
                        title: "Uploading Image...",
                        description: "Adding to Inspiration Board",
                    });

                    try {
                        // 1. Get URL
                        const postUrl = await generateUploadUrl();

                        // 2. Upload
                        const result = await fetch(postUrl, {
                            method: "POST",
                            headers: { "Content-Type": blob.type },
                            body: blob,
                        });

                        if (!result.ok) throw new Error(`Upload failed: ${result.statusText}`);

                        const { storageId } = await result.json();

                        // 3. Add to Moodboard
                        await addToMoodboard({
                            projectId: projectId as any,
                            storageId,
                            x: 0, // Default position, maybe randomize or center?
                            y: 0,
                        });

                        toast({
                            title: "Image Uploaded",
                            description: "Added to Inspiration Board",
                            variant: "default" // success
                        });

                    } catch (error) {
                        console.error("Paste Upload Failed:", error);
                        toast({
                            title: "Upload Failed",
                            description: "Could not upload image.",
                            variant: "destructive",
                        });
                    } finally {
                        setIsUploading(false);
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [projectId, generateUploadUrl, addToMoodboard, toast]);

    return { isUploading };
};
