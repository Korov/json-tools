const MAX_SAFE_INTEGER = 9007199254740991n;
const PLACEHOLDER_PREFIX = '__JSON_TOOLS_BIGINT_PRESERVE_';
const PLACEHOLDER_SUFFIX = '__';

export type FormatJsonOptions = {
    indent: number;
    preserveLargeIntegers: boolean;
    insertFinalNewline: boolean;
};

export function formatJsonText(text: string, options: FormatJsonOptions): string {
    const preprocessed = options.preserveLargeIntegers ? preprocessJson(text) : text;
    const jsonObj = JSON.parse(preprocessed);
    const formatted = options.indent > 0 ? JSON.stringify(jsonObj, null, options.indent) : JSON.stringify(jsonObj);
    const postprocessed = options.preserveLargeIntegers ? postprocessJson(formatted) : formatted;
    return options.insertFinalNewline ? appendFinalNewline(postprocessed) : postprocessed;
}

export function preprocessJson(text: string): string {
    const jsonTokenRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

    return text.replace(jsonTokenRegex, (match) => {
        if (match.startsWith('"')) {
            return match;
        }

        if (/^-?\d+$/.test(match)) {
            try {
                const num = BigInt(match);
                if (num > MAX_SAFE_INTEGER || num < -MAX_SAFE_INTEGER) {
                    return `"${PLACEHOLDER_PREFIX}${match}${PLACEHOLDER_SUFFIX}"`;
                }
            } catch (e) {
                // Leave unparsable numeric tokens unchanged so JSON.parse reports the error.
            }
        }
        return match;
    });
}

export function postprocessJson(text: string): string {
    const restoreRegex = new RegExp(`"${PLACEHOLDER_PREFIX}(-?\\d+)${PLACEHOLDER_SUFFIX}"`, 'g');
    return text.replace(restoreRegex, '$1');
}

function appendFinalNewline(text: string): string {
    return text.endsWith('\n') ? text : `${text}\n`;
}
