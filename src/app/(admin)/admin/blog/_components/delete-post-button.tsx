'use client'

import { Trash2 } from 'lucide-react'

type DeletePostButtonProps = {
  action: () => void | Promise<void>
  title: string
}

export function DeletePostButton({ action, title }: DeletePostButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        aria-label={`Delete ${title}`}
        className="rounded-md cursor-pointer bg-red-600 p-2 text-white transition hover:bg-red-500"
        onClick={(event) => {
          if (!window.confirm("Delete this post?")) {
            event.preventDefault()
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  )
}
