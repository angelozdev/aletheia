import { z } from 'zod'
import { requiredText } from '../../invocation/input/input.schema.ts'
import { cardFields } from '../card-add/card-add.schema.ts'

const optionalCardFields = z.object(cardFields).partial().shape

export const editSchema = z.strictObject({ card: requiredText, ...optionalCardFields })
