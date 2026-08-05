import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

/**
 * Bottom sheet on phones, centred dialog from `sm` up.
 * Used for every transient menu in the app so they all behave the same.
 */
export default function Sheet({
  title,
  onClose,
  children,
}: {
  title?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end sm:justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative mx-auto max-h-96 w-full overflow-y-auto rounded-t-2xl bg-neutral-900 pb-8 sm:max-w-sm sm:rounded-2xl sm:pb-2">
        {title && (
          <p className="px-4 pt-4 pb-1 font-heading text-sm font-semibold tracking-wide text-neutral-500 uppercase">
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

export function SheetItem({
  label,
  icon: Icon,
  selected,
  destructive,
  onClick,
}: {
  label: string
  icon?: typeof Check
  selected?: boolean
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-base active:bg-neutral-800 ${
        destructive ? 'text-red-400' : 'text-neutral-100'
      }`}
    >
      {Icon && <Icon className="size-5 shrink-0 text-neutral-400" />}
      <span className="flex-1 truncate">{label}</span>
      {selected && <Check className="size-5 shrink-0 text-amber-400" />}
    </button>
  )
}
