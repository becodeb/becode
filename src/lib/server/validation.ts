import { z } from 'zod';
import {
  AESTHETICS,
  BUDGET_RANGES,
  COLORS,
  FEATURES,
  FEELINGS,
  INDUSTRIES,
  SECTIONS,
  SITE_TYPES,
  URGENCY_VALUES,
} from '@/lib/brief-options';

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const registerSchema = z
  .object({
    firstName: trimmed(60),
    lastName: trimmed(60),
    company: trimmed(120),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string(),
    acceptTerms: z.literal(true),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const recoverSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

const multi = <T extends readonly [string, ...string[]]>(
  values: T,
  max: number,
) => z.array(z.enum(values)).max(max).default([]);

export const briefSchema = z.object({
  siteType: z.enum(SITE_TYPES),
  industry: z.enum(INDUSTRIES),
  aesthetics: multi(AESTHETICS, AESTHETICS.length),
  colors: multi(COLORS, COLORS.length),
  feelings: multi(FEELINGS, FEELINGS.length),
  sections: multi(SECTIONS, SECTIONS.length),
  features: multi(FEATURES, FEATURES.length),
  hasLogo: z.boolean(),
  hasBrand: z.boolean(),
  hasDomain: z.boolean(),
  budgetRange: z.enum(BUDGET_RANGES),
  urgency: z.enum(URGENCY_VALUES as [string, ...string[]]),
  referenceUrls: z.array(z.string().trim().url().max(500)).max(10).default([]),
  comment: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const messageSchema = z.object({
  projectId: z.string().min(1),
  content: trimmed(2000),
});

export const noteSchema = z.object({ content: trimmed(2000) });

export const statusSchema = z.object({
  status: z.enum([
    'PENDIENTE',
    'APROBADO',
    'DISENO',
    'DESARROLLO',
    'TESTING',
    'DEPLOY',
    'FINALIZADO',
  ]),
});

export const projectUpdateSchema = z.object({
  title: trimmed(160).optional(),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  quote: z.number().min(0).max(10_000_000).nullable().optional(),
});

export const tagAssignSchema = z.object({ tagId: z.string().min(1) });

export const templateSchema = z.object({
  title: trimmed(160),
  category: trimmed(60),
  content: trimmed(20_000),
});

export const referenceSchema = z.object({
  title: trimmed(160),
  url: z.string().trim().url().max(500),
  notes: z.string().trim().max(1000).optional(),
});

export type BriefInput = z.infer<typeof briefSchema>;
