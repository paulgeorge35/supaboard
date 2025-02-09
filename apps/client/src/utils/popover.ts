export function getPopover(id?: string): HTMLElement | null {
    if (id) {
        return document.querySelector(`[data-popover][data-popover-id="${id}"][data-show]`);
    }
    return document.querySelector('[data-popover][data-show]');
}

export function closePopover(popover: HTMLElement): void {
    popover.classList.add('hidden');
    popover.removeAttribute('data-show');
    const trigger = popover.previousElementSibling;
    
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
}

export function openPopover(popover: HTMLElement): void {
    const popoverId = popover.getAttribute('data-popover-id');

    // Close other popovers first
    document.querySelectorAll('[data-popover][data-show]').forEach((otherPopover) => {
        if (otherPopover.getAttribute('data-popover-id') !== popoverId) {
            closePopover(otherPopover as HTMLElement);
        }
    });

    popover.classList.remove('hidden');
    popover.setAttribute('data-show', '');
    const trigger = popover.previousElementSibling;
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }
}

export function initializePopovers(): void {
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const trigger = target.closest('[data-popover-trigger]');
        const closeButton = target.closest('[data-popover-close]');
        
        // Handle close button clicks
        if (closeButton) {
            const popover = closeButton.closest('[data-popover]');
            if (popover) {
                closePopover(popover as HTMLElement);
                return;
            }
        }

        // Close any open popover when clicking outside
        const openPopovers = document.querySelectorAll('[data-popover][data-show]');
        if (!trigger && openPopovers.length > 0 && (event.target as HTMLElement).closest('[data-popover]') === null) {
            openPopovers.forEach(popover => closePopover(popover as HTMLElement));
            return;
        }
        
        // Toggle popover when clicking trigger
        if (trigger) {
            const popover = trigger.nextElementSibling?.matches('[data-popover]') 
                ? trigger.nextElementSibling as HTMLElement 
                : null;
                
            if (popover) {
                if (popover.hasAttribute('data-show')) {
                    closePopover(popover);
                } else {
                    openPopover(popover);
                }
            }
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const openPopovers = document.querySelectorAll('[data-popover][data-show]');
            openPopovers.forEach(popover => closePopover(popover as HTMLElement));
        }
    });
} 