import { join } from 'node:path'
import { REPO_ROOT } from '#shell/cli'

export const SHIPPED_MIGRATIONS = join(REPO_ROOT, 'migrations')
