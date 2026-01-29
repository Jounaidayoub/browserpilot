import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '../config/env.ts';
import * as schema from './schema.ts';

/**
 * Drizzle database instance
 * Uses libsql for SQLite connection
 */
const client = createClient({
  url: env.DB_FILE_NAME
});

export const db = drizzle(client, { schema });
