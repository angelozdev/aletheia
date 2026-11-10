import { definePlugin } from '@oxlint/plugins'
import { noComments } from './no-comments.ts'
import { noNestedCalls } from './no-nested-calls.ts'

export default definePlugin({
  meta: { name: 'local' },
  rules: { 'no-comments': noComments, 'no-nested-calls': noNestedCalls },
})
