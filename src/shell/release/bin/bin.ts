import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { RELEASE_DATA_FOLDER, REPO_ROOT, VITEST_VAR } from '#shell/cli'
import { buildRelease } from '../build/build.ts'
import { release } from '../release/release.ts'
import { runCommand } from '../runner/runner.ts'
import { SKILL_NAME } from '../skill-copy/skill-copy.constants.ts'
import { copySkill } from '../skill-copy/skill-copy.ts'
import { SKILLS_FOLDER, SOURCE_SKILLS_FOLDER, TEMP_DIR_PREFIX } from './bin.constants.ts'

const packageJsonText = readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')
const tempDirTemplate = join(tmpdir(), TEMP_DIR_PREFIX)
const skill = {
  source: join(REPO_ROOT, SOURCE_SKILLS_FOLDER, SKILL_NAME),
  skillsDir: join(homedir(), RELEASE_DATA_FOLDER, SKILLS_FOLDER),
}

process.exitCode = await release({
  run: runCommand,
  build: buildRelease,
  packageJson: JSON.parse(packageJsonText),
  repoRoot: REPO_ROOT,
  makeTempDir: () => mkdtempSync(tempDirTemplate),
  removeTempDir: (dir) => rmSync(dir, { recursive: true, force: true }),
  copySkill: process.env[VITEST_VAR] ? null : () => copySkill(skill),
  stdout: process.stdout,
  stderr: process.stderr,
})
