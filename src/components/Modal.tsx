import { X } from 'lucide-react'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ title, description, children, onClose }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const backdrop = backdropRef.current
    const visualViewport = window.visualViewport
    const scrollPosition = window.scrollY
    let focusFrame = 0
    const originalBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      right: document.body.style.right,
      left: document.body.style.left,
      overflow: document.body.style.overflow,
    }

    function keepFocusedFieldVisible() {
      const content = contentRef.current
      const activeElement = document.activeElement
      if (!content || !(activeElement instanceof HTMLElement) || !content.contains(activeElement)) return

      const contentBounds = content.getBoundingClientRect()
      const fieldBounds = activeElement.getBoundingClientRect()
      const margin = 12

      if (fieldBounds.bottom > contentBounds.bottom - margin) {
        content.scrollBy({
          top: fieldBounds.bottom - contentBounds.bottom + margin,
          behavior: 'smooth',
        })
      } else if (fieldBounds.top < contentBounds.top + margin) {
        content.scrollBy({
          top: fieldBounds.top - contentBounds.top - margin,
          behavior: 'smooth',
        })
      }
    }

    function scheduleFocusedFieldVisibility() {
      window.cancelAnimationFrame(focusFrame)
      focusFrame = window.requestAnimationFrame(() => {
        focusFrame = window.requestAnimationFrame(keepFocusedFieldVisible)
      })
    }

    function syncViewport() {
      if (!backdrop) return
      const viewportHeight = visualViewport?.height ?? window.innerHeight
      const viewportTop = visualViewport?.offsetTop ?? 0
      const keyboardOpen = viewportHeight < window.innerHeight - 120

      backdrop.style.setProperty('--modal-viewport-height', `${Math.round(viewportHeight)}px`)
      backdrop.style.setProperty('--modal-viewport-top', `${Math.round(viewportTop)}px`)
      backdrop.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false'
      scheduleFocusedFieldVisibility()
    }

    document.body.classList.add('modal-open')
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollPosition}px`
    document.body.style.right = '0'
    document.body.style.left = '0'
    document.body.style.overflow = 'hidden'
    syncViewport()
    dialogRef.current?.focus({ preventScroll: true })

    visualViewport?.addEventListener('resize', syncViewport)
    visualViewport?.addEventListener('scroll', syncViewport)
    window.addEventListener('resize', syncViewport)
    backdrop?.addEventListener('focusin', scheduleFocusedFieldVisibility)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      visualViewport?.removeEventListener('resize', syncViewport)
      visualViewport?.removeEventListener('scroll', syncViewport)
      window.removeEventListener('resize', syncViewport)
      backdrop?.removeEventListener('focusin', scheduleFocusedFieldVisibility)
      document.body.classList.remove('modal-open')
      document.body.style.position = originalBodyStyles.position
      document.body.style.top = originalBodyStyles.top
      document.body.style.right = originalBodyStyles.right
      document.body.style.left = originalBodyStyles.left
      document.body.style.overflow = originalBodyStyles.overflow
      window.scrollTo({ top: scrollPosition, behavior: 'instant' })
    }
  }, [])

  return createPortal(
    <div
      ref={backdropRef}
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={21} />
          </button>
        </header>
        <div ref={contentRef} className="modal-content">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
