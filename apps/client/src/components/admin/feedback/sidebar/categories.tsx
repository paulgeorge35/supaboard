import { Link } from "@tanstack/react-router"
import { Checkbox } from "../../../checkbox"
import { Icons } from "../../../icons"

type CategoriesProps = {
}

export function Categories({ }: CategoriesProps) {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Categories</h1>
            <Link to="/admin" className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                <Icons.Settings className="size-4 stroke-gray-500 dark:stroke-zinc-300 hover:stroke-gray-700 dark:hover:stroke-zinc-200" />
            </Link>
            <Checkbox label="Uncategorized only" wrapperClassName="col-span-full" />
            <input type="text" placeholder="Search..." className="w-full col-span-full focus:outline-none border rounded-md p-2 text-base md:text-sm" />
        </div>
    )
}