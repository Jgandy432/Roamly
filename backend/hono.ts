import bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { signInviteToken, signSessionToken, verifyToken } from '@/backend/lib/auth';
import { readDb, updateDb } from '@/backend/lib/store';
import { publicUser, requireTripEditPermission, requireTripMembership, requireTripOwner, resolveTrip } from '@/backend/lib/trips';
import { StoredTrip, StoredTripInvite, StoredTripMember, StoredUser } from '@/backend/types';
import { FinalizedChoices, TripMemberRole, TripPlan, UserPreferences, Vote } from '@/types/trip';

const app = new Hono();

app.use('*', cors());

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function getAuthUser(request: Request): Promise<StoredUser | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'session') {
      return null;
    }
    const db = await readDb();
    return db.users.find((user) => user.id === payload.userId) ?? null;
  } catch (error) {
    console.log('Auth token invalid', { message: error instanceof Error ? error.message : 'unknown' });
    return null;
  }
}

async function requireAuth(request: Request): Promise<StoredUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

function parseBody<T>(value: unknown): T {
  return value as T;
}

app.get('/api/', (c) => c.json({ status: 'ok', message: 'Roamly backend is running' }));

app.post('/api/auth/signup', async (c) => {
  try {
    const body = parseBody<{ name?: string; email?: string; password?: string }>(await c.req.json());
    const email = body.email?.trim().toLowerCase() ?? '';
    const name = body.name?.trim() ?? '';
    const password = body.password ?? '';

    if (!name || !email || password.length < 8) {
      return jsonError('Name, email, and an 8+ character password are required');
    }

    const db = await readDb();
    if (db.users.some((user) => user.email.toLowerCase() === email)) {
      return jsonError('An account already exists for this email', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: StoredUser = {
      id: generateId(),
      name,
      email,
      passwordHash,
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString(),
    };

    await updateDb((currentDb) => ({
      ...currentDb,
      users: [...currentDb.users, user],
    }));

    const token = signSessionToken(user.id);
    console.log('User signed up', { userId: user.id, email: user.email });
    return c.json({ session: { token, user: publicUser(user) } });
  } catch (error) {
    console.log('Signup failed', { message: error instanceof Error ? error.message : 'unknown' });
    return jsonError('Unable to create account', 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const body = parseBody<{ email?: string; password?: string }>(await c.req.json());
    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';
    const db = await readDb();
    const user = db.users.find((item) => item.email.toLowerCase() === email);

    if (!user) {
      return jsonError('No account found for this email', 404);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return jsonError('Incorrect password', 401);
    }

    const token = signSessionToken(user.id);
    console.log('User logged in', { userId: user.id, email: user.email });
    return c.json({ session: { token, user: publicUser(user) } });
  } catch (error) {
    console.log('Login failed', { message: error instanceof Error ? error.message : 'unknown' });
    return jsonError('Unable to log in', 500);
  }
});

app.get('/api/auth/me', async (c) => {
  const user = await getAuthUser(c.req.raw);
  if (!user) {
    return jsonError('Unauthorized', 401);
  }
  return c.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', async (c) => {
  return c.json({ success: true });
});

app.patch('/api/auth/onboarding', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    let updatedUser: StoredUser | null = null;
    await updateDb((db) => {
      const users = db.users.map((user) => {
        if (user.id !== authUser.id) {
          return user;
        }
        updatedUser = { ...user, hasCompletedOnboarding: true };
        return updatedUser;
      });
      return { ...db, users };
    });

    if (!updatedUser) {
      return jsonError('User not found', 404);
    }

    return c.json({ user: publicUser(updatedUser) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update onboarding', 401);
  }
});

app.get('/api/trips', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const db = await readDb();
    const tripIds = db.tripMembers.filter((member) => member.userId === authUser.id).map((member) => member.tripId);
    const trips = db.trips.filter((trip) => tripIds.includes(trip.id)).map((trip) => resolveTrip(db, trip));
    return c.json({ trips });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unauthorized', 401);
  }
});

app.post('/api/trips', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const body = parseBody<{ tripName?: string; destination?: string; startDate?: string; endDate?: string; description?: string; groupSize?: number; constraints?: string }>(await c.req.json());
    const tripName = body.tripName?.trim() ?? '';
    if (!tripName) {
      return jsonError('Trip name is required');
    }

    const tripId = generateId();
    const now = new Date().toISOString();
    const trip: StoredTrip = {
      id: tripId,
      tripName,
      destination: body.destination?.trim() ?? 'Destination TBD',
      startDate: body.startDate?.trim() ?? '',
      endDate: body.endDate?.trim() ?? '',
      description: body.description?.trim() ?? '',
      constraints: body.constraints?.trim() ?? '',
      groupSize: body.groupSize ?? 1,
      createdBy: authUser.id,
      createdAt: now,
      status: 'collecting',
      plan: null,
      votes: [],
    };

    const member: StoredTripMember = {
      id: generateId(),
      tripId,
      userId: authUser.id,
      role: 'owner',
      joinedAt: now,
      preferencesSubmitted: false,
    };

    const db = await updateDb((currentDb) => ({
      ...currentDb,
      trips: [...currentDb.trips, trip],
      tripMembers: [...currentDb.tripMembers, member],
    }));

    console.log('Trip created', { tripId, createdBy: authUser.id });
    return c.json({ trip: resolveTrip(db, trip) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create trip', 401);
  }
});

app.get('/api/trips/:tripId', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const tripId = c.req.param('tripId');
    const db = await readDb();
    requireTripMembership(db, tripId, authUser.id);
    const trip = db.trips.find((item) => item.id === tripId);
    if (!trip) {
      return jsonError('Trip not found', 404);
    }
    return c.json({ trip: resolveTrip(db, trip) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load trip', 403);
  }
});

app.post('/api/trips/:tripId/preferences', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const tripId = c.req.param('tripId');
    const preferences = parseBody<UserPreferences>(await c.req.json());
    let updatedTrip: StoredTrip | null = null;

    const db = await updateDb((currentDb) => {
      requireTripEditPermission(currentDb, tripId, authUser.id);
      const tripMembers = currentDb.tripMembers.map((member) => {
        if (member.tripId !== tripId || member.userId !== authUser.id) {
          return member;
        }
        return { ...member, preferencesSubmitted: true, preferences };
      });
      updatedTrip = currentDb.trips.find((trip) => trip.id === tripId) ?? null;
      return { ...currentDb, tripMembers };
    });

    if (!updatedTrip) {
      return jsonError('Trip not found', 404);
    }

    return c.json({ trip: resolveTrip(db, updatedTrip) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to save preferences', 403);
  }
});

app.patch('/api/trips/:tripId/plan', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const tripId = c.req.param('tripId');
    const body = parseBody<{ plan: TripPlan; status?: 'planned' | 'collecting' | 'finalized' | 'completed' }>(await c.req.json());
    let updatedTrip: StoredTrip | null = null;

    const db = await updateDb((currentDb) => {
      requireTripEditPermission(currentDb, tripId, authUser.id);
      const trips = currentDb.trips.map((trip) => {
        if (trip.id !== tripId) {
          return trip;
        }
        updatedTrip = { ...trip, plan: body.plan, status: body.status ?? 'planned' };
        return updatedTrip;
      });
      return { ...currentDb, trips };
    });

    if (!updatedTrip) {
      return jsonError('Trip not found', 404);
    }

    return c.json({ trip: resolveTrip(db, updatedTrip) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to save plan', 403);
  }
});

app.post('/api/trips/:tripId/votes', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const tripId = c.req.param('tripId');
    const body = parseBody<{ itemId?: string; vote?: 'up' | 'down' }>(await c.req.json());
    if (!body.itemId || !body.vote) {
      return jsonError('Vote item and direction are required');
    }

    const itemId = body.itemId;
    const voteDirection = body.vote;
    let updatedTrip: StoredTrip | null = null;
    const db = await updateDb((currentDb) => {
      requireTripEditPermission(currentDb, tripId, authUser.id);
      const trips = currentDb.trips.map((trip) => {
        if (trip.id !== tripId) {
          return trip;
        }
        if (trip.finalized) {
          throw new Error('Voting is closed for this trip');
        }
        const existing = trip.votes.filter((vote) => !(vote.userId === authUser.id && vote.itemId === itemId));
        const nextVote: Vote = {
          userId: authUser.id,
          userName: authUser.name,
          itemId,
          vote: voteDirection,
        };
        updatedTrip = { ...trip, votes: [...existing, nextVote] };
        return updatedTrip;
      });
      return { ...currentDb, trips };
    });

    if (!updatedTrip) {
      return jsonError('Trip not found', 404);
    }

    return c.json({ trip: resolveTrip(db, updatedTrip) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to save vote', 403);
  }
});

app.post('/api/trips/:tripId/finalize', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const tripId = c.req.param('tripId');
    const body = parseBody<{ finalized: FinalizedChoices }>(await c.req.json());
    let updatedTrip: StoredTrip | null = null;
    const db = await updateDb((currentDb) => {
      requireTripOwner(currentDb, tripId, authUser.id);
      const trips = currentDb.trips.map((trip) => {
        if (trip.id !== tripId) {
          return trip;
        }
        updatedTrip = { ...trip, status: 'finalized', finalized: body.finalized };
        return updatedTrip;
      });
      return { ...currentDb, trips };
    });

    if (!updatedTrip) {
      return jsonError('Trip not found', 404);
    }

    return c.json({ trip: resolveTrip(db, updatedTrip) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to finalize trip', 403);
  }
});

app.post('/api/trips/:tripId/invites', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const tripId = c.req.param('tripId');
    const body = parseBody<{ email?: string; role?: TripMemberRole }>(await c.req.json());
    const email = body.email?.trim().toLowerCase() ?? '';
    const role = body.role ?? 'editor';
    if (!email) {
      return jsonError('Invite email is required');
    }

    let createdInvite: StoredTripInvite | null = null;
    const db = await updateDb((currentDb) => {
      requireTripOwner(currentDb, tripId, authUser.id);
      const alreadyMember = currentDb.tripMembers.some((member) => member.tripId === tripId && currentDb.users.find((user) => user.id === member.userId)?.email.toLowerCase() === email);
      if (alreadyMember) {
        throw new Error('That user is already a member of this trip');
      }
      const existingInvite = currentDb.tripInvites.find((invite) => invite.tripId === tripId && invite.email.toLowerCase() === email && invite.status === 'pending');
      if (existingInvite) {
        createdInvite = existingInvite;
        return currentDb;
      }
      const inviteToken = signInviteToken({ email, tripId, role });
      const nextInvite: StoredTripInvite = {
        id: generateId(),
        tripId,
        email,
        role,
        inviteToken,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      createdInvite = nextInvite;
      return { ...currentDb, tripInvites: [...currentDb.tripInvites, nextInvite] };
    });

    if (createdInvite === null) {
      return jsonError('Unable to create invite', 500);
    }

    const inviteResponse: StoredTripInvite = createdInvite;
    const trip = db.trips.find((item) => item.id === tripId);
    if (!trip) {
      return jsonError('Trip not found', 404);
    }

    return c.json({
      invite: {
        ...inviteResponse,
        inviteLink: `https://roamly.app/invite/${inviteResponse.inviteToken}`,
      },
      trip: resolveTrip(db, trip),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to invite collaborator', 403);
  }
});

app.post('/api/invites/accept', async (c) => {
  try {
    const authUser = await requireAuth(c.req.raw);
    const body = parseBody<{ inviteToken?: string }>(await c.req.json());
    const inviteToken = body.inviteToken ?? '';
    if (!inviteToken) {
      return jsonError('Invite token is required');
    }

    let updatedTrip: StoredTrip | null = null;
    const db = await updateDb((currentDb) => {
      const invite = currentDb.tripInvites.find((item) => item.inviteToken === inviteToken && item.status === 'pending');
      if (!invite) {
        throw new Error('Invite is invalid or already used');
      }
      if (invite.email.toLowerCase() !== authUser.email.toLowerCase()) {
        throw new Error('This invite was created for a different email');
      }
      const alreadyMember = currentDb.tripMembers.some((member) => member.tripId === invite.tripId && member.userId === authUser.id);
      const nextTripMembers = alreadyMember
        ? currentDb.tripMembers
        : [...currentDb.tripMembers, {
            id: generateId(),
            tripId: invite.tripId,
            userId: authUser.id,
            role: invite.role,
            joinedAt: new Date().toISOString(),
            preferencesSubmitted: false,
          }];
      const nextTripInvites = currentDb.tripInvites.map((item) => item.id === invite.id ? { ...item, status: 'accepted' as const } : item);
      updatedTrip = currentDb.trips.find((trip) => trip.id === invite.tripId) ?? null;
      return { ...currentDb, tripMembers: nextTripMembers, tripInvites: nextTripInvites };
    });

    if (!updatedTrip) {
      return jsonError('Trip not found', 404);
    }

    return c.json({ trip: resolveTrip(db, updatedTrip) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to accept invite', 403);
  }
});

export default app;
