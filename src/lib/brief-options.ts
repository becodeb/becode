// Opciones compartidas por el brief, la validación y la generación del prompt.
// Los valores se guardan estables; las etiquetas están escritas para clientes.

export interface BriefOption {
  value: string;
  label: string;
}

export const SITE_TYPE_OPTIONS = [
  { value: 'Landing', label: 'Una página para presentar o vender algo' },
  { value: 'Corporativa', label: 'Sitio completo para una empresa' },
  { value: 'Ecommerce', label: 'Tienda online' },
  { value: 'Sistema', label: 'Herramienta para organizar el trabajo' },
  { value: 'SaaS', label: 'Aplicación online con cuentas de usuario' },
  { value: 'Reservas', label: 'Sitio de turnos o reservas' },
  { value: 'Blog', label: 'Blog, revista o sitio de noticias' },
  { value: 'Portfolio', label: 'Portfolio para mostrar trabajos' },
  {
    value: 'Marketplace',
    label: 'Plataforma para conectar personas, negocios o publicaciones',
  },
  { value: 'Otro', label: 'Otra idea' },
] as const satisfies readonly BriefOption[];

export const SIMPLE_SITE_TYPE_OPTIONS = [
  { value: 'Corporativa', label: 'Presentar un negocio o servicio' },
  { value: 'Ecommerce', label: 'Vender por internet' },
  { value: 'Reservas', label: 'Recibir turnos o reservas' },
  { value: 'Sistema', label: 'Organizar tareas o información' },
  { value: 'Portfolio', label: 'Mostrar trabajos o contenido' },
  { value: 'Otro', label: 'Tengo otra idea' },
] as const satisfies readonly BriefOption[];

export const SITE_TYPES = SITE_TYPE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

export const INDUSTRIES = [
  'Salud y bienestar',
  'Tecnología',
  'Educación',
  'Deportes y entrenamiento',
  'Inmobiliaria y construcción',
  'Servicios legales',
  'Gastronomía',
  'Finanzas',
  'Comercio y ventas',
  'Turismo y hotelería',
  'Servicios profesionales',
  'Cultura y entretenimiento',
  'Organización social',
  'Otro',
] as const;

export const AESTHETIC_OPTIONS = [
  { value: 'Minimalista', label: 'Simple y minimalista' },
  { value: 'Premium', label: 'Exclusiva y de alta calidad' },
  { value: 'Corporativa', label: 'Seria y profesional' },
  { value: 'Tecnológica', label: 'Tecnológica y precisa' },
  { value: 'Oscura', label: 'Oscura y cinematográfica' },
  { value: 'Colorida', label: 'Colorida y enérgica' },
  { value: 'Elegante', label: 'Elegante y editorial' },
  { value: 'Moderna', label: 'Moderna y cercana' },
  { value: 'Neobrutalista', label: 'Audaz, con bordes y contrastes fuertes' },
  {
    value: 'Glassmorphism',
    label: 'Liviana, con transparencias y profundidad',
  },
  { value: 'Artesanal', label: 'Cálida y artesanal' },
] as const satisfies readonly BriefOption[];

export const SIMPLE_AESTHETIC_OPTIONS = [
  { value: 'Minimalista', label: 'Simple y minimalista' },
  { value: 'Premium', label: 'Elegante y de alta calidad' },
  { value: 'Corporativa', label: 'Profesional y confiable' },
  { value: 'Tecnológica', label: 'Digital y moderna' },
  { value: 'Colorida', label: 'Colorida y enérgica' },
  { value: 'Artesanal', label: 'Cálida y humana' },
] as const satisfies readonly BriefOption[];

export const AESTHETICS = AESTHETIC_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

export const COLORS = [
  'Azul',
  'Negro',
  'Blanco',
  'Verde',
  'Rojo',
  'Naranja',
  'Violeta',
  'Tonos tierra',
  'Sin preferencia',
] as const;

export const FEELINGS = [
  'Confianza',
  'Claridad',
  'Innovación',
  'Calidez',
  'Exclusividad',
  'Energía',
  'Tranquilidad',
  'Cercanía',
  'Autoridad',
  'Diversión',
] as const;

export const GOALS = [
  'Recibir más consultas',
  'Vender productos o servicios',
  'Conseguir turnos o reservas',
  'Mostrar trabajos y generar confianza',
  'Explicar mejor una propuesta',
  'Organizar tareas o información',
  'Conectar distintos tipos de usuarios',
  'Publicar contenido',
  'Lanzar una idea nueva',
  'Otro',
] as const;

export const SIMPLE_GOALS = [
  'Recibir más consultas',
  'Vender productos o servicios',
  'Conseguir turnos o reservas',
  'Mostrar trabajos y generar confianza',
  'Organizar tareas o información',
  'Lanzar una idea nueva',
] as const;

export const PRIMARY_ACTIONS = [
  'Escribir por WhatsApp',
  'Completar un formulario',
  'Comprar',
  'Reservar un turno',
  'Crear una cuenta',
  'Pedir un presupuesto',
  'Llamar',
  'Visitar un local',
  'Leer o explorar contenido',
  'Usar una herramienta',
  'Otra acción',
] as const;

export const SECTIONS = [
  'Inicio',
  'Qué ofrecemos',
  'Productos o servicios',
  'Trabajos realizados',
  'Quiénes somos',
  'Opiniones de clientes',
  'Precios o planes',
  'Preguntas frecuentes',
  'Contacto',
  'Blog o novedades',
  'Turnos o reservas',
  'Tienda',
  'Panel personal',
  'Ingreso y registro',
  'Panel de administración',
] as const;

export const FEATURES = [
  'Formulario de contacto',
  'WhatsApp',
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
  'Agenda',
  'Carrito',
  'Panel Administrativo',
  'Facturación',
  'Roles',
  'API',
  'Integraciones',
  'Buscador y filtros',
  'Control de stock',
  'Opciones de envío',
  'Cupones o descuentos',
  'Avisos y recordatorios',
  'Carga de archivos',
  'Estadísticas e informes',
  'Contenido editable',
  'Mapa y sucursales',
  'Varios idiomas',
] as const;

export const FEATURE_LABELS: Record<string, string> = {
  Login: 'Ingreso para usuarios',
  Registro: 'Creación de cuentas',
  'Base de datos': 'Guardar información de forma segura',
  Dashboard: 'Panel con información y resultados',
  Pagos: 'Pagos online',
  Stripe: 'Pagos internacionales con Stripe',
  Emails: 'Emails automáticos',
  Newsletter: 'Envío de novedades por email',
  Agenda: 'Agenda de turnos o reservas',
  Carrito: 'Carrito de compras',
  'Panel Administrativo': 'Panel para administrar el sitio',
  Roles: 'Distintos permisos según la persona',
  API: 'Conexión con otros sistemas',
  Integraciones: 'Conexión con herramientas que ya usan',
};

export const CONTENT_STATUSES = [
  'Ya tenemos textos e imágenes listos',
  'Tenemos material, pero hay que ordenarlo y mejorarlo',
  'Necesitamos crear los textos y elegir imágenes',
] as const;

export const CONTENT_MANAGEMENT_OPTIONS = [
  'No hace falta cambiarlo seguido',
  'Queremos poder editarlo nosotros',
  'Preferimos pedirle los cambios a becode',
] as const;

export const LANGUAGE_OPTIONS = [
  'Solo español',
  'Español e inglés',
  'Varios idiomas',
] as const;

export const BUDGET_RANGES = [
  '<500',
  '500-1000',
  '1000-3000',
  '3000+',
] as const;

export const URGENCIES = [
  { value: 'asap', label: 'Lo antes posible' },
  { value: '1m', label: 'Dentro de 1 mes' },
  { value: '2m', label: 'Dentro de 2 meses' },
  { value: 'flexible', label: 'La fecha es flexible' },
] as const;

export const URGENCY_VALUES = URGENCIES.map((urgency) => urgency.value) as [
  string,
  ...string[],
];

