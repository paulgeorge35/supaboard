import { type ReactNode } from 'react';
import {
  Dialog,
  Modal,
  ModalOverlay,
  type DialogProps,
  type ModalOverlayProps,
} from 'react-aria-components';

interface ModalComponentProps extends Omit<DialogProps, 'children'> {
  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;
  /**
   * Callback fired when the modal should close
   */
  onClose: () => void;
  /**
   * The content to render inside the modal
   */
  children: ReactNode;
  /**
   * Optional class name for the modal container
   */
  className?: string;
  /**
   * Optional props to pass to the modal overlay
   */
  overlayProps?: Partial<ModalOverlayProps>;
}

/**
 * A reusable modal component that handles accessibility and keyboard interactions.
 * Built using react-aria-components for robust accessibility support.
 */
export function ModalComponent({
  isOpen,
  onClose,
  children,
  className,
  overlayProps,
  ...dialogProps
}: ModalComponentProps) {
  return (
    <Modal isOpen={isOpen} shouldCloseOnInteractOutside={() => true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ModalOverlay
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        isDismissable
        {...overlayProps}
      >
        <Dialog
          className={`bg-white dark:bg-zinc-900 border rounded-lg shadow-xl p-6 outline-none relative max-w-md w-full mx-4 ${
            className ?? ''
          }`}
          {...dialogProps}
        >
          {isOpen ? children : null}
        </Dialog>
      </ModalOverlay>
    </Modal>
  );
}