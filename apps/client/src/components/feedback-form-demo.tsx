import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface FeedbackFormDemoProps {
    callToAction: string;
    title: string;
    details: string;
    buttonText: string;
}

export function FeedbackFormDemo({ callToAction, title, details, buttonText }: FeedbackFormDemoProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <span className={cn('border !col-span-full !w-full p-8 rounded-lg')}>
            <div className="vertical gap-2">
                <h1 className="font-medium">{callToAction}</h1>
                <div className="vertical">
                    <motion.div
                        className="border rounded-lg overflow-hidden"
                        animate={{ height: isExpanded ? "auto" : "60px" }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className='p-4 vertical gap-2'>
                            <input
                                type="text"
                                placeholder={title}
                                className='w-full focus:outline-none'
                                onFocus={() => setIsExpanded(true)}
                            />

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <p className='text-sm font-medium'>Details</p>
                                        <textarea
                                            placeholder={details}
                                            className='w-full md:text-sm focus:outline-none'
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className='border-t horizontal center-v justify-end gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-800/20'
                                >
                                    <button
                                        type='button'
                                        onClick={() => setIsExpanded(false)}
                                        className='button button-secondary !text-[var(--user-color-primary)] !border-[var(--user-color-primary)]'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='button'
                                        className='button button-primary !bg-[var(--user-color-primary)]'
                                    >
                                        {buttonText}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </span>
    );
}