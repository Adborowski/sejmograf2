import { createHmac } from 'crypto';
import { getAdminDb } from '@/lib/firebase/adminDb';

function verifyToken(email: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex')
    .slice(0, 32);
  return token === expected;
}

async function recordUnsubscribe(email: string) {
  const db = getAdminDb();
  await db.collection('unsubscribes').doc(email.toLowerCase()).set({
    email: email.toLowerCase(),
    unsubscribedAt: new Date().toISOString(),
  });
}

// GET — user clicked the link in the email body
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const e = searchParams.get('e');
  const t = searchParams.get('t');

  if (!e || !t) {
    return Response.redirect(`${origin}/unsubscribe?error=invalid`);
  }

  let email: string;
  try {
    email = Buffer.from(e, 'base64url').toString('utf8');
  } catch {
    return Response.redirect(`${origin}/unsubscribe?error=invalid`);
  }

  if (!verifyToken(email, t)) {
    return Response.redirect(`${origin}/unsubscribe?error=invalid`);
  }

  await recordUnsubscribe(email);
  return Response.redirect(`${origin}/unsubscribe?success=1`);
}

// POST — Gmail / Outlook one-click unsubscribe (RFC 8058)
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const e = searchParams.get('e');
  const t = searchParams.get('t');

  if (!e || !t) return new Response('Bad request', { status: 400 });

  let email: string;
  try {
    email = Buffer.from(e, 'base64url').toString('utf8');
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (!verifyToken(email, t)) return new Response('Forbidden', { status: 403 });

  await recordUnsubscribe(email);
  return new Response('Unsubscribed', { status: 200 });
}
