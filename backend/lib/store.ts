import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DatabaseShape } from '@/backend/types';

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'store.json');

const EMPTY_DB: DatabaseShape = {
  users: [],
  trips: [],
  tripMembers: [],
  tripInvites: [],
};

export async function readDb(): Promise<DatabaseShape> {
  try {
    const raw = await readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
    return {
      users: parsed.users ?? [],
      trips: parsed.trips ?? [],
      tripMembers: parsed.tripMembers ?? [],
      tripInvites: parsed.tripInvites ?? [],
    };
  } catch (error) {
    console.log('Database read fallback', { message: error instanceof Error ? error.message : 'unknown' });
    await persistDb(EMPTY_DB);
    return EMPTY_DB;
  }
}

export async function persistDb(db: DatabaseShape): Promise<void> {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export async function updateDb(updater: (db: DatabaseShape) => DatabaseShape | Promise<DatabaseShape>): Promise<DatabaseShape> {
  const current = await readDb();
  const next = await updater(current);
  await persistDb(next);
  return next;
}
