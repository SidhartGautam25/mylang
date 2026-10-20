
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
      let callee = typeof node.callee === 'string'
        ? node.callee
        : (node.callee ? codeGenerator(node.callee) : node.name);

      if (callee === 'print') {
        callee = 'console.log';
      }

      const args = (node.arguments || node.params || [])
        .map((arg) => codeGenerator(arg))
        .join(', ');

      return `${callee}(${args})`;
    }

    case 'BinaryExpression': {
      const left = codeGenerator(node.left);
      const right = codeGenerator(node.right);
      return `${left} ${node.operator} ${right}`;
    }

    case 'Identifier':
      return node.name;

    case 'NumberLiteral':
      return node.value;

    case 'StringLiteral':
      return JSON.stringify(node.value);

    case 'VariableDeclaration': {
      const kind = node.kind || 'let';
      if (node.declarations && node.declarations.length > 0) {
        const decls = node.declarations.map(codeGenerator).join(', ');
        return `${kind} ${decls};`;
      }
      const id = node.id ? codeGenerator(node.id) : node.name;
      const init = node.init ? ` = ${codeGenerator(node.init)}` : '';
      return `${kind} ${id}${init};`;
    }

    case 'VariableDeclarator': {
      const id = codeGenerator(node.id);
      const init = node.init ? ` = ${codeGenerator(node.init)}` : '';
      return `${id}${init}`;
    }

    case 'FunctionDeclaration': {
      const name = typeof node.id === 'string' ? node.id : (node.id ? codeGenerator(node.id) : node.name);
      const params = (node.params || []).map((p) => typeof p === 'string' ? p : (p.name || codeGenerator(p))).join(', ');
      const body = codeGenerator(node.body);
      return `function ${name}(${params}) ${body}`;
    }

    case 'BlockStatement': {
      if (!node.body || node.body.length === 0) {
        return '{\n}';
      }
      const inner = node.body
        .map((child) => codeGenerator(child))
        .join('\n')
        .split('\n')
        .map((line) => line.length > 0 ? '  ' + line : line)
        .join('\n');
      return `{\n${inner}\n}`;
    }

    case 'ReturnStatement': {
      const arg = node.argument ? ` ${codeGenerator(node.argument)}` : '';
      return `return${arg};`;
    }

    case 'Parameter':
      return node.name;

    default:
      errorMessages.unknownNodeType(node.type, 'CodeGenerator');
  }
};