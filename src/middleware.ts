import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from '@/lib/server/auth/session';
import { errorJson } from '@/lib/server/http';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Rutas que necesitan conocer la sesión. El resto (landing prerenderizada,
// assets) no toca la base de datos.
const SESSION_PREFIXES = [
  '/app',
  '/admin',
  '/api',
  '/login',
  '/registro',
  '/recuperar',
];

function needsSession(pathname: string): boolean {
  return SESSION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;

  // Protección CSRF: las requests mutantes deben venir del propio origen.
  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) {
      return errorJson('Origen no permitido.', 403);
    }
  }

  context.locals.user = null;

  if (!needsSession(url.pathname)) {
    return next();
  }

  context.locals.user = await getSessionUser(context.cookies);
  const user = context.locals.user;
  const isApi = url.pathname.startsWith('/api');

  // Portal del cliente: requiere sesión.
  if (url.pathname.startsWith('/app') && !user) {
    return context.redirect(`/login?next=${encodeURIComponent(url.pathname)}`);
  }

  // CRM: requiere rol OWNER.
  if (url.pathname.startsWith('/admin') && user?.role !== 'OWNER') {
    return user ? context.redirect('/app') : context.redirect('/login');
  }

  if (
    isApi &&
    url.pathname.startsWith('/api/admin') &&
    user?.role !== 'OWNER'
  ) {
    return user
      ? errorJson('Sin permisos.', 403)
      : errorJson('No autenticado.', 401);
  }

  // Usuarios logueados no vuelven a las pantallas de acceso.
  if (
    user &&
    ['/login', '/registro'].includes(url.pathname) &&
    request.method === 'GET'
  ) {
    return context.redirect(user.role === 'OWNER' ? '/admin' : '/app');
  }

  return next();
});
