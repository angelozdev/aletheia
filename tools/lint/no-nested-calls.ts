import { defineRule, type Context, type ESTree } from '@oxlint/plugins'

const MAX_DEPTH = 2

function callDepth(node: ESTree.Node): number {
  if (node.type === 'AwaitExpression') return Math.max(1, callDepth(node.argument))
  if (node.type === 'ChainExpression') return callDepth(node.expression)
  if (node.type !== 'CallExpression' && node.type !== 'NewExpression') return 0
  return 1 + Math.max(0, ...node.arguments.map(callDepth))
}

function reportTooDeep(context: Context) {
  return (node: ESTree.CallExpression | ESTree.NewExpression) => {
    if (callDepth(node) !== MAX_DEPTH + 1) return
    context.report({
      node,
      message: 'Name an inner result in a const; calls nested three deep are hard to read',
    })
  }
}

export const noNestedCalls = defineRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'A call takes at most one level of calls as its arguments' },
  },
  create(context) {
    const report = reportTooDeep(context)
    return { CallExpression: report, NewExpression: report }
  },
})
