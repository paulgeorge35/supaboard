export function initializeModals(): void {
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const trigger = target.closest('[data-modal-trigger]');
        const closeButton = target.closest('[data-modal-close]');
        const anyModal = document.querySelector('[data-modal][data-show]');
        
        // Handle close button clicks
        if (closeButton) {
            const modal = closeButton.closest('[data-modal]');
            if (modal) {
                closeModal(modal as HTMLElement);
                return;
            }
        }

        // Close any open modal when clicking outside
        if (!trigger && anyModal && (event.target as HTMLElement).closest('[data-modal]') === null) {
            closeModal(anyModal as HTMLElement);
            return;
        }
        
        // Toggle modal when clicking trigger
        if (trigger) {
            const modal = trigger.nextElementSibling?.matches('[data-modal]') 
                ? trigger.nextElementSibling as HTMLElement 
                : null;
                
            if (modal) {
                if (modal.hasAttribute('data-show')) {
                    closeModal(modal);
                } else {
                    openModal(modal);
                }
            }
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modal = document.querySelector('[data-modal][data-show]');
            if (modal) {
                closeModal(modal as HTMLElement);
            }
        }
    });
}

function openModal(modal: HTMLElement): void {
    modal.classList.remove('hidden');
    modal.setAttribute('data-show', '');
    const trigger = modal.previousElementSibling;
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeModal(modal: HTMLElement): void {
    modal.classList.add('hidden');
    modal.removeAttribute('data-show');
    const trigger = modal.previousElementSibling;
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
    // Restore body scroll
    document.body.style.overflow = '';
} 