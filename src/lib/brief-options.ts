// Catálogo de opciones del Brief Inteligente. Se comparte entre el wizard
// (cliente) y la validación del servidor para que nunca diverjan.

export const SITE_TYPES = [
  'Landing',
  'Corporativa',
  'Ecommerce',
  'Sistema',
  'SaaS',
  'Blog',
  'Portfolio',
  'Marketplace',
  'Otro',
] as const;

export const INDUSTRIES = [
  'Salud',
  'Tecnología',
  'Educación',
  'Fitness',
  'Inmobiliaria',
  'Abogados',
  'Restaurante',
  'Finanzas',
  'Otro',
] as const;

export const AESTHETICS = [
  'Minimalista',
  'Premium',
  'Corporativa',
  'Tecnológica',
  'Oscura',
  'Colorida',
  'Elegante',
  'Moderna',
  'Neobrutalista',
  'Glassmorphism',
] as const;

export const COLORS = [
  'Azul',
  'Negro',
  'Blanco',
  'Verde',
  'Rojo',
  'Naranja',
  'Morado',
  'Sin preferencia',
] as const;

export const FEELINGS = [
  'Profesional',
  'Innovación',
  'Confianza',
  'Lujo',
  'Velocidad',
  'Exclusividad',
  'Juvenil',
  'Elegante',
] as const;

export const SECTIONS = [
  'Inicio',
  'Nosotros',
  'Servicios',
  'Productos',
  'Contacto',
  'FAQ',
  'Blog',
  'Turnos',
  'Dashboard',
  'Login',
  'Registro',
  'Panel Admin',
] as const;

export const FEATURES = [
  'Login',
  'Registro',
  'Base de datos',
  'Dashboard',
  'Pagos',
  'Mercado Pago',
  'Stripe',
  'Emails',
  'Newsletter',
  'Chat',
  'WhatsApp',
  'Agenda',
  'Carrito',
  'Panel Administrativo',
  'Facturación',
  'Roles',
  'API',
  'Integraciones',
] as const;

export const BUDGET_RANGES = [
  '<500',
  '500-1000',
  '1000-3000',
  '3000+',
] as const;

export const URGENCIES = [
  { value: 'asap', label: 'Lo antes posible' },
  { value: '1m', label: '1 mes' },
  { value: '2m', label: '2 meses' },
  { value: 'flexible', label: 'Sin apuro' },
] as const;

export const URGENCY_VALUES = URGENCIES.map((u) => u.value);

export function urgencyLabel(value: string): string {
  return URGENCIES.find((u) => u.value === value)?.label ?? value;
}
