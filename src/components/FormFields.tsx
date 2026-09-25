import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

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

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: readonly string[]
  placeholder?: string
  optionLabel?: (value: string) => string
}

export function SelectField({ label, id, error, required, options, placeholder = 'Chọn một mục', optionLabel, className = '', ...props }: SelectFieldProps) {
  const inputId = id ?? label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
  return (
    <div>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <select id={inputId} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} className={`${controlClass} h-10 ${className}`} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{optionLabel ? optionLabel(option) : option}</option>)}
      </select>
      <FieldError id={inputId}>{error}</FieldError>
    </div>
  )
}
