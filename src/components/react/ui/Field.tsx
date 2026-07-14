import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
}

export const inputClass =
  'border-line focus:border-signal focus:ring-signal/30 bg-paper text-ink ' +
  'placeholder:text-muted w-full rounded-[var(--radius-ui)] border px-3.5 ' +
  'py-2.5 text-sm focus:ring-2 focus:outline-none';

export function Field({ label, hint, ...inputProps }: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input id={id} className={inputClass} {...inputProps} />
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  );
}

export function SubmitButton({
  children,
  loading,
}: {
  children: ReactNode;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="bg-signal text-surface hover:bg-signal-dark w-full rounded-[var(--radius-ui)] px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
    >
      {loading ? 'Un momento…' : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-signal border-signal/30 bg-signal/5 rounded-[var(--radius-ui)] border px-3 py-2 text-sm"
    >
      {message}
    </p>
  );
}
