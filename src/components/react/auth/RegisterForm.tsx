import { useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/client/api';
import { Field, FormError, SubmitButton } from '@/components/react/ui/Field';

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const passwordConfirm = String(form.get('passwordConfirm') ?? '');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!form.get('acceptTerms')) {
      setError('Tenés que aceptar los términos para continuar.');
      return;
    }

    setLoading(true);
    const result = await requestJson('/api/auth/register', {
      body: {
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        company: form.get('company'),
        email: form.get('email'),
        password,
        passwordConfirm,
        acceptTerms: true,
      },
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.href = '/app/brief';
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Nombre"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={60}
        />
        <Field
          label="Apellido"
          name="lastName"
          autoComplete="family-name"
          required
          maxLength={60}
        />
      </div>
      <Field
        label="Empresa"
        name="company"
        autoComplete="organization"
        required
        maxLength={120}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Mínimo 8 caracteres."
      />
      <Field
        label="Confirmar contraseña"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        required
      />
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="accent-signal mt-0.5 h-4 w-4"
        />
        <span className="text-muted">
          Acepto que becode use estos datos para gestionar mi proyecto.
        </span>
      </label>
      <FormError message={error} />
      <SubmitButton loading={loading}>Crear cuenta</SubmitButton>
    </form>
  );
}
