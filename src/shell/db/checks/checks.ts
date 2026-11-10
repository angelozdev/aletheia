import { sql, type SQL } from 'drizzle-orm'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

export function oneOf(column: AnySQLiteColumn, values: readonly string[]): SQL {
  return sql`${column} IN (${sql.raw(values.map((value) => `'${value}'`).join(','))})`
}

export function textLiteral(value: string): SQL {
  return sql.raw(`'${value}'`)
}

export function notBlank(column: AnySQLiteColumn): SQL {
  return sql`length(trim(${column})) > 0`
}
