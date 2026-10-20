import { errorMessages } from '../errors/index.js';

const BINARY_PRECEDENCE = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2
};

export const PARSER_UTILS = {
    parseNumberLiteral: (token) => {
        return {
            type: 'NumberLiteral',
            value: token.value
        };
    },
    parseStringLiteral: (token) => {
        return {
            type: 'StringLiteral',
            value: token.value
        };
    },
    parseIdentifier: (token) => {
        return {
            type: 'Identifier',
            name: token.value
        };
    },
    parseCallExpression: (tokens, current, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        const nameToken = tokens[cursor.current];

        if (!nameToken || (nameToken.type !== 'name' && nameToken.type !== 'keyword')) {
            errorMessages.syntaxError('Expected a function name', nameToken, cursor.current, source);
        }

        const functionName = nameToken.value;
        cursor.current++; // consume function name

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError('Expected opening parenthesis after function name', null, cursor.current, source);
        }

        const openParen = tokens[cursor.current];
        if (!openParen || openParen.type !== 'paren' || openParen.value !== '(') {
            errorMessages.syntaxError('Expected opening parenthesis after function name', openParen, cursor.current, source);
        }
        cursor.current++; // consume '('

        const callExpression = {
            type: 'CallExpression',
            name: functionName,
            params: []
        };

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError('Expected closing parenthesis for function call', null, cursor.current, source);
        }

        // Empty argument list: name()
        if (tokens[cursor.current].type === 'paren' && tokens[cursor.current].value === ')') {
            cursor.current++; // consume ')'
            return callExpression;
        }

        while (cursor.current < tokens.length) {
            const arg = PARSER_UTILS.parseExpression(tokens, cursor, source);
            callExpression.params.push(arg);

            if (cursor.current >= tokens.length) {
                errorMessages.syntaxError('Expected closing parenthesis for function call', null, cursor.current, source);
            }

            const nextToken = tokens[cursor.current];
            if (nextToken.type === 'paren' && nextToken.value === ')') {
                cursor.current++; // consume ')'
                return callExpression;
            } else if (nextToken.type === 'comma') {
                cursor.current++; // consume ','
                if (cursor.current >= tokens.length) {
                    errorMessages.syntaxError('Expected closing parenthesis for function call', null, cursor.current, source);
                }
                // Allow trailing comma: fn(a, b,)
                if (tokens[cursor.current].type === 'paren' && tokens[cursor.current].value === ')') {
                    cursor.current++; // consume ')'
                    return callExpression;
                }
            } else {
                errorMessages.syntaxError(
                    'Expected \',\' or \')\' after argument, but got ' + nextToken.type,
                    nextToken,
                    cursor.current,
                    source
                );
            }
        }

        errorMessages.syntaxError('Expected closing parenthesis for function call', null, cursor.current, source);
    },
    parseVariableDeclaration: (tokens, current, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        cursor.current++; // consume 'make'

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected variable type after 'make'", null, cursor.current, source);
        }

        const typeToken = tokens[cursor.current];
        if (!typeToken || (typeToken.type !== 'name' && typeToken.type !== 'keyword')) {
            errorMessages.syntaxError("Expected variable type after 'make'", typeToken, cursor.current, source);
        }
        const varType = typeToken.value;
        cursor.current++; // consume type

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected variable name after type", null, cursor.current, source);
        }

        const nameToken = tokens[cursor.current];
        if (!nameToken || nameToken.type !== 'name') {
            errorMessages.syntaxError("Expected variable name after type", nameToken, cursor.current, source);
        }
        const varName = nameToken.value;
        cursor.current++; // consume variable name

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected '=' in variable declaration", null, cursor.current, source);
        }

        const eqToken = tokens[cursor.current];
        if (!eqToken || eqToken.type !== 'operator' || eqToken.value !== '=') {
            errorMessages.syntaxError("Expected '=' in variable declaration", eqToken, cursor.current, source);
        }
        cursor.current++; // consume '='

        const init = PARSER_UTILS.parseExpression(tokens, cursor, source);

        if (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
            cursor.current++;
        }

        return {
            type: 'VariableDeclaration',
            varType,
            name: varName,
            id: {
                type: 'Identifier',
                name: varName
            },
            init
        };
    },
    parseFunctionDeclaration: (tokens, current, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        cursor.current++; // consume 'make'
        cursor.current++; // consume 'function'

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected function name after 'make function'", null, cursor.current, source);
        }

        const nameToken = tokens[cursor.current];
        if (!nameToken || nameToken.type !== 'name') {
            errorMessages.syntaxError("Expected function name after 'make function'", nameToken, cursor.current, source);
        }
        const functionName = nameToken.value;
        cursor.current++; // consume function name

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected '(' after function name", null, cursor.current, source);
        }

        const openParen = tokens[cursor.current];
        if (!openParen || openParen.type !== 'paren' || openParen.value !== '(') {
            errorMessages.syntaxError("Expected '(' after function name", openParen, cursor.current, source);
        }
        cursor.current++; // consume '('

        const params = [];
        if (cursor.current < tokens.length && tokens[cursor.current].type === 'paren' && tokens[cursor.current].value === ')') {
            cursor.current++; // consume ')'
        } else {
            while (cursor.current < tokens.length) {
                const paramTypeToken = tokens[cursor.current];
                if (!paramTypeToken || (paramTypeToken.type !== 'name' && paramTypeToken.type !== 'keyword')) {
                    errorMessages.syntaxError("Expected parameter type in function declaration", paramTypeToken, cursor.current, source);
                }
                const paramType = paramTypeToken.value;
                cursor.current++;

                if (cursor.current >= tokens.length) {
                    errorMessages.syntaxError("Expected parameter name after type in function declaration", null, cursor.current, source);
                }

                const paramNameToken = tokens[cursor.current];
                if (!paramNameToken || paramNameToken.type !== 'name') {
                    errorMessages.syntaxError("Expected parameter name after type in function declaration", paramNameToken, cursor.current, source);
                }
                const paramName = paramNameToken.value;
                cursor.current++;

                params.push({
                    type: 'Parameter',
                    paramType,
                    name: paramName
                });

                if (cursor.current >= tokens.length) {
                    errorMessages.syntaxError("Expected ')' or ',' in parameter list", null, cursor.current, source);
                }

                const sep = tokens[cursor.current];
                if (sep.type === 'paren' && sep.value === ')') {
                    cursor.current++; // consume ')'
                    break;
                } else if (sep.type === 'comma') {
                    cursor.current++; // consume ','
                    if (cursor.current < tokens.length && tokens[cursor.current].type === 'paren' && tokens[cursor.current].value === ')') {
                        cursor.current++; // consume ')'
                        break;
                    }
                } else {
                    errorMessages.syntaxError("Expected ',' or ')' after parameter, but got " + sep.type, sep, cursor.current, source);
                }
            }
        }

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected ':' for return type annotation", null, cursor.current, source);
        }

        const colonToken = tokens[cursor.current];
        if (!colonToken || colonToken.type !== 'colon') {
            errorMessages.syntaxError("Expected ':' for return type annotation", colonToken, cursor.current, source);
        }
        cursor.current++; // consume ':'

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected return type after ':'", null, cursor.current, source);
        }

        const returnTypeToken = tokens[cursor.current];
        if (!returnTypeToken || (returnTypeToken.type !== 'name' && returnTypeToken.type !== 'keyword')) {
            errorMessages.syntaxError("Expected return type after ':'", returnTypeToken, cursor.current, source);
        }
        const returnType = returnTypeToken.value;
        cursor.current++; // consume return type

        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError("Expected '{' to start function body", null, cursor.current, source);
        }

        const openBrace = tokens[cursor.current];
        if (!openBrace || openBrace.type !== 'brace' || openBrace.value !== '{') {
            errorMessages.syntaxError("Expected '{' to start function body", openBrace, cursor.current, source);
        }
        cursor.current++; // consume '{'

        const body = [];
        while (cursor.current < tokens.length && !(tokens[cursor.current].type === 'brace' && tokens[cursor.current].value === '}')) {
            const stmt = PARSER_UTILS.parseStatement(tokens, cursor, source);
            if (stmt) {
                body.push(stmt);
            }
        }

        if (cursor.current >= tokens.length || tokens[cursor.current].type !== 'brace' || tokens[cursor.current].value !== '}') {
            errorMessages.syntaxError("Expected '}' to close function body", tokens[cursor.current] || null, cursor.current, source);
        }
        cursor.current++; // consume '}'

        return {
            type: 'FunctionDeclaration',
            name: functionName,
            returnType,
            params,
            body: {
                type: 'BlockStatement',
                body
            }
        };
    },
    parseReturnStatement: (tokens, current, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        cursor.current++; // consume 'return'

        let argument = null;
        if (
            cursor.current < tokens.length &&
            tokens[cursor.current].type !== 'semicolon' &&
            !(tokens[cursor.current].type === 'brace' && tokens[cursor.current].value === '}')
        ) {
            argument = PARSER_UTILS.parseExpression(tokens, cursor, source);
        }

        if (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
            cursor.current++;
        }

        return {
            type: 'ReturnStatement',
            argument
        };
    },
    parsePrimary: (tokens, current, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        if (cursor.current >= tokens.length) {
            errorMessages.syntaxError('Unexpected end of input', null, cursor.current, source);
        }

        const token = tokens[cursor.current];

        if (token.type === 'number') {
            cursor.current++;
            return PARSER_UTILS.parseNumberLiteral(token);
        }

        if (token.type === 'string') {
            cursor.current++;
            return PARSER_UTILS.parseStringLiteral(token);
        }

        if (token.type === 'paren' && token.value === '(') {
            cursor.current++; // consume '('
            const expr = PARSER_UTILS.parseExpression(tokens, cursor, source);
            if (cursor.current >= tokens.length || tokens[cursor.current].type !== 'paren' || tokens[cursor.current].value !== ')') {
                errorMessages.syntaxError("Expected ')' after expression", tokens[cursor.current] || null, cursor.current, source);
            }
            cursor.current++; // consume ')'
            return expr;
        }

        if (token.type === 'name' || token.type === 'keyword') {
            const nextToken = tokens[cursor.current + 1];
            if (nextToken && nextToken.type === 'paren' && nextToken.value === '(') {
                return PARSER_UTILS.parseCallExpression(tokens, cursor, source);
            }
            cursor.current++;
            return PARSER_UTILS.parseIdentifier(token);
        }

        errorMessages.syntaxError('Unexpected token: ' + token.type + ' (' + token.value + ')', token, cursor.current, source);
    },
    parseExpression: (tokens, current, source = tokens?.source, minPrecedence = 0) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        let left = PARSER_UTILS.parsePrimary(tokens, cursor, source);

        while (cursor.current < tokens.length) {
            const token = tokens[cursor.current];
            if (!token || token.type !== 'operator' || !BINARY_PRECEDENCE[token.value]) {
                break;
            }
            const precedence = BINARY_PRECEDENCE[token.value];
            if (precedence < minPrecedence) {
                break;
            }
            const operator = token.value;
            cursor.current++; // consume operator

            const right = PARSER_UTILS.parseExpression(tokens, cursor, source, precedence + 1);
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }

        return left;
    },
    parseStatement: (tokens, current, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };

        while (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
            cursor.current++;
        }

        if (cursor.current >= tokens.length) return null;

        const token = tokens[cursor.current];

        if (token.value === 'make') {
            const nextToken = tokens[cursor.current + 1];
            if (nextToken && nextToken.value === 'function') {
                return PARSER_UTILS.parseFunctionDeclaration(tokens, cursor, source);
            }
            return PARSER_UTILS.parseVariableDeclaration(tokens, cursor, source);
        }

        if (token.value === 'return') {
            return PARSER_UTILS.parseReturnStatement(tokens, cursor, source);
        }

        if (token.type === 'name') {
            const nextToken = tokens[cursor.current + 1];
            if (nextToken && nextToken.type === 'paren' && nextToken.value === '(') {
                const call = PARSER_UTILS.parseCallExpression(tokens, cursor, source);
                if (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
                    cursor.current++;
                }
                return call;
            } else {
                const id = PARSER_UTILS.parseIdentifier(token);
                cursor.current++;
                if (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
                    cursor.current++;
                }
                return id;
            }
        }

        if (token.type === 'number') {
            const num = PARSER_UTILS.parseNumberLiteral(token);
            cursor.current++;
            if (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
                cursor.current++;
            }
            return num;
        }

        if (token.type === 'string') {
            const str = PARSER_UTILS.parseStringLiteral(token);
            cursor.current++;
            if (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
                cursor.current++;
            }
            return str;
        }

        errorMessages.syntaxError(
            'Unexpected token type at program level: ' + token.type, token, cursor.current, source);
    },
    parseProgram: (tokens, current = 0, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        const ast = {
            type: 'Program',
            body: []
        };

        while (cursor.current < tokens.length) {
            const stmt = PARSER_UTILS.parseStatement(tokens, cursor, source);
            if (stmt) {
                ast.body.push(stmt);
            }
        }

        return ast;
    }
};