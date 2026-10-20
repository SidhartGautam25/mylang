import { errorMessages } from './errors/index.js';

const WHITESPACE = /\s/;
const NUMBERS = /[0-9]/;
const IDENTIFIER_START = /[a-zA-Z_]/;
const IDENTIFIER_PART = /[a-zA-Z0-9_]/;

export const tokenizer = (input) => {
    const tokens = [];
    let current = 0;
    let line = 1;
    let column = 1;

    const advance = () => {
        const ch = input[current];
        current++;
        if (ch === '\n') {
            line++;
            column = 1;
        } else {
            column++;
        }
        return ch;
    };

    while (current < input.length) {
        let char = input[current];
        const tokenStart = current;
        const tokenLine = line;
        const tokenColumn = column;

        if (char === '(') {
            tokens.push({
                type: 'paren',
                value: '(',
                start: tokenStart,
                end: tokenStart + 1,
                line: tokenLine,
                column: tokenColumn
            });
            advance();
            continue;
        }

        if (char === ')') {
            tokens.push({
                type: 'paren',
                value: ')',
                start: tokenStart,
                end: tokenStart + 1,
                line: tokenLine,
                column: tokenColumn
            });
            advance();
            continue;
        }

        if (char === ',') {
            tokens.push({
                type: 'comma',
                value: ',',
                start: tokenStart,
                end: tokenStart + 1,
                line: tokenLine,
                column: tokenColumn
            });
            advance();
            continue;
        }

        if (char === ';') {
            tokens.push({
                type: 'semicolon',
                value: ';',
                start: tokenStart,
                end: tokenStart + 1,
                line: tokenLine,
                column: tokenColumn
            });
            advance();
            continue;
        }

        if (WHITESPACE.test(char)) {
            advance();
            continue;
        }

        if (NUMBERS.test(char)) {
            let value = '';
            while (current < input.length && NUMBERS.test(input[current])) {
                value += advance();
            }
            tokens.push({
                type: 'number',
                value,
                start: tokenStart,
                end: current,
                line: tokenLine,
                column: tokenColumn
            });
            continue;
        }

        if (IDENTIFIER_START.test(char)) {
            let value = '';
            while (current < input.length && IDENTIFIER_PART.test(input[current])) {
                value += advance();
            }
            tokens.push({
                type: 'name',
                value,
                start: tokenStart,
                end: current,
                line: tokenLine,
                column: tokenColumn
            });
            continue;
        }

        if (char === '"' || char === '\'') {
            const quote = char;
            let value = '';
            advance(); // skip opening quote
            while (current < input.length && input[current] !== quote) {
                if (input[current] === '\\' && current + 1 < input.length) {
                    advance(); // skip backslash
                }
                value += advance();
            }
            if (current >= input.length || input[current] !== quote) {
                errorMessages.unterminatedString(tokenStart, tokenLine, tokenColumn, input);
            }
            advance(); // skip closing quote
            tokens.push({
                type: 'string',
                value,
                start: tokenStart,
                end: current,
                line: tokenLine,
                column: tokenColumn
            });
            continue;
        }

        errorMessages.unknownCharacter(char, current, line, column, input);
    }

    tokens.source = input;
    return tokens;
};


