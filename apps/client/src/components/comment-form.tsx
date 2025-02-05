import { useFocus } from '@paulgeorge35/hooks';
import { cn } from '../lib/utils';

type CommentFormProps = {
    onSubmit: (content: string) => void;
    isPending: boolean;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const CommentForm = ({ onSubmit, isPending, value, onChange, className }: CommentFormProps) => {
    const [ref, isFocused] = useFocus<HTMLInputElement>()
    return (
        <div className={cn('flex-1 border', className)}>
            <div className='p-2'>
                <input
                    ref={ref}
                    type="text"
                    placeholder="Add a comment"
                    className='w-full focus:outline-none md:text-sm'
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSubmit(value);
                        }
                    }}
                />
            </div>
            <div className={cn('p-2 border-t hidden horizontal gap-2 justify-end bg-gray-50 dark:bg-zinc-800/20', {
                'flex': isFocused
            })}>
                <button
                    className='button button-primary'
                    onClick={() => onSubmit(value)}
                    disabled={isPending}
                >
                    {isPending ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    )
}