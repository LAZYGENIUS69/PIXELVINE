import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
    onSetTool: (tool: string) => void;
    onGenerate: () => void;
    onTogglePreview: () => void;
    onUndo: () => void;
    onRedo: () => void;
}

export const useKeyboardShortcuts = ({
    onSetTool,
    onGenerate,
    onTogglePreview,
    onUndo,
    onRedo
}: UseKeyboardShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            const key = e.key.toLowerCase();
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd) {
                if (key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        onRedo();
                    } else {
                        onUndo();
                    }
                    return;
                }
                if (key === 'y') {
                    e.preventDefault();
                    onRedo();
                    return;
                }
            }

            switch (key) {
                case "v":
                    onSetTool("select");
                    break;
                case "h":
                    onSetTool("hand");
                    break;
                case "r":
                    onSetTool("rect");
                    break;
                case "o":
                    onSetTool("circle");
                    break;
                case "a":
                    onSetTool("arrow");
                    break;
                case "p":
                    onSetTool("pen");
                    break;
                case "t":
                    onSetTool("text");
                    break;
                case "e":
                    onSetTool("eraser");
                    break;
                case "f":
                    onSetTool("frame");
                    break;
                // Magic Wand (G) -> Triggers AI Design Generation
                case "g":
                    e.preventDefault();
                    onGenerate();
                    break;
                // Line (L)
                case "l":
                    onSetTool("line");
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onSetTool, onGenerate, onTogglePreview, onUndo, onRedo]);
};
