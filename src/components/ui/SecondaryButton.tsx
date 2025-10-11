type SecondaryProps = {
  label: string
  onClick?: () => void
  className?: string
}

export function SecondaryButton({ label, onClick, className = '' }: SecondaryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
  className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-foreground font-medium rounded-md transition-colors duration-200 ${className}`}
    >
      {label}
    </button>
  )
}
