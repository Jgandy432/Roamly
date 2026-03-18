import jwt from 'jsonwebtoken';

const AUTH_SECRET = process.env.EXPO_PUBLIC_RORK_APP_KEY ?? 'roamly-dev-secret';

interface TokenPayload {
  userId: string;
  type: 'session' | 'invite';
  email?: string;
  tripId?: string;
  role?: 'owner' | 'editor' | 'viewer';
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ userId, type: 'session' satisfies TokenPayload['type'] }, AUTH_SECRET, { expiresIn: '30d' });
}

export function signInviteToken(input: { email: string; tripId: string; role: 'owner' | 'editor' | 'viewer' }): string {
  return jwt.sign({ ...input, type: 'invite' satisfies TokenPayload['type'] }, AUTH_SECRET, { expiresIn: '14d' });
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, AUTH_SECRET);
  if (!payload || typeof payload !== 'object' || typeof payload.userId === 'undefined' && payload.type === 'session') {
    throw new Error('Invalid token');
  }
  return payload as TokenPayload;
}

export function decodeInviteToken(token: string): TokenPayload {
  const payload = jwt.verify(token, AUTH_SECRET);
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid invite token');
  }
  return payload as TokenPayload;
}
