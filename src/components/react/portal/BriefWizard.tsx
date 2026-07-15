import { useMemo, useState, type FormEvent } from 'react';
import {
  BRIEF_FEATURES_BY_SITE_TYPE,
  BUDGET_RANGES,
  CONTACT_OPTIONS,
  MATERIAL_OPTIONS,
  RECOMMENDED_SECTIONS,
  SIMPLE_AESTHETIC_OPTIONS,
  SIMPLE_GOALS,
  SIMPLE_SITE_TYPE_OPTIONS,
  URGENCIES,
  featureLabel,
  type BriefOption,
} from '@/lib/brief-options';
import { requestJson } from '@/lib/client/api';
import { FormError, inputClass } from '@/components/react/ui/Field';

export interface BriefDraft {
  siteType: string;
  industry: string;
  projectSummary: string;
  mainGoal: string;
  targetAudience: string;
  aesthetics: string[];
  features: string[];
  hasLogo: boolean;
  hasBrand: boolean;
  hasDomain: boolean;
  hasContent: boolean;
  budgetRange: string;
  urgency: string;
  referenceUrls: string[];
  materialLink: string;
  contactPreference: string;
  phone: string;
}

const EMPTY_DRAFT: BriefDraft = {
  siteType: '',
  industry: '',
  projectSummary: '',
  mainGoal: '',
  targetAudience: '',
  aesthetics: [],
  features: [],
  hasLogo: false,
  hasBrand: false,
  hasDomain: false,
  hasContent: false,
  budgetRange: '',
  urgency: '',
  referenceUrls: [],
  materialLink: '',
  contactPreference: 'Email',
  phone: '',
};

const STEPS = ['Tu idea', 'Prioridad', 'Estilo', 'Contacto'] as const;

const ACTION_BY_GOAL: Record<string, string> = {
  'Recibir más consultas': 'Completar un formulario',
  'Vender productos o servicios': 'Comprar',
  'Conseguir turnos o reservas': 'Reservar un turno',
  'Mostrar trabajos y generar confianza': 'Leer o explorar contenido',
  'Organizar tareas o información': 'Usar una herramienta',
  'Lanzar una idea nueva': 'Completar un formulario',
};

