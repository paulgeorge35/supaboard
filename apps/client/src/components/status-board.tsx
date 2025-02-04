import type { Board, Feedback } from "@repo/database";
import { Link } from "@tanstack/react-router";
import { cn } from "../lib/utils";
import { Dot } from "./dot";
import { Icons } from "./icons";
import { VoteButton } from "./vote-button";

interface StatusBoardProps {
    title: string;
    color: string;
    items: (Pick<Feedback, 'title' | 'status' | 'slug'> & {
        votes: number
        board: Pick<Board, 'name' | 'slug'>
    })[]
}
export const StatusBoard = ({ title, color, items }: StatusBoardProps) => {
    return (
        <div className='w-full border rounded-lg h-[400px] vertical'>
            <div className='w-full h-[50px] border-b bg-gray-50 rounded-t-lg horizontal center-v px-4 shrink-0'>
                <span className='text-sm font-medium horizontal center-v gap-2'><Dot className={cn('bg-blue-500', color)} />{title}</span>
            </div>
            <div className='flex-1 w-full p-4 vertical gap-4 overflow-y-auto'>
                {items.length === 0 && (
                    <div className='w-full h-full vertical center gap-2'>
                        <Icons.TicketX className='size-12 rounded-full p-3 bg-green-500/10 stroke-green-500' />
                        <p className='text-sm font-light text-gray-500'>No feedback reached this status</p>
                    </div>
                )}
                {items.map((item) => {
                    const to = `/${item.board.slug}/${item.slug}`
                    return (
                        <div key={`${item.board.slug}-${item.slug}`} className='w-full grid grid-cols-[auto_1fr] gap-4 text-sm horizontal items-start'>
                            <VoteButton votes={item.votes} />
                            <Link to={to} className="vertical gap-1 group cursor-pointer">
                                <p className='font-medium group-hover:text-blue-500 transition-colors duration-200'>{item.title}</p>
                                <p className='text-xs font-medium uppercase text-gray-500'>{item.board.name}</p>
                            </Link>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}