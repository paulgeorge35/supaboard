import { Link } from "@tanstack/react-router"
import { cn } from "../../../../lib/utils"
import { useAuthStore } from "../../../../stores/auth-store"
import { Checkbox } from "../../../checkbox"
import { Icons } from "../../../icons"
type BoardsProps = {

}

export function Boards() {
    const { application } = useAuthStore()
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Boards</h1>
            <button className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Select all
            </button>
            {application?.boards.map((board) => (
                <div key={board.id} className="grid grid-cols-[1fr_auto] gap-2 col-span-full group">
                    <Checkbox label={board.name} />
                    <BoardActions boardSlug={board.slug} feedbackCount={8} />
                </div>
            ))}
            <Link
                to="/admin"
                className={cn("horizontal center-v gap-1 text-sm font-light col-span-full",
                    "text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200",
                    "[&_svg]:size-5 [&_svg]:stroke-gray-500 dark:[&_svg]:stroke-zinc-300 hover:[&_svg]:stroke-gray-700 dark:hover:[&_svg]:stroke-zinc-200 [&_svg]:-translate-x-[2px]"
                )}>
                <Icons.Plus />Create board
            </Link>
        </div >
    )
}

type BoardActionsProps = {
    boardSlug: string;
    feedbackCount: number;
}

function BoardActions({ feedbackCount }: BoardActionsProps) {
    return (
        <span className="relative h-5">
            <p className="h-5 min-w-5 px-1 ml-auto border rounded-md horizontal center text-xs font-light group-hover:hidden text-gray-500 dark:text-zinc-300">
                {feedbackCount}
            </p>
            <Link to="/admin">
                <button className="cursor-pointer size-5 p-0 hidden group-hover:flex items-center justify-center">
                    <Icons.Settings className="size-4 stroke-gray-500 dark:stroke-zinc-300" />
                </button>
            </Link>
            <button className="cursor-pointer size-4 border rounded-sm absolute top-1/2 -left-6 -translate-y-1/2 text-xs font-light horizontal center hidden group-hover:flex text-gray-500 dark:text-zinc-300">1</button>
        </span>
    )
}