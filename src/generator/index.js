
import { errorMessages } from '../errors/index.js';

export const codeGenerator = (node) => {
  if (!node) return '';
  switch (node.type) {
    case 'Program':
      return (node.body || [])
        .map((child) => codeGenerator(child))
        .join('\n');

    case 'ExpressionStatement':
      return codeGenerator(node.expression) + ';';

    case 'CallExpression': {
      const callee = typeof node.callee === 'string'
        ? node.callee
        : (node.callee ? codeGenerator(node.callee) : node.name);

      const args = (node.arguments || node.params || [])
        .map((arg) => codeGenerator(arg))
        .join(', ');

      return `${callee}(${args})`;
    }

    case 'Identifier':
      return node.name;

    case 'NumberLiteral':
      return node.value;

    case 'StringLiteral':
      return JSON.stringify(node.value);

    default:
      errorMessages.unknownNodeType(node.type, 'CodeGenerator');
  }
};