import { RadioGroup } from "../../../radio-group"

type OwnerProps = {
}

export function Owner({ }: OwnerProps) {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Owner</h1>
            <button className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Search
            </button>
            <RadioGroup
                value="all"
                name="owner"
                options={[
                    { label: 'All', value: 'all' },
                    { label: 'No owner', value: 'no-owner' },
                    { label: 'Me', value: 'me' },
                ]}
            />
        </div>
    )
}