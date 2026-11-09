import { describe, expect, it } from 'vitest'
import { resolveEnv } from './env.ts'
import type { Env, EnvSources } from './env.types.ts'

const base: EnvSources = { flag: undefined, vars: {}, defaultEnv: 'test', dataDir: '/d' }

const everySource = { ALETHEIA_DB: '/tmp/x.sqlite', ALETHEIA_ENV: 'staging' }

const precedence: Array<[Partial<EnvSources>, Env]> = [
  [
    { flag: 'dev', vars: everySource },
    { name: 'dev', dbPath: '/d/dev.sqlite' },
  ],
  [{ vars: everySource }, { name: 'custom', dbPath: '/tmp/x.sqlite' }],
  [{ vars: { ALETHEIA_ENV: 'staging' } }, { name: 'staging', dbPath: '/d/staging.sqlite' }],
  [{}, { name: 'test', dbPath: '/d/test.sqlite' }],
]

describe('resolveEnv', () => {
  it('000-US1-AS4 --env wins over ALETHEIA_DB, ALETHEIA_DB over ALETHEIA_ENV, ALETHEIA_ENV over the default', () => {
    for (const [sources, env] of precedence) {
      expect(resolveEnv({ ...base, ...sources })).toEqual(env)
    }
  })

  it('--env x uses <dataDir>/x.sqlite', () => {
    expect(resolveEnv({ ...base, flag: 'x' }).dbPath).toBe('/d/x.sqlite')
  })

  it('000-US1-AS4 an env name that is not lowercase letters, digits and dashes is refused', () => {
    expect(() => resolveEnv({ ...base, flag: 'Prod' })).toThrow(
      'invalid --env "Prod": use lowercase letters, digits and dashes',
    )
    expect(() => resolveEnv({ ...base, vars: { ALETHEIA_ENV: 'a b' } })).toThrow(
      'invalid ALETHEIA_ENV "a b": use lowercase letters, digits and dashes',
    )
  })

  it('000-US1-AS4 custom is refused unless it comes from ALETHEIA_DB', () => {
    expect(() => resolveEnv({ ...base, flag: 'custom' })).toThrow(
      'invalid --env "custom": custom is reserved for ALETHEIA_DB',
    )
    expect(() => resolveEnv({ ...base, vars: { ALETHEIA_ENV: 'custom' } })).toThrow(
      'invalid ALETHEIA_ENV "custom": custom is reserved for ALETHEIA_DB',
    )
  })

  it('000-US1-AS4 a relative ALETHEIA_DB is refused', () => {
    expect(() => resolveEnv({ ...base, vars: { ALETHEIA_DB: 'rel/x.sqlite' } })).toThrow(
      'invalid ALETHEIA_DB "rel/x.sqlite": must be an absolute path',
    )
  })

  it('INV-01 with no data folder a named env is refused naming where it came from', () => {
    const noData = { ...base, dataDir: null }
    const refusal = (source: string) =>
      `named environments are disabled here (${source}); set ALETHEIA_DB to a temporary file`

    expect(() => resolveEnv({ ...noData, flag: 'prod' })).toThrow(refusal('--env: prod'))
    expect(() => resolveEnv({ ...noData, vars: { ALETHEIA_ENV: 'x' } })).toThrow(
      refusal('ALETHEIA_ENV: x'),
    )
    expect(() => resolveEnv(noData)).toThrow(refusal('default: test'))
    expect(resolveEnv({ ...noData, vars: { ALETHEIA_DB: '/tmp/x.sqlite' } })).toEqual({
      name: 'custom',
      dbPath: '/tmp/x.sqlite',
    })
  })
})
