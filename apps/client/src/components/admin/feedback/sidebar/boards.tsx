import { Route } from "@/routes/admin/feedback"
import { Route as AddminFeedbackSlugRoute } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug"
import { Link, useParams, useRouter, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { cn } from "../../../../lib/utils"
import { useAuthStore } from "../../../../stores/auth-store"
import { Checkbox } from "../../../checkbox"
import { Icons } from "../../../icons"

export function Boards() {
    const search = useSearch({ from: Route.fullPath });
    const router = useRouter();
    const { application } = useAuthStore();

    const boards = useMemo(() => {
        return search.boards ?? application?.boards.map(board => board.slug) ?? [];
    }, [search]);

    const handleChange = (boardSlug: string) => {
        const checked = boards.includes(boardSlug);
        const newBoards = checked ? boards.filter(b => b !== boardSlug) : [...boards, boardSlug];
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: {
                ...search,
                boards: newBoards.length > 0 ? newBoards : undefined
            }
        })
    }

    const handleSelectAll = () => {
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: {
                ...search,
                boards: undefined
            }
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Boards</h1>
            <button onClick={handleSelectAll} className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Select all
            </button>
            {application?.boards.map((board) => (
                <div key={board.id} className="grid grid-cols-[1fr_auto] gap-2 col-span-full group">
                    <Checkbox label={board.name}
                        checked={boards.includes(board.slug)}
                        onChange={() => handleChange(board.slug)}
                    />
                    <BoardActions filter={board.slug} feedbackCount={board._count.feedbacks} />
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
    filter: string;
    feedbackCount: number;
}

function BoardActions({ filter, feedbackCount }: BoardActionsProps) {
    const router = useRouter();
    const { boardSlug, feedbackSlug } = useParams({ strict: false })

    const handleClick = () => {
        if (!boardSlug || !feedbackSlug) return;
        router.navigate({
            to: AddminFeedbackSlugRoute.fullPath,
            params: { boardSlug, feedbackSlug },
            search: { boards: [filter] }
        })
    }

    return (
        <span className="relative h-5">
            <p className="h-5 min-w-5 px-1 ml-auto border rounded-md horizontal center text-xs font-light group-hover:hidden text-gray-500 dark:text-zinc-300">
                {feedbackCount}
            </p>
            <button className="cursor-pointer size-5 p-0 hidden group-hover:flex items-center justify-center">
                <Icons.Settings className="size-4 stroke-gray-500 dark:stroke-zinc-300" />
            </button>

            <button onClick={handleClick} className="cursor-pointer size-4 border rounded-sm absolute top-1/2 -left-6 -translate-y-1/2 text-xs font-light horizontal center hidden group-hover:flex text-gray-500 dark:text-zinc-300">1</button>
        </span>
    )
}