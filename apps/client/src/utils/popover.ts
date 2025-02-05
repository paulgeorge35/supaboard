export function initializePopovers(): void {
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const trigger = target.closest('[data-popover-trigger]');
        const anyPopover = document.querySelector('[data-popover][data-show]');
        
        // Close any open popover when clicking outside
        if (!trigger && anyPopover) {
            closePopover(anyPopover as HTMLElement);
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
}

function openPopover(popover: HTMLElement): void {
    popover.classList.remove('hidden');
    popover.setAttribute('data-show', '');
    const trigger = popover.previousElementSibling;
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }
}

function closePopover(popover: HTMLElement): void {
    popover.classList.add('hidden');
    popover.removeAttribute('data-show');
    const trigger = popover.previousElementSibling;
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
} 