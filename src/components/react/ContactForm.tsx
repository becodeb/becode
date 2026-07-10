import { useState } from 'react';
import type { FormEvent } from 'react';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const nextErrors: FormErrors = {};

    if (name.length < 2) nextErrors.name = 'Contanos cómo te llamás.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      nextErrors.email = 'Ingresá un email válido.';
    if (message.length < 20)
      nextErrors.message =
        'Danos un poco más de contexto, al menos 20 caracteres.';

    setErrors(nextErrors);
    setSent(false);

    if (Object.keys(nextErrors).length === 0) {
      const subject = encodeURIComponent(`Nuevo proyecto de ${name}`);
      const body = encodeURIComponent(
        `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
      );
      window.location.href = `mailto:hola@becode.com.ar?subject=${subject}&body=${body}`;
      setSent(true);
      form.reset();
    }
  }

  const fieldClass =
    'mt-2 w-full rounded-[var(--radius-ui)] border border-line bg-surface px-4 py-3.5 text-ink placeholder:text-muted focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/30';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5"
      aria-label="Formulario de contacto"
    >
      <div>
        <label htmlFor="name" className="text-sm font-bold">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className={fieldClass}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-signal mt-2 text-sm font-semibold">
            {errors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-bold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p
            id="email-error"
            className="text-signal mt-2 text-sm font-semibold"
          >
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-bold">
          ¿Qué necesitás construir?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`${fieldClass} resize-y`}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <p
            id="message-error"
            className="text-signal mt-2 text-sm font-semibold"
          >
            {errors.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="bg-signal text-surface hover:bg-signal-dark mt-2 w-full rounded-[var(--radius-ui)] px-6 py-4 font-bold transition-colors active:translate-y-px sm:w-fit"
      >
        Enviar consulta <span aria-hidden="true">↗</span>
      </button>
      <p
        className="min-h-6 text-sm font-semibold"
        role="status"
        aria-live="polite"
      >
        {sent ? 'Abrimos tu correo con el mensaje listo para enviar.' : ''}
      </p>
    </form>
  );
}