const FEELINGS_BY_STYLE: Record<string, string[]> = {
  Minimalista: ['Claridad', 'Confianza'],
  Premium: ['Exclusividad', 'Confianza'],
  Corporativa: ['Autoridad', 'Confianza'],
  Tecnológica: ['Innovación', 'Claridad'],
  Colorida: ['Energía', 'Diversión'],
  Artesanal: ['Calidez', 'Cercanía'],
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function RadioChips({
  legend,
  options,
  value,
  onChange,
  hint,
}: {
  legend: string;
  options: readonly BriefOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
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

function ChipGroup({
  legend,
  options,
  selected,
  onToggle,
  hint,
  getLabel = (value) => value,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  hint?: string;
  getLabel?: (value: string) => string;
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
            {getLabel(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function TextQuestion({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows,
  type = 'text',
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
  rows?: number;
  type?: 'text' | 'tel' | 'url';
  maxLength: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
      {rows ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          maxLength={maxLength}
          className={`${inputClass} mt-3 resize-y`}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          className={`${inputClass} mt-3`}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

const asOptions = (values: readonly string[]): BriefOption[] =>
  values.map((value) => ({ value, label: value }));

export default function BriefWizard({
  initial,
}: {
  initial?: Partial<BriefDraft> | undefined;
}) {
  const [draft, setDraft] = useState<BriefDraft>({
    ...EMPTY_DRAFT,
    ...initial,
    aesthetics: initial?.aesthetics?.slice(0, 1) ?? [],
    features: initial?.features ?? [],
    referenceUrls: initial?.referenceUrls ?? [],
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const patch = (partial: Partial<BriefDraft>) =>
    setDraft((current) => ({ ...current, ...partial }));

  const featureOptions = useMemo(
    () => BRIEF_FEATURES_BY_SITE_TYPE[draft.siteType] ?? [],
    [draft.siteType],
  );

  const materials = [
    draft.hasLogo && 'Logo',
    draft.hasBrand && 'Colores y tipografías',
    draft.hasContent && 'Textos e imágenes',
    draft.hasDomain && 'Dirección web',
  ].filter(Boolean) as string[];

  const stepError = useMemo(() => {
    switch (step) {
      case 0:
        if (!draft.siteType) return 'Elegí qué necesitás construir.';
        if (draft.industry.trim().length < 2)
          return 'Contanos a qué se dedica el proyecto.';
        if (draft.projectSummary.trim().length < 30)
          return 'Contanos un poco más sobre la idea.';
        return null;
      case 1:
        if (!draft.mainGoal) return 'Elegí el objetivo más importante.';
        if (draft.targetAudience.trim().length < 10)
          return 'Contanos brevemente quién va a usarlo.';
        return null;
      case 2:
        if (draft.aesthetics.length === 0)
          return 'Elegí el estilo que más se acerca a lo que imaginás.';
        return null;
      case 3:
        if (!draft.budgetRange) return 'Elegí un presupuesto aproximado.';
        if (!draft.urgency) return 'Elegí una fecha aproximada.';
        if (
          draft.contactPreference !== 'Email' &&
          draft.phone.replace(/\D/g, '').length < 7
        )
          return 'Ingresá un teléfono para que podamos contactarte.';
        return null;
      default:
        return null;
    }
  }, [step, draft]);

  function toggleMaterial(value: string) {
    if (value === 'Logo') patch({ hasLogo: !draft.hasLogo });
    if (value === 'Colores y tipografías') patch({ hasBrand: !draft.hasBrand });
    if (value === 'Textos e imágenes') patch({ hasContent: !draft.hasContent });
    if (value === 'Dirección web') patch({ hasDomain: !draft.hasDomain });
  }

  function addUrl() {
    const value = urlInput.trim();
    if (!value) return;
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      new URL(normalized);
    } catch {
      setError('Ese link no parece válido.');
      return;
    }
    if (draft.referenceUrls.length >= 3) {
      setError('Con tres referencias alcanza para entender la dirección.');
      return;
    }
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
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || stepError) {
      setError(stepError);
      return;
    }

    const style = draft.aesthetics[0] ?? 'Minimalista';
    const sections = RECOMMENDED_SECTIONS[draft.siteType] ?? [
      'Inicio',
      'Qué ofrecemos',
      'Contacto',
    ];

    setLoading(true);
    setError(null);
    const result = await requestJson('/api/brief', {
      body: {
        siteType: draft.siteType,
        industry: draft.industry.trim(),
        projectSummary: draft.projectSummary.trim(),
        mainGoal: draft.mainGoal,
        targetAudience: draft.targetAudience.trim(),
        primaryAction:
          ACTION_BY_GOAL[draft.mainGoal] ?? 'Completar un formulario',
        successMetric: `Cumplir el objetivo principal: ${draft.mainGoal.toLowerCase()}.`,
        aesthetics: [style],
        colors: [],
        feelings: FEELINGS_BY_STYLE[style] ?? ['Claridad', 'Confianza'],
        sections,
        features: draft.features,
        contentStatus: draft.hasContent
          ? 'Ya tenemos textos e imágenes listos'
          : 'Necesitamos crear los textos y elegir imágenes',
        contentManagement: draft.features.includes('Contenido editable')
          ? 'Queremos poder editarlo nosotros'
          : 'No hace falta cambiarlo seguido',
        language: draft.features.includes('Varios idiomas')
          ? 'Varios idiomas'
          : 'Solo español',
        hasLogo: draft.hasLogo,
        hasBrand: draft.hasBrand,
        hasDomain: draft.hasDomain,
        budgetRange: draft.budgetRange,
        urgency: draft.urgency,
        referenceUrls: draft.referenceUrls,
        materialLink: draft.materialLink.trim() || undefined,
        contactPreference: draft.contactPreference,
        phone: draft.phone.trim() || undefined,
      },
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.href = '/app/archivos?bienvenida=1';
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <nav aria-label="Progreso del formulario">
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                aria-current={index === step ? 'step' : undefined}
                className={`w-full border-t-2 pt-2 text-left text-xs font-semibold transition-colors ${
                  index === step
                    ? 'border-signal text-ink'
                    : index < step
                      ? 'border-ink text-muted hover:text-ink'
                      : 'border-line text-dim'
                }`}
              >
                <span className="font-mono">0{index + 1}</span>
                <span className="ml-2 hidden sm:inline">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {step === 0 && (
        <div className="space-y-7">
          <RadioChips
            legend="¿Qué necesitás?"
            options={SIMPLE_SITE_TYPE_OPTIONS}
            value={draft.siteType}
            onChange={(siteType) => patch({ siteType, features: [] })}
          />
          <TextQuestion
            id="brief-industry"
            label="¿A qué se dedican?"
            value={draft.industry}
            onChange={(industry) => patch({ industry })}
            maxLength={120}
            placeholder="Ejemplo: estudio contable, restaurante, inmobiliaria…"
          />
          <TextQuestion
            id="brief-summary"
            label="Contanos la idea en pocas palabras"
            hint="Qué hacen hoy y qué les gustaría mejorar. Con dos frases alcanza."
            value={draft.projectSummary}
            onChange={(projectSummary) => patch({ projectSummary })}
            rows={4}
            maxLength={1000}
            placeholder="Hoy recibimos pedidos por distintos medios y queremos centralizarlos en un sitio claro y fácil de usar."
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-7">
          <RadioChips
            legend="¿Qué resultado importa más?"
            options={asOptions(SIMPLE_GOALS)}
            value={draft.mainGoal}
            onChange={(mainGoal) => patch({ mainGoal })}
          />
          <TextQuestion
            id="brief-audience"
            label="¿Quién lo va a usar?"
            hint="Una descripción breve nos ayuda a tomar mejores decisiones."
            value={draft.targetAudience}
            onChange={(targetAudience) => patch({ targetAudience })}
            rows={3}
            maxLength={600}
            placeholder="Clientes de 30 a 60 años que entran principalmente desde el celular."
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-7">
          <RadioChips
            legend="¿Qué estilo se acerca más a lo que imaginás?"
            hint="Elegí uno. Después nosotros construimos una dirección completa."
            options={SIMPLE_AESTHETIC_OPTIONS}
            value={draft.aesthetics[0] ?? ''}
            onChange={(style) => patch({ aesthetics: [style] })}
          />
          <ChipGroup
            legend="¿Qué debería poder hacer?"
            hint="Mostramos sólo las opciones más comunes para tu proyecto. Podés no marcar ninguna."
            options={featureOptions}
            selected={draft.features}
            onToggle={(feature) =>
              patch({ features: toggle(draft.features, feature) })
            }
            getLabel={featureLabel}
          />
          <div>
            <label htmlFor="brief-url" className="text-sm font-semibold">
              ¿Hay algún sitio que te guste?{' '}
              <span className="text-muted font-normal">(opcional)</span>
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="brief-url"
                type="url"
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
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
                    className="border-line bg-paper flex items-center justify-between gap-2 rounded-[var(--radius-ui)] border px-3 py-2"
                  >
                    <span className="truncate font-mono text-xs">{url}</span>
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          referenceUrls: draft.referenceUrls.filter(
                            (item) => item !== url,
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
        </div>
      )}

      {step === 3 && (
        <div className="space-y-7">
          <ChipGroup
            legend="¿Qué tienen listo?"
            hint="Marcá lo que ya existe. Después de enviar te pedimos los archivos."
            options={MATERIAL_OPTIONS}
            selected={materials}
            onToggle={toggleMaterial}
          />
          <TextQuestion
            id="brief-material-link"
            label="¿Ya tienen una carpeta con material?"
            hint="Opcional. Puede ser un link de Drive, Dropbox, Figma o similar."
            value={draft.materialLink}
            onChange={(materialLink) => patch({ materialLink })}
            type="url"
            maxLength={500}
            placeholder="https://drive.google.com/…"
          />
          <div className="grid gap-7 sm:grid-cols-2">
            <RadioChips
              legend="Presupuesto aproximado (USD)"
              options={asOptions(BUDGET_RANGES)}
              value={draft.budgetRange}
              onChange={(budgetRange) => patch({ budgetRange })}
            />
            <RadioChips
              legend="¿Para cuándo?"
              options={URGENCIES}
              value={draft.urgency}
              onChange={(urgency) => patch({ urgency })}
            />
          </div>
          <div className="border-line bg-paper space-y-5 rounded-[var(--radius-ui)] border p-5">
            <RadioChips
              legend="¿Por dónde preferís que te contactemos?"
              options={CONTACT_OPTIONS}
              value={draft.contactPreference}
              onChange={(contactPreference) => patch({ contactPreference })}
            />
            <TextQuestion
              id="brief-phone"
              label={`Teléfono${draft.contactPreference === 'Email' ? ' (opcional)' : ''}`}
              hint="Incluí el código de área. Sólo lo usamos para este proyecto."
              value={draft.phone}
              onChange={(phone) => patch({ phone })}
              type="tel"
              maxLength={30}
              placeholder="+54 9 11 1234 5678"
            />
          </div>
          <div className="border-signal/30 bg-signal/5 rounded-[var(--radius-ui)] border p-4">
            <p className="text-sm font-semibold">
              El próximo paso son los archivos
            </p>
            <p className="text-muted mt-1 text-xs leading-5">
              Al enviar el brief te llevamos a una pantalla simple para subir
              logo, fotos, textos, catálogos o cualquier documento útil.
            </p>
          </div>
        </div>
      )}

      <FormError message={error} />

      <div className="border-line flex items-center justify-between border-t pt-5">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
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
            {loading ? 'Enviando…' : 'Enviar y subir archivos →'}
          </button>
        )}
      </div>
    </form>
  );
}
