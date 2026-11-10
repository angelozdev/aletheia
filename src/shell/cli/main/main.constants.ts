export const ExitCode = { Success: 0, Failure: 1 } as const

export const COMMAND_GROUPS = {
  card: 'cards of the deck',
  review: 'what is due and its grades',
  tag: 'tags in use and the cards under them',
} as const
