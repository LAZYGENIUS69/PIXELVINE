import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface GenerateButtonProps {
    projectId: string;
    onClick?: () => void;
    isRunning?: boolean;
}

export const GenerateButton = ({ projectId, onClick, isRunning }: GenerateButtonProps) => {
    return (
        <Button
            className="gap-2 shadow-lg disabled:opacity-50"
            onClick={onClick}
            disabled={isRunning}
        >
            {isRunning ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                </>
            )}
        </Button>
    );
};
