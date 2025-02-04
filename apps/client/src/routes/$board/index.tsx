import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useParams } from '@tanstack/react-router';
import { Icons } from '../../components/icons';
import { StatusBadge } from '../../components/status-badge';
import { VoteButton } from '../../components/vote-button';
import { cn } from '../../lib/utils';
import { applicationBoardsQuery, boardQuery } from '../__root';

export const Route = createFileRoute('/$board/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { board: boardSlug } = useParams({ from: '/$board/' })
    const { data: boards } = useSuspenseQuery(applicationBoardsQuery);
    const { data: board } = useSuspenseQuery(boardQuery(boardSlug));

    const toBoard = (slug: string) => `/${slug}`;

    return (
        <div className='grid grid-cols-[300px_1fr] gap-8'>
            <div className='vertical gap-2'>
                <h1 className='text-xs font-medium uppercase text-gray-500 px-3'>Boards</h1>
                <div className='vertical gap-2'>
                    {boards.map((board) => (
                        <Link
                            key={board.slug}
                            to={toBoard(board.slug)}
                            className='text-sm font-light transition-colors duration-200 text-gray-500 hover:bg-gray-900/5 rounded-lg px-3 py-2 truncate'
                            activeProps={{ className: '!text-gray-800 !bg-gray-900/5' }}
                        >
                            {board.name}
                        </Link>
                    ))}
                </div>
            </div>
            <div className='vertical gap-2'>
                <h1 className='font-medium'>Give Feedback</h1>
                <div className='vertical'>
                    {board.feedbacks.map((feedback, index) => (
                        <Link key={feedback.slug} to={feedback.slug} className={cn('p-4 border border-t-0 grid grid-cols-[1fr_auto] items-start transition-colors duration-200 hover:bg-gray-900/5', {
                            'border-t-1': index === 0
                        })}>
                            <div className='vertical gap-2'>
                                <h2 className='text-sm font-medium'>{feedback.title}</h2>
                                <p className='text-sm text-gray-500'>{feedback.description}</p>
                                <span className='horizontal gap-2 center-v'>
                                    <Icons.MessageSquare size={12} />
                                    <span className='text-xs text-gray-500'>{feedback.activities}</span>
                                    {feedback.status !== 'OPEN' && <>
                                        <span className='text-gray-500 text-xs'>&bull;</span>
                                        <StatusBadge status={feedback.status} />
                                    </>}
                                </span>
                            </div>
                            <VoteButton votes={feedback.votes} />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
