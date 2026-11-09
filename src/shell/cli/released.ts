#!/usr/bin/env node
import { homedir } from 'node:os'
import { releasedContext, type Release } from './invocation/context.ts'
import { main } from './main.ts'

declare const __ALETHEIA_RELEASE__: Release

process.exitCode = await main(process.argv.slice(2), {
  ...releasedContext({
    release: __ALETHEIA_RELEASE__,
    entryDir: import.meta.dirname,
    vars: process.env,
    home: homedir(),
  }),
  stdout: process.stdout,
  stderr: process.stderr,
})
