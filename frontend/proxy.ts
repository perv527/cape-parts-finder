import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ipMap = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PER_IP = 5;

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/submit-request') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const now = Date.now();
    const entry = ipMap.get(ip);
    if (entry && now - entry.ts < WINDOW_MS) {
      if (entry.count >= MAX_PER_IP) {
        return NextResponse.json({ error: 'Too many requests. Try again tomorrow.' }, { status: 429 });
      }
      ipMap.set(ip, { count: entry.count + 1, ts: entry.ts });
    } else {
      ipMap.set(ip, { count: 1, ts: now });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/submit-request'],
};