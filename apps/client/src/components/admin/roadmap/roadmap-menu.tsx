import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";

type RoadmapMenuProps = {
    disabled?: boolean;
    onRename?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
}

export function RoadmapMenu({ disabled, onRename, onDuplicate, onDelete }: RoadmapMenuProps) {
    return (

        <MenuTrigger>
            <Button
                aria-label="Menu"
                className={cn('horizontal center rounded-md h-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-100 hidden md:flex', {
                    'opacity-50 pointer-events-none': disabled
                })}
            >
                <Icons.MoreHorizontal className='size-4 shrink-0' />
            </Button>
            <Popover className='bg-white border text-zinc-900 rounded-md shadow-md dark:bg-zinc-900 dark:text-white'>
                <Menu>
                    <MenuItem onAction={onRename} className='truncate text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 transition-colors duration-100 w-full'>Rename</MenuItem>
                    <MenuItem onAction={onDuplicate} className='truncate text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 transition-colors duration-100 w-full'>Duplicate</MenuItem>
                    {onDelete && <MenuItem onAction={onDelete} className='truncate text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 transition-colors duration-100 w-full'>Delete</MenuItem>}
                </Menu>
            </Popover>
        </MenuTrigger>
    )
}