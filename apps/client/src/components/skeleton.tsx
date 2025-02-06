import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-zinc-200/50 dark:bg-zinc-800/50", className)}
      {...props}
    />
  )
}