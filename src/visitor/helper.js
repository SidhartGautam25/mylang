export const VISITOR_UTILS = {
    NumberLiteral: {
        enter(node, parent , contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            currentStack.push({
                type: 'NumberLiteral',
                value: node.value
            });
        }
    },
    StringLiteral: {
        enter(node, parent , contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            currentStack.push({
                type: 'StringLiteral',
                value: node.value
            });
        }
    },
    Identifier: {
        enter(node, parent, contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            currentStack.push({
                type: 'Identifier',
                name: node.name
            });
        }
    },
    CallExpression: {
        enter(node, parent, contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            let expression = {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: node.name || (node.callee && node.callee.name)
                },
                arguments: []
            };

            const nextContext = expression.arguments;

            if (!parent || parent.type !== 'CallExpression') {
                expression = {
                    type: 'ExpressionStatement',
                    expression: expression
                };
            }

            currentStack.push(expression);
            contextStack.push(nextContext);
        },
        exit(node, parent, contextStack) {
            contextStack.pop();
        }
    },
    exitCallExpression: (node, parent, contextStack) => {
        const stack = Array.isArray(node) ? node : contextStack;
        if (stack && stack.length > 0) {
            stack.pop();
        }
    }
};        
       