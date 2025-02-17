import { type ReactNode } from 'react'
import { Icons } from './icons'

interface ModalProps {
    trigger?: ReactNode
    title?: string
    children?: ReactNode
    footer?: ReactNode
    className?: string
    contentClassName?: string
    triggerClassName?: string
    dismissable?: boolean
}

export function Modal({
    trigger,
    title,
    children,
    footer,
    className = '',
    contentClassName = '',
    triggerClassName = '',
    dismissable = true
}: ModalProps) {
    return (
        <>
            {/* Trigger Button */}
            {trigger && <button
                type="button"
                data-modal-trigger
                aria-expanded="false"
                aria-haspopup="dialog"
                className={triggerClassName}
            >
                {trigger}
            </button>}

            {/* Modal Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 hidden ${className} z-40`}
                data-modal
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                    // Close modal when clicking backdrop
                    if (e.target === e.currentTarget && dismissable) {
                        closeModal(e.currentTarget as HTMLElement);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape' && dismissable) {
                        closeModal(e.currentTarget as HTMLElement);
                    }
                }}
            >
                {/* Modal Content */}
                <div
                    className={`relative top-1/2 -translate-y-1/2 mx-auto max-w-lg w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-lg ${contentClassName} z-50`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    {title && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <h2 className="text-lg font-medium">{title}</h2>
                            {dismissable && <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500"
                                onClick={() => {
                                    const modal = document.querySelector('[data-modal][data-show]');
                                    if (modal) {
                                        closeModal(modal as HTMLElement);
                                    }
                                }}
                            >
                                <Icons.X className="size-4" />
                            </button>}
                        </div>
                    )}

                    {/* Body */}
                    {children && <div className="px-4 py-3 font-light text-sm">
                        {children}
                    </div>}

                    {/* Footer */}
                    {footer && (
                        <div className="px-4 py-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export function getModal(): HTMLElement | null {
    return document.querySelector('[data-modal][data-show]') as HTMLElement | null;
}

// Helper function to close modal
export function closeModal(modal: HTMLElement): void {
    modal.classList.add('hidden');
    modal.removeAttribute('data-show');
    const trigger = modal.previousElementSibling;
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
} 