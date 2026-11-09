type RunResult = { status: number; stdout: string; stderr: string }

type RunCall = { command: string; args: string[]; cwd?: string }

export function fakeRunner(responses: Record<string, Partial<RunResult>>) {
  const calls: RunCall[] = []
  async function run(command: string, args: string[], options?: { cwd?: string }) {
    calls.push({ command, args, cwd: options?.cwd })
    return { status: 0, stdout: '', stderr: '', ...responses[`${command} ${args.join(' ')}`] }
  }
  return { run, calls }
}
