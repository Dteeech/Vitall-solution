type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function TextInput({ label, ...props }: TextInputProps) {
  return (
    <label className="flex flex-col gap-2">
  {label && <span className="text-sm text-foreground">{label}</span>}
      <input className="px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" {...props} />
    </label>
  )
}
