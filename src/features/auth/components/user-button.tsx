"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/src/features/auth/api/use-current-user";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, LogOut } from "lucide-react";
import { useMockAuth } from "@/hooks/use-mock-auth";

export const UserButton = () => {
    // REAL AUTH
    // const { signOut } = useAuthActions();
    // const { data, isLoading } = useCurrentUser();

    // MOCK AUTH
    const { signOut, user: data, isLoading } = useMockAuth();

    if (isLoading) {
        return (
            <div className="size-10 rounded-full flex items-center justify-center bg-muted">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { name, image, email } = data;

    const avatarFallback = name!.charAt(0).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none relative">
                <Avatar className="size-10 hover:opacity-75 transition">
                    <AvatarImage alt={name} src={image} />
                    <AvatarFallback className="bg-sky-500 text-white">
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="right" className="w-60">
                <DropdownMenuItem onClick={() => signOut()} className="h-10">
                    <LogOut className="size-4 mr-2" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
