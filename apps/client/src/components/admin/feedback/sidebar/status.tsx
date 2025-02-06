import { FeedbackStatusConfig } from "../../../../lib/utils"
import { Checkbox } from "../../../checkbox"

type StatusProps = {
}

export function Status({ }: StatusProps) {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Status</h1>
            <button className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Reset
            </button>
            {Object.entries(FeedbackStatusConfig).map(([status, config]) => (
                <div key={status} className="grid grid-cols-[auto_1fr_auto] gap-2 group col-span-full">
                    <Checkbox label={config.label} wrapperClassName="col-span-2" />
                    <button className="cursor-pointer size-4 border rounded-sm text-xs font-light horizontal hidden center group-hover:flex text-gray-500 dark:text-zinc-300">1</button>
                </div>
            ))}
        </div>
    )
}