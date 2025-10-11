type IconButtonProps = {
  label?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function IconButton({ label, onClick, children, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center justify-center p-2 rounded-md hover:bg-neutral-100 ${className}`}
    >
      {children}
    </button>
  )
}
