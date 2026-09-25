import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Select } from './Select'

const controlClass = 'w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-semibold text-slate-700">{label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}</label>
}

function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  return children ? <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-700">{children}</p> : null
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, id, error, required, className = '', ...props }: TextFieldProps) {
  const inputId = id ?? label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
  return (
    <div>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <input id={inputId} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} className={`${controlClass} h-10 ${className}`} {...props} />
      <FieldError id={inputId}>{error}</FieldError>
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function TextAreaField({ label, id, error, required, hint, className = '', ...props }: TextAreaFieldProps) {
  const inputId = id ?? label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
  return (
    <div>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <textarea id={inputId} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} className={`${controlClass} min-h-28 resize-y py-2.5 leading-6 ${className}`} {...props} />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      <FieldError id={inputId}>{error}</FieldError>
    </div>
  )
}

interface SelectFieldProps {
  label: string
  id?: string
  value: string
  disabled?: boolean
  required?: boolean
  error?: string
  options: readonly string[]
  placeholder?: string
  className?: string
  optionLabel?: (value: string) => string
  onChange?: (value: string) => void
}

export function SelectField({ label, id, value, disabled, error, required, options, placeholder = 'Chọn một mục', optionLabel, className = '', onChange }: SelectFieldProps) {
  const inputId = id ?? label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
  const colors: Record<string, string> = {
    new: 'bg-slate-400', investigating: 'bg-blue-500', waiting: 'bg-amber-500', resolved: 'bg-emerald-500', closed: 'bg-slate-400',
    low: 'bg-slate-400', medium: 'bg-blue-500', high: 'bg-orange-500', critical: 'bg-rose-500',
  }
  const selectOptions = options.map((value) => ({ value, label: optionLabel ? optionLabel(value) : value, tone: colors[value] }))
  return (
    <div>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <div className={className}>
        <Select
          id={inputId}
          value={value}
          options={selectOptions}
          placeholder={placeholder}
          required={required}
          invalid={Boolean(error)}
          describedBy={error ? `${inputId}-error` : undefined}
          disabled={disabled}
          onChange={(next) => onChange?.(next)}
        />
      </div>
      <FieldError id={inputId}>{error}</FieldError>
    </div>
  )
}
