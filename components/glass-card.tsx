import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = ({ children, className, hoverEffect = false, ...props }: GlassCardProps) => {
    return (
        <div
            className={cn(
                "glass rounded-xl p-6",
                hoverEffect && "glass-hover",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
