import type { CardDraft } from '#core/cards'

export const SAMPLE_DRAFT: CardDraft = {
  type: 'command',
  question: 'En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?',
  answer: '`ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.',
  keyPoints: ['`ps`: solo en ejecución', '`-a`: incluye detenidos'],
  situation: 'Un contenedor se cayó y no aparece en `docker ps`.',
  tags: ['docker::commands'],
  source: 'diarium',
}
