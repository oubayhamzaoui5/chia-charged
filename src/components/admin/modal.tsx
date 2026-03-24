"use client"

import type React from "react"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="rounded p-1 outline-none hover:bg-foreground/5 focus-visible:ring-2"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-foreground/60" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </>
  )
}
