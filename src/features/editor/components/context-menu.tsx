import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ArrowUpFromLine, ArrowDownFromLine } from "lucide-react";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    onClose,
    onDuplicate,
    onDelete,
    onBringToFront,
    onSendToBack
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl z-[100] min-w-[180px] py-1 flex flex-col"
            style={{ top: y, left: x }}
        >
            <button
                onClick={onDuplicate}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-200 hover:bg-white/10 text-left transition-colors"
            >
                <Copy size={14} />
                Duplicate <span className="ml-auto text-xs text-gray-500">Ctrl+D</span>
            </button>
            <button
                onClick={onBringToFront}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-200 hover:bg-white/10 text-left transition-colors"
            >
                <ArrowUpFromLine size={14} />
                Bring to Front <span className="ml-auto text-xs text-gray-500">]</span>
            </button>
            <button
                onClick={onSendToBack}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-200 hover:bg-white/10 text-left transition-colors"
            >
                <ArrowDownFromLine size={14} />
                Send to Back <span className="ml-auto text-xs text-gray-500">[</span>
            </button>
            <div className="h-px bg-white/10 my-1" />
            <button
                onClick={onDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 text-left transition-colors"
            >
                <Trash2 size={14} />
                Delete <span className="ml-auto text-xs text-gray-500">Del</span>
            </button>
        </div>
    );
};
