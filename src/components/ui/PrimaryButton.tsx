type Props = {
  label: string
  onClick?: () => void
  withIcons?: boolean
  className?: string
}

function PlusIcon({ size = 18 }: { size?: number }) {
  const s = size
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PrimaryButton({ label, onClick, withIcons = true, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
  className={`inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold text-lg rounded-xl transition-colors duration-200 ${className}`}
    >
      {withIcons && <PlusIcon />}
      <span>{label}</span>
      {withIcons && <PlusIcon />}
    </button>
  )
}
