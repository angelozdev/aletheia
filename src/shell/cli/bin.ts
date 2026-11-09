#!/usr/bin/env node
import { homedir } from 'node:os'
import { join } from 'node:path'
import { sourceContext } from './invocation/context.ts'
import { main } from './main.ts'

process.exitCode = await main(process.argv.slice(2), {
  ...sourceContext({
    repoRoot: join(import.meta.dirname, '..', '..', '..'),
    vars: process.env,
    home: homedir(),
  }),
  stdout: process.stdout,
  stderr: process.stderr,
})
