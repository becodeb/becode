import { useMemo, useState, type FormEvent } from 'react';
import {
  AESTHETICS,
  BUDGET_RANGES,
  COLORS,
  FEATURES,
  FEELINGS,
  INDUSTRIES,
  SECTIONS,
  SITE_TYPES,
  URGENCIES,
} from '@/lib/brief-options';
import { requestJson } from '@/lib/client/api';
import { FormError, inputClass } from '@/components/react/ui/Field';

export interface BriefDraft {
  siteType: string;
  industry: string;
  aesthetics: string[];
  colors: string[];
  feelings: string[];
  sections: string[];
  features: string[];
  hasLogo: boolean | null;
  hasBrand: boolean | null;
  hasDomain: boolean | null;
  budgetRange: string;
  urgency: string;
  referenceUrls: string[];
  comment: string;
}

const EMPTY_DRAFT: BriefDraft = {
  siteType: '',
  industry: '',
  aesthetics: [],
  colors: [],
  feelings: [],
  sections: [],
  features: [],
  hasLogo: null,
  hasBrand: null,
  hasDomain: null,
  budgetRange: '',
  urgency: '',
  referenceUrls: [],
  comment: '',
};

const STEPS = [
  'Proyecto',
  'Estilo',
  'Contenido',
  'Detalles',
  'Referencias',
] as const;

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function ChipGroup({
  legend,
  options,
  selected,
  onToggle,
  hint,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="chip"
            data-selected={selected.includes(option)}
            aria-pressed={selected.includes(option)}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function RadioChips({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label={legend}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className="chip"
            data-selected={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function YesNo({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <RadioChips
      legend={legend}
      options={[
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
      ]}
      value={value === null ? '' : value ? 'si' : 'no'}
      onChange={(v) => onChange(v === 'si')}
    />
  );
}

export default function BriefWizard({
  initial,
}: {
  initial?: Partial<BriefDraft> | undefined;
}) {
  const [draft, setDraft] = useState<BriefDraft>({
    ...EMPTY_DRAFT,
    ...initial,
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const patch = (partial: Partial<BriefDraft>) =>
    setDraft((current) => ({ ...current, ...partial }));

  const stepError = useMemo(() => {
    switch (step) {
      case 0:
        if (!draft.siteType) return 'Elegí el tipo de sitio.';
        if (!draft.industry) return 'Elegí el rubro.';
        return null;
      case 3:
        if (
          draft.hasLogo === null ||
          draft.hasBrand === null ||
          draft.hasDomain === null
        )
          return 'Contanos si ya tenés logo, identidad y dominio.';
        if (!draft.budgetRange) return 'Elegí un rango de presupuesto.';
        if (!draft.urgency) return 'Elegí la urgencia.';
        return null;
      default:
        return null;
    }
  }, [step, draft]);

  function addUrl() {
    const value = urlInput.trim();
    if (!value) return;
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      new URL(normalized);
    } catch {
      setError('Esa URL no parece válida.');
      return;
    }
    if (draft.referenceUrls.length >= 10) return;
    if (!draft.referenceUrls.includes(normalized)) {
      patch({ referenceUrls: [...draft.referenceUrls, normalized] });
    }
    setUrlInput('');
    setError(null);
  }

  function goNext() {
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (stepError) {
      setError(stepError);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await requestJson('/api/brief', {
      body: {
        ...draft,
        hasLogo: draft.hasLogo === true,
        hasBrand: draft.hasBrand === true,
        hasDomain: draft.hasDomain === true,
        comment: draft.comment.trim() || undefined,
      },
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.href = '/app?brief=ok';
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <nav aria-label="Progreso del formulario">
        <ol className="flex flex-wrap items-center gap-2">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                aria-current={index === step ? 'step' : undefined}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  index === step
                    ? 'bg-ink text-surface'
                    : index < step
                      ? 'text-ink hover:text-signal cursor-pointer'
                      : 'text-dim cursor-default'
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[0.65rem] ${
                    index <= step
                      ? 'bg-signal text-surface'
                      : 'bg-line text-muted'
                  }`}
                >
                  {index + 1}
                </span>
                {label}
              </button>
              {index < STEPS.length - 1 && (
                <span className="bg-line h-px w-4" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {step === 0 && (
        <div className="space-y-8">
          <RadioChips
            legend="¿Qué tipo de sitio necesitás?"
            options={SITE_TYPES.map((v) => ({ value: v, label: v }))}
            value={draft.siteType}
            onChange={(siteType) => patch({ siteType })}
          />
          <RadioChips
            legend="¿De qué rubro es tu negocio?"
            options={INDUSTRIES.map((v) => ({ value: v, label: v }))}
            value={draft.industry}
            onChange={(industry) => patch({ industry })}
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          <ChipGroup
            legend="¿Qué estética te gusta?"
            hint="Podés elegir varias."
            options={AESTHETICS}
            selected={draft.aesthetics}
            onToggle={(v) => patch({ aesthetics: toggle(draft.aesthetics, v) })}
          />
          <ChipGroup
            legend="Colores preferidos"
            options={COLORS}
            selected={draft.colors}
            onToggle={(v) => patch({ colors: toggle(draft.colors, v) })}
          />
          <ChipGroup
            legend="¿Qué tiene que transmitir?"
            options={FEELINGS}
            selected={draft.feelings}
            onToggle={(v) => patch({ feelings: toggle(draft.feelings, v) })}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <ChipGroup
            legend="Secciones que va a tener el sitio"
            hint="Marcá todas las que apliquen."
            options={SECTIONS}
            selected={draft.sections}
            onToggle={(v) => patch({ sections: toggle(draft.sections, v) })}
          />
          <ChipGroup
            legend="Funcionalidades que necesitás"
            options={FEATURES}
            selected={draft.features}
            onToggle={(v) => patch({ features: toggle(draft.features, v) })}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <YesNo
              legend="¿Tenés logo?"
              value={draft.hasLogo}
              onChange={(hasLogo) => patch({ hasLogo })}
            />
            <YesNo
              legend="¿Identidad visual?"
              value={draft.hasBrand}
              onChange={(hasBrand) => patch({ hasBrand })}
            />
            <YesNo
              legend="¿Dominio propio?"
              value={draft.hasDomain}
              onChange={(hasDomain) => patch({ hasDomain })}
            />
          </div>
          <RadioChips
            legend="Presupuesto estimado (USD)"
            options={BUDGET_RANGES.map((v) => ({ value: v, label: v }))}
            value={draft.budgetRange}
            onChange={(budgetRange) => patch({ budgetRange })}
          />
          <RadioChips
            legend="¿Para cuándo lo necesitás?"
            options={URGENCIES.map((u) => ({ value: u.value, label: u.label }))}
            value={draft.urgency}
            onChange={(urgency) => patch({ urgency })}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8">
          <div>
            <label htmlFor="brief-url" className="text-sm font-semibold">
              Sitios que te gustan como referencia
            </label>
            <p className="text-muted mt-1 text-xs">
              Pegá una URL y agregala. Podés sumar hasta 10.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                id="brief-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addUrl();
                  }
                }}
                placeholder="https://ejemplo.com"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addUrl}
                className="border-line hover:border-ink shrink-0 rounded-[var(--radius-ui)] border px-4 text-sm font-semibold transition-colors"
              >
                Agregar
              </button>
            </div>
            {draft.referenceUrls.length > 0 && (
              <ul className="mt-3 space-y-2">
                {draft.referenceUrls.map((url) => (
                  <li
                    key={url}
                    className="border-line bg-surface flex items-center justify-between gap-2 rounded-[var(--radius-ui)] border px-3 py-2 text-sm"
                  >
                    <span className="truncate font-mono text-xs">{url}</span>
                    <button
                      type="button"
                      aria-label={`Quitar ${url}`}
                      onClick={() =>
                        patch({
                          referenceUrls: draft.referenceUrls.filter(
                            (u) => u !== url,
                          ),
                        })
                      }
                      className="text-muted hover:text-signal text-xs"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="brief-comment" className="text-sm font-semibold">
              ¿Algo más que quieras contarnos?{' '}
              <span className="text-muted font-normal">(opcional)</span>
            </label>
            <textarea
              id="brief-comment"
              value={draft.comment}
              onChange={(e) => patch({ comment: e.target.value })}
              rows={4}
              maxLength={2000}
              className={`${inputClass} mt-3 resize-y`}
              placeholder="Contexto, ideas, lo que tengas en mente…"
            />
          </div>
        </div>
      )}

      <FormError message={error} />

      <div className="border-line flex items-center justify-between border-t pt-5">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || loading}
          className="text-muted hover:text-ink text-sm font-semibold transition-colors disabled:invisible"
        >
          ← Anterior
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="bg-ink text-surface hover:bg-signal rounded-[var(--radius-ui)] px-6 py-2.5 text-sm font-bold transition-colors"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="bg-signal text-surface hover:bg-signal-dark rounded-[var(--radius-ui)] px-6 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando…' : 'Enviar brief'}
          </button>
        )}
      </div>
    </form>
  );
}
