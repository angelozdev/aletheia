import type { DatabaseSync } from 'node:sqlite'
import type { NodeSQLiteDatabase } from 'drizzle-orm/node-sqlite'

export type Store = NodeSQLiteDatabase & { $client: DatabaseSync }

export type StoreRequest = { path: string; migrationsDir: string }
