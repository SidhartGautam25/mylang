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
                TRAVERSER_UTILS.traverseArray(node.body, node, visitor);
                break;
            case 'CallExpression':
                TRAVERSER_UTILS.traverseArray(node.params || node.arguments, node, visitor);
                break;
            case 'ExpressionStatement':
                TRAVERSER_UTILS.traverseNode(node.expression, node, visitor);
                break;
            case 'NumberLiteral':
            case 'StringLiteral':
            case 'Identifier':
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
