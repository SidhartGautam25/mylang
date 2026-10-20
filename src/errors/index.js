export class CompilerSyntaxError extends SyntaxError {
    constructor(message, details = {}) {
        super(message);
        this.name = 'SyntaxError';
        this.line = details.line;
        this.column = details.column;
        this.token = details.token;
        this.index = details.index;
    }
}

export class CompilerTypeError extends TypeError {
    constructor(message, details = {}) {
        super(message);
        this.name = 'TypeError';
        this.line = details.line;
        this.column = details.column;
        this.token = details.token;
        this.index = details.index;
    }
}

function formatCodeFrame(source, line, column) {
    if (!source || typeof source !== 'string') return '';
    const lines = source.split(/\r?\n/);
    if (!line || line < 1 || line > lines.length) return '';

    const targetLine = lines[line - 1];
    const lineNum = String(line);
    const gutter = ' '.repeat(lineNum.length) + ' | ';
    const codeLine = `\n\n  ${lineNum} | ${targetLine}`;
    const pointerIndent = ' '.repeat(Math.max(0, (column || 1) - 1));
    const pointerLine = `\n  ${gutter}${pointerIndent}^`;

    return `${codeLine}${pointerLine}`;
}

export const errorMessages = {
    syntaxError: (message, token, current, source) => {
        let location = '';
        const line = token?.line;
        const column = token?.column;

        if (token) {
            const posInfo = (line && column) ? ` (line ${line}, col ${column})` : '';
            location = ` at token index ${current} (type: ${token.type}, value: ${JSON.stringify(token.value)})${posInfo}`;
        } else if (typeof current === 'number') {
            location = ` at token index ${current}`;
        }

        const codeFrame = formatCodeFrame(source, line, column);
        throw new CompilerSyntaxError(`Syntax Error: ${message}${location}${codeFrame}`, {
            line,
            column,
            token,
            index: current
        });
    },

    typeError: (message, details = {}) => {
        const { line, column, token, index, source } = details;
        const codeFrame = formatCodeFrame(source, line, column);
        throw new CompilerTypeError(`Type Error: ${message}${codeFrame}`, {
            line,
            column,
            token,
            index
        });
    },

    unterminatedString: (index, line, column, source) => {
        const posInfo = (line && column) ? ` at line ${line}, col ${column}` : (typeof index === 'number' ? ` at index ${index}` : '');
        const codeFrame = formatCodeFrame(source, line, column);
        throw new CompilerSyntaxError(`Syntax Error: Unterminated string literal${posInfo}${codeFrame}`, {
            line,
            column,
            index
        });
    },

    unknownCharacter: (char, index, line, column, source) => {
        const posInfo = (line && column) ? ` at line ${line}, col ${column}` : (typeof index === 'number' ? ` at index ${index}` : '');
        const codeFrame = formatCodeFrame(source, line, column);
        throw new CompilerTypeError(`Type Error: Unknown character: ${char}${posInfo}${codeFrame}`, {
            line,
            column,
            index
        });
    },

    unknownNodeType: (nodeType, phase = 'Compiler') => {
        throw new CompilerTypeError(`[${phase}] Unknown AST node type: ${nodeType}`, {
            nodeType,
            phase
        });
    }
};