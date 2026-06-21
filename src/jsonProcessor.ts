import * as JSON5 from 'json5';

const MAX_SAFE_INTEGER = 9007199254740991n;
const PLACEHOLDER_PREFIX = '__JSON_TOOLS_BIGINT_PRESERVE_';
const PLACEHOLDER_SUFFIX = '__';
const NUMBER_TOKEN_REGEX = /^[+-]?(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
const DECIMAL_INTEGER_REGEX = /^[+-]?\d+$/;
const HEX_INTEGER_REGEX = /^[+-]?0[xX][0-9a-fA-F]+$/;
const IDENTIFIER_START_REGEX = /[A-Za-z_$]/;
const IDENTIFIER_PART_REGEX = /[A-Za-z0-9_$]/;

export type FormatJsonOptions = {
    indent: number;
    preserveLargeIntegers: boolean;
    insertFinalNewline: boolean;
};

export function formatJsonText(text: string, options: FormatJsonOptions): string {
    const preprocessed = options.preserveLargeIntegers ? preprocessJson(text) : text;
    const { value, syntax } = parseJsonText(preprocessed);
    const formatted = stringifyJsonValue(value, syntax, options.indent);
    const postprocessed = options.preserveLargeIntegers ? postprocessJson(formatted) : formatted;
    return options.insertFinalNewline ? appendFinalNewline(postprocessed) : postprocessed;
}

export function preprocessJson(text: string): string {
    let result = '';
    let index = 0;

    while (index < text.length) {
        const char = text[index];
        const nextChar = text[index + 1];

        if (char === '"' || char === "'") {
            const { token, nextIndex } = readStringToken(text, index, char);
            result += token;
            index = nextIndex;
            continue;
        }

        if (char === '/' && (nextChar === '/' || nextChar === '*')) {
            const { token, nextIndex } = readCommentToken(text, index, nextChar);
            result += token;
            index = nextIndex;
            continue;
        }

        if (IDENTIFIER_START_REGEX.test(char)) {
            const { token, nextIndex } = readIdentifierToken(text, index);
            result += token;
            index = nextIndex;
            continue;
        }

        const numberToken = readNumberToken(text, index);
        if (numberToken) {
            result += preserveLargeIntegerToken(numberToken);
            index += numberToken.length;
            continue;
        }

        result += char;
        index++;
    }

    return result;
}

function parseJsonText(text: string): { value: unknown; syntax: 'json' | 'json5' } {
    try {
        return {
            value: JSON.parse(text),
            syntax: 'json',
        };
    } catch (jsonError) {
        try {
            return {
                value: JSON5.parse(text),
                syntax: 'json5',
            };
        } catch (json5Error) {
            throw new SyntaxError(`JSON parse failed: ${formatErrorMessage(jsonError)}; JSON5 parse failed: ${formatErrorMessage(json5Error)}`);
        }
    }
}

function formatErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function stringifyJsonValue(value: unknown, syntax: 'json' | 'json5', indent: number): string {
    if (syntax === 'json5') {
        return indent > 0
            ? JSON5.stringify(value, { space: indent, quote: "'" })
            : JSON5.stringify(value, { quote: "'" });
    }

    return indent > 0 ? JSON.stringify(value, null, indent) : JSON.stringify(value);
}

function readStringToken(text: string, startIndex: number, quote: string): { token: string; nextIndex: number } {
    let index = startIndex + 1;

    while (index < text.length) {
        if (text[index] === '\\') {
            index += 2;
            continue;
        }

        if (text[index] === quote) {
            index++;
            break;
        }

        index++;
    }

    return {
        token: text.slice(startIndex, index),
        nextIndex: index,
    };
}

function readCommentToken(text: string, startIndex: number, commentType: string): { token: string; nextIndex: number } {
    if (commentType === '/') {
        const nextLineIndex = text.indexOf('\n', startIndex + 2);
        const nextIndex = nextLineIndex === -1 ? text.length : nextLineIndex;
        return {
            token: text.slice(startIndex, nextIndex),
            nextIndex,
        };
    }

    const endIndex = text.indexOf('*/', startIndex + 2);
    const nextIndex = endIndex === -1 ? text.length : endIndex + 2;
    return {
        token: text.slice(startIndex, nextIndex),
        nextIndex,
    };
}

function readIdentifierToken(text: string, startIndex: number): { token: string; nextIndex: number } {
    let index = startIndex + 1;

    while (index < text.length && IDENTIFIER_PART_REGEX.test(text[index])) {
        index++;
    }

    return {
        token: text.slice(startIndex, index),
        nextIndex: index,
    };
}

function readNumberToken(text: string, startIndex: number): string | undefined {
    const previousChar = text[startIndex - 1];
    if (previousChar && IDENTIFIER_PART_REGEX.test(previousChar)) {
        return undefined;
    }

    const match = NUMBER_TOKEN_REGEX.exec(text.slice(startIndex));
    return match?.[0];
}

function preserveLargeIntegerToken(token: string): string {
    if (DECIMAL_INTEGER_REGEX.test(token) || HEX_INTEGER_REGEX.test(token)) {
        try {
            const num = BigInt(token);
            if (num > MAX_SAFE_INTEGER || num < -MAX_SAFE_INTEGER) {
                return `"${PLACEHOLDER_PREFIX}${token}${PLACEHOLDER_SUFFIX}"`;
            }
        } catch (e) {
            // Leave unparsable numeric tokens unchanged so the parser reports the error.
        }
    }

    return token;
}

export function postprocessJson(text: string): string {
    const restoreRegex = new RegExp(`["']${PLACEHOLDER_PREFIX}([+-]?(?:0[xX][0-9a-fA-F]+|\\d+))${PLACEHOLDER_SUFFIX}["']`, 'g');
    return text.replace(restoreRegex, '$1');
}

function appendFinalNewline(text: string): string {
    return text.endsWith('\n') ? text : `${text}\n`;
}
