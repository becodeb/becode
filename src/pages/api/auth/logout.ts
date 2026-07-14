import type { APIRoute } from 'astro';
import { destroySession } from '@/lib/server/auth/session';
import { json } from '@/lib/server/http';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  await destroySession(context.cookies);
  return json({ ok: true });
};
