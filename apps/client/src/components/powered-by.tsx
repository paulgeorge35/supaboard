import { cn } from "@/lib/utils";

export function PoweredBy({ className }: { className?: string }) {
    return (
        <a href="https://supaboard.io" target="_blank" rel="noopener noreferrer" className={cn("text-xs font-extralight text-gray-400", className)}>
            Powered by SupaBoard
        </a>
    )
}