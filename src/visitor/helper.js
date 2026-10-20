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
            let calleeName = node.name || (node.callee && node.callee.name);
            if (calleeName === 'print') {
                calleeName = 'console.log';
            }
            let expression = {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: calleeName
                },
                arguments: []
            };

            const nextContext = expression.arguments;

            if (!parent || parent.type === 'Program' || parent.type === 'BlockStatement') {
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
    VariableDeclaration: {
        enter(node, parent, contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            const varDecl = {
                type: 'VariableDeclaration',
                kind: 'let',
                varType: node.varType,
                declarations: [
                    {
                        type: 'VariableDeclarator',
                        id: {
                            type: 'Identifier',
                            name: node.name
                        },
                        init: null
                    }
                ]
            };
            currentStack.push(varDecl);

            const initHolder = [];
            contextStack.push(initHolder);
        },
        exit(node, parent, contextStack) {
            const initHolder = contextStack.pop();
            const currentStack = contextStack[contextStack.length - 1];
            const varDecl = currentStack[currentStack.length - 1];
            if (varDecl && varDecl.declarations && varDecl.declarations[0]) {
                varDecl.declarations[0].init = initHolder[0] || null;
            }
        }
    },
    FunctionDeclaration: {
        enter(node, parent, contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            const funcDecl = {
                type: 'FunctionDeclaration',
                id: {
                    type: 'Identifier',
                    name: node.name
                },
                returnType: node.returnType,
                params: (node.params || []).map((p) => ({
                    type: 'Identifier',
                    name: p.name,
                    paramType: p.paramType
                })),
                body: {
                    type: 'BlockStatement',
                    body: []
                }
            };
            currentStack.push(funcDecl);
            contextStack.push(funcDecl.body.body);
        },
        exit(node, parent, contextStack) {
            contextStack.pop();
        }
    },
    ReturnStatement: {
        enter(node, parent, contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            const retStmt = {
                type: 'ReturnStatement',
                argument: null
            };
            currentStack.push(retStmt);
            const argHolder = [];
            contextStack.push(argHolder);
        },
        exit(node, parent, contextStack) {
            const argHolder = contextStack.pop();
            const currentStack = contextStack[contextStack.length - 1];
            const retStmt = currentStack[currentStack.length - 1];
            if (retStmt && retStmt.type === 'ReturnStatement') {
                retStmt.argument = argHolder[0] || null;
            }
        }
    },
    BinaryExpression: {
        enter(node, parent, contextStack) {
            const currentStack = contextStack[contextStack.length - 1];
            const binExpr = {
                type: 'BinaryExpression',
                operator: node.operator,
                left: null,
                right: null,
                parenthesized: Boolean(node.parenthesized)
            };

            if (!parent || parent.type === 'Program' || parent.type === 'BlockStatement') {
                currentStack.push({
                    type: 'ExpressionStatement',
                    expression: binExpr
                });
            } else {
                currentStack.push(binExpr);
            }

            const childHolder = [];
            contextStack.push(childHolder);
        },
        exit(node, parent, contextStack) {
            const childHolder = contextStack.pop();
            const currentStack = contextStack[contextStack.length - 1];
            let binExpr = currentStack[currentStack.length - 1];
            if (binExpr && binExpr.type === 'ExpressionStatement') {
                binExpr = binExpr.expression;
            }
            if (binExpr && binExpr.type === 'BinaryExpression') {
                binExpr.left = childHolder[0] || null;
                binExpr.right = childHolder[1] || null;
            }
        }
    },
    exitCallExpression: (node, parent, contextStack) => {
        const stack = Array.isArray(node) ? node : contextStack;
        if (stack && stack.length > 0) {
            stack.pop();
        }
    }
};        
       