import { describe, expect, it } from 'vitest'
import { missingIds } from './support/traceability.ts'

describe('traceability', () => {
  it('000-US5-AS3 lists the ids from a spec that no test or eval contains', () => {
    const spec = '1. **999-US1-AS1** Given … 2. **999-US1-AS2** Given … **INV-99** … again **999-US1-AS2**'

    const missing = missingIds({ specs: [spec], tests: ["it('999-US1-AS1 works')"] })

    expect(missing).toEqual(['999-US1-AS2', 'INV-99'])
  })
})
