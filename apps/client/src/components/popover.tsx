import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { forwardRef, type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface PopoverProps {
  id: string
  trigger: ReactNode
  content: ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
  triggerClassName?: string
  onOpenChange?: (isOpen: boolean) => void
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  ({ id, trigger, content, className = '', align = 'end', triggerClassName = '', onOpenChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
    const [contentWidth, setContentWidth] = useState<number>(0)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        
        // Check if clicked element has data-popover-close
        if (target.hasAttribute('data-popover-close')) {
          setIsOpen(false)
          triggerRef.current?.setAttribute('aria-expanded', 'false')
          onOpenChange?.(false)
          return
        }

        if (
          (!containerRef.current?.contains(target)) && 
          (!triggerRef.current?.contains(target)) && 
          (!contentRef.current?.contains(target))
        ) {
          setIsOpen(false)
          triggerRef.current?.setAttribute('aria-expanded', 'false')
        }
      }

      if (isOpen) {
        setTimeout(() => {
          document.addEventListener('click', handleClickOutside)
        }, 0)
        return () => document.removeEventListener('click', handleClickOutside)
      }
    }, [isOpen, onOpenChange])

    useEffect(() => {
      if (isOpen && contentRef.current) {
        setContentWidth(contentRef.current.offsetWidth)
      }
    }, [isOpen])

    const handleTriggerClick = (event: React.MouseEvent) => {
      event.stopPropagation()
      // Update trigger position
      if (triggerRef.current) {
        setTriggerRect(triggerRef.current.getBoundingClientRect())
      }
      document.querySelectorAll('[data-popover]').forEach((popover) => {
        if (popover.getAttribute('data-popover-id') !== id) {
          popover.classList.add('hidden')
          popover.removeAttribute('data-show')
          const trigger = popover.previousElementSibling as HTMLElement
          trigger?.setAttribute('aria-expanded', 'false')
        }
      })
      const newIsOpen = !isOpen
      setIsOpen(newIsOpen)
      onOpenChange?.(newIsOpen)
      triggerRef.current?.setAttribute('aria-expanded', newIsOpen.toString())
    }

    // Add this effect to sync state when closed externally
    useEffect(() => {
      const handlePopoverMutation = (mutations: MutationRecord[]) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-show') {
            const hasShow = (mutation.target as HTMLElement).hasAttribute('data-show')
            if (!hasShow && isOpen) {
              setIsOpen(false)
              onOpenChange?.(false)
            }
          }
        }
      }

      const observer = new MutationObserver(handlePopoverMutation)
      if (contentRef.current) {
        observer.observe(contentRef.current, { attributes: true })
      }

      return () => observer.disconnect()
    }, [isOpen, onOpenChange])

    const getPopoverPosition = () => {
      if (!triggerRect) return {}

      const left = align === 'end' 
        ? triggerRect.right - contentWidth
        : align === 'center' 
          ? triggerRect.left + (triggerRect.width / 2) - (contentWidth / 2)
          : triggerRect.left

      return {
        top: triggerRect.bottom + 8,
        left: Math.max(16, Math.min(left, window.innerWidth - contentWidth - 16)) // Prevent overflow
      }
    }

    return (
      <>
        <div className={cn("relative", className)} ref={containerRef}>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded="false"
            aria-haspopup="true"
            onClick={handleTriggerClick}
            className={triggerClassName}
            data-popover-trigger-id={id}
          >
            {trigger}
          </button>
        </div>

        {triggerRect && createPortal(
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                ref={(node) => {
                  if (ref) {
                    if (typeof ref === 'function') {
                      ref(node)
                    } else {
                      ref.current = node
                    }
                  }
                  contentRef.current = node
                }}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={"fixed rounded-md bg-white dark:bg-zinc-900 shadow-md border dark:border-zinc-800 ring-opacity-5 z-[9999]"}
                role="menu"
                style={{ 
                  originY: 0,
                  transformOrigin: align === 'end' ? 'top right' : 'top left',
                  ...getPopoverPosition()
                }}
                data-popover
                data-popover-id={id}
                data-show={isOpen}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    )
  }
)

Popover.displayName = 'Popover' 