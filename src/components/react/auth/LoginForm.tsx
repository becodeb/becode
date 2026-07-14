import { useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/client/api';
import { Field, FormError, SubmitButton } from '@/components/react/ui/Field';

export default function LoginForm({ next }: { next?: string | undefined }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const result = await requestJson<{ role: string }>('/api/auth/login', {
      body: { email: form.get('email'), password: form.get('password') },
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const fallback = result.data?.role === 'OWNER' ? '/admin' : '/app';
    const target =
      next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
    window.location.href = target;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormError message={error} />
      <SubmitButton loading={loading}>Ingresar</SubmitButton>
      <p className="text-muted text-center text-sm">
        <a
          href="/recuperar"
          className="hover:text-signal underline underline-offset-2"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </p>
    </form>
  );
}
