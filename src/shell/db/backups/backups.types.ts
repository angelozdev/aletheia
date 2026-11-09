import type { Store } from '../database/database.types.ts'

export type BackupRequest = { db: Store; env: string; root: string; now: Date }

export type BackupResult = { path: string; removed: string[] }
