import Link from "next/link"

export const LogoIcon = () => {
    return (
        <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <div className="h-4 w-4 rounded-full bg-current" />
            </div>
            <span className="text-lg font-bold">Tailark</span>
        </div>
    )
}