export const RECOMMENDED_SECTIONS: Record<string, readonly string[]> = {
  Landing: [
    'Inicio',
    'Qué ofrecemos',
    'Opiniones de clientes',
    'Preguntas frecuentes',
    'Contacto',
  ],
  Corporativa: [
    'Inicio',
    'Qué ofrecemos',
    'Quiénes somos',
    'Trabajos realizados',
    'Contacto',
  ],
  Ecommerce: [
    'Inicio',
    'Tienda',
    'Productos o servicios',
    'Preguntas frecuentes',
    'Contacto',
  ],
  Sistema: ['Ingreso y registro', 'Panel personal', 'Panel de administración'],
  SaaS: [
    'Inicio',
    'Qué ofrecemos',
    'Precios o planes',
    'Ingreso y registro',
    'Panel personal',
  ],
  Reservas: [
    'Inicio',
    'Productos o servicios',
    'Turnos o reservas',
    'Preguntas frecuentes',
    'Contacto',
  ],
  Blog: ['Inicio', 'Blog o novedades', 'Quiénes somos', 'Contacto'],
  Portfolio: ['Inicio', 'Trabajos realizados', 'Quiénes somos', 'Contacto'],
  Marketplace: [
    'Inicio',
    'Ingreso y registro',
    'Panel personal',
    'Preguntas frecuentes',
    'Contacto',
  ],
};

export const RECOMMENDED_FEATURES: Record<string, readonly string[]> = {
  Landing: ['Formulario de contacto', 'WhatsApp', 'Emails'],
  Corporativa: [
    'Formulario de contacto',
    'WhatsApp',
    'Contenido editable',
    'Mapa y sucursales',
  ],
  Ecommerce: [
    'Carrito',
    'Pagos',
    'Mercado Pago',
    'Control de stock',
    'Opciones de envío',
    'Cupones o descuentos',
  ],
  Sistema: [
    'Login',
    'Roles',
    'Base de datos',
    'Dashboard',
    'Panel Administrativo',
    'Estadísticas e informes',
  ],
  SaaS: ['Registro', 'Login', 'Roles', 'Pagos', 'Dashboard', 'Emails'],
  Reservas: ['Agenda', 'Avisos y recordatorios', 'Pagos', 'WhatsApp', 'Emails'],
  Blog: ['Contenido editable', 'Buscador y filtros', 'Newsletter'],
  Portfolio: ['Formulario de contacto', 'WhatsApp', 'Contenido editable'],
  Marketplace: [
    'Registro',
    'Login',
    'Roles',
    'Buscador y filtros',
    'Pagos',
    'Chat',
  ],
};

export const BRIEF_FEATURES_BY_SITE_TYPE: Record<string, readonly string[]> = {
  Corporativa: [
    'Formulario de contacto',
    'WhatsApp',
    'Contenido editable',
    'Mapa y sucursales',
    'Newsletter',
    'Varios idiomas',
  ],
  Ecommerce: [
    'Carrito',
    'Pagos',
    'Control de stock',
    'Opciones de envío',
    'Registro',
    'Panel Administrativo',
  ],
  Reservas: [
    'Agenda',
    'Avisos y recordatorios',
    'Pagos',
    'WhatsApp',
    'Registro',
    'Panel Administrativo',
  ],
  Sistema: [
    'Login',
    'Roles',
    'Dashboard',
    'Carga de archivos',
    'Estadísticas e informes',
    'Integraciones',
  ],
  Portfolio: [
    'Formulario de contacto',
    'WhatsApp',
    'Contenido editable',
    'Buscador y filtros',
    'Newsletter',
    'Varios idiomas',
  ],
  Otro: [
    'Formulario de contacto',
    'WhatsApp',
    'Registro',
    'Pagos',
    'Contenido editable',
    'Integraciones',
  ],
};

export const MATERIAL_OPTIONS = [
  'Logo',
  'Colores y tipografías',
  'Textos e imágenes',
  'Dirección web',
] as const;

export const CONTACT_OPTIONS = [
  { value: 'Email', label: 'Email' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Llamada', label: 'Llamada' },
] as const satisfies readonly BriefOption[];

export const CONTACT_VALUES = CONTACT_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

export function urgencyLabel(value: string): string {
  return URGENCIES.find((urgency) => urgency.value === value)?.label ?? value;
}

export function featureLabel(value: string): string {
  return FEATURE_LABELS[value] ?? value;
}
