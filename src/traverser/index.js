import { errorMessages } from '../errors/index.js';

export const TRAVERSER_UTILS = {
    traverseNode: (node, parent , visitor) => {
        if (!node) return;
        const method = visitor[node.type];
        if (method && method.enter) {
            method.enter(node, parent);
        }
        switch (node.type) {
            case 'Program':
            case 'BlockStatement':
                TRAVERSER_UTILS.traverseArray(node.body, node, visitor);
                break;
            case 'FunctionDeclaration':
                if (node.id) TRAVERSER_UTILS.traverseNode(node.id, node, visitor);
                TRAVERSER_UTILS.traverseArray(node.params, node, visitor);
                TRAVERSER_UTILS.traverseNode(node.body, node, visitor);
                break;
            case 'VariableDeclaration':
                if (node.declarations) {
                    TRAVERSER_UTILS.traverseArray(node.declarations, node, visitor);
                } else if (node.init) {
                    TRAVERSER_UTILS.traverseNode(node.init, node, visitor);
                }
                break;
            case 'VariableDeclarator':
                if (node.id) TRAVERSER_UTILS.traverseNode(node.id, node, visitor);
                if (node.init) TRAVERSER_UTILS.traverseNode(node.init, node, visitor);
                break;
            case 'ReturnStatement':
                if (node.argument) TRAVERSER_UTILS.traverseNode(node.argument, node, visitor);
                break;
            case 'CallExpression':
                TRAVERSER_UTILS.traverseArray(node.params || node.arguments, node, visitor);
                break;
            case 'BinaryExpression':
                TRAVERSER_UTILS.traverseNode(node.left, node, visitor);
                TRAVERSER_UTILS.traverseNode(node.right, node, visitor);
                break;
            case 'ExpressionStatement':
                TRAVERSER_UTILS.traverseNode(node.expression, node, visitor);
                break;
            case 'NumberLiteral':
            case 'StringLiteral':
            case 'Identifier':
            case 'Parameter':
                break;
            default:
                errorMessages.unknownNodeType(node.type, 'Traverser');
        }

        if (method && method.exit) {
            method.exit(node, parent);
        }

    },
    traverseArray: (array, parent , visitor) => {
        if (Array.isArray(array)) {
            for (const child of array) {
                TRAVERSER_UTILS.traverseNode(child, parent, visitor);
            }
        }
    }
};
export const traverser=(ast, visitor) => {
    TRAVERSER_UTILS.traverseNode(ast, null, visitor);


}
