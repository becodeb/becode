import { useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/client/api';
import { Field, FormError, SubmitButton } from '@/components/react/ui/Field';

/**
 * Con `token` muestra el paso de nueva contraseña; sin token, el paso de
 * pedir el link de recuperación.
 */
export default function RecoverForm({ token }: { token?: string | undefined }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const result = await requestJson('/api/auth/recover', {
      body: { email: form.get('email') },
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== String(form.get('passwordConfirm') ?? '')) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const result = await requestJson('/api/auth/reset', {
      body: { token, password },
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.href = '/login';
  }

  if (token) {
    return (
      <form onSubmit={handleReset} className="space-y-4" noValidate>
        <Field
          label="Nueva contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <Field
          label="Confirmar contraseña"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
        <FormError message={error} />
        <SubmitButton loading={loading}>Guardar contraseña</SubmitButton>
      </form>
    );
  }

  if (done) {
    return (
      <p className="border-line bg-surface rounded-[var(--radius-ui)] border px-4 py-3 text-sm">
        Si existe una cuenta con ese email, vas a recibir un link para
        restablecer la contraseña. Revisá también el spam.
      </p>
    );
  }

  return (
    <form onSubmit={handleRequest} className="space-y-4" noValidate>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <FormError message={error} />
      <SubmitButton loading={loading}>Enviarme el link</SubmitButton>
    </form>
  );
}
