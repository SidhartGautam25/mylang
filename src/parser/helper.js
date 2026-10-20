import { errorMessages } from '../errors/index.js';

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

        if (!nameToken || nameToken.type !== 'name') {
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
    parseExpression: (tokens, current, source = tokens?.source) => {
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

        if (token.type === 'name') {
            const nextToken = tokens[cursor.current + 1];
            if (nextToken && nextToken.type === 'paren' && nextToken.value === '(') {
                return PARSER_UTILS.parseCallExpression(tokens, cursor, source);
            }
            cursor.current++;
            return PARSER_UTILS.parseIdentifier(token);
        }

        errorMessages.syntaxError('Unexpected token: ' + token.type + ' (' + token.value + ')', token, cursor.current, source);
    },
    parseProgram: (tokens, current = 0, source = tokens?.source) => {
        const cursor = typeof current === 'object' && current !== null ? current : { current: current || 0 };
        const ast = {
            type: 'Program',
            body: []
        };

        while (cursor.current < tokens.length) {
            // Skip semicolons if present as empty statements
            if (tokens[cursor.current].type === 'semicolon') {
                cursor.current++;
                continue;
            }

            const token = tokens[cursor.current];

            if (token.type === 'name') {
                const nextToken = tokens[cursor.current + 1];
                if (nextToken && nextToken.type === 'paren' && nextToken.value === '(') {
                    const callExpression = PARSER_UTILS.parseCallExpression(tokens, cursor, source);
                    ast.body.push(callExpression);
                } else {
                    ast.body.push(PARSER_UTILS.parseIdentifier(token));
                    cursor.current++;
                }
            } else if (token.type === 'number') {
                ast.body.push(PARSER_UTILS.parseNumberLiteral(token));
                cursor.current++;
            } else if (token.type === 'string') {
                ast.body.push(PARSER_UTILS.parseStringLiteral(token));
                cursor.current++;
            } else {
                errorMessages.syntaxError(
                    'Unexpected token type at program level: ' + token.type, token, cursor.current, source);
            }

            // Consume optional trailing semicolon for the statement
            if (cursor.current < tokens.length && tokens[cursor.current].type === 'semicolon') {
                cursor.current++;
            }
        }

        return ast;
    }
};