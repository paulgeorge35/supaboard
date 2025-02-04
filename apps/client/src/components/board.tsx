import { Link } from "@tanstack/react-router";

type BoardProps = {
    title: string;
    items: number;
    to: string;
}

export const Board = ({ title, items, to }: BoardProps) => {
    return (
        <Link to={to} className='w-full border rounded-lg horizontal center-v justify-between p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 cursor-pointer'>
            <p className='text-sm font-medium'>{title}</p>
            <p className='text-xs font-medium text-gray-500'>{items}</p>
        </Link>
    )
}