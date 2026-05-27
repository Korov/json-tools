import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('JSON Tools is now active!');

    let prettyDisposable = vscode.commands.registerCommand('json-tools.pretty', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            processJson(editor, 4);
        }
    });

    let minifyDisposable = vscode.commands.registerCommand('json-tools.minify', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            processJson(editor, 0);
        }
    });

    context.subscriptions.push(prettyDisposable);
    context.subscriptions.push(minifyDisposable);
}

function processJson(editor: vscode.TextEditor, indent: number) {
    const document = editor.document;
    const selections = editor.selections;

    // If no text is selected, select the entire document
    let textRanges: vscode.Range[] = selections.filter(s => !s.isEmpty);
    if (textRanges.length === 0) {
        textRanges = [new vscode.Range(0, 0, document.lineCount, 0)];
    }

    editor.edit(editBuilder => {
        textRanges.forEach(range => {
            const text = document.getText(range);
            try {
                const preprocessed = preprocessJson(text);
                const jsonObj = JSON.parse(preprocessed);
                const formatted = indent > 0 ? JSON.stringify(jsonObj, null, indent) : JSON.stringify(jsonObj);
                const postprocessed = postprocessJson(formatted);
                editBuilder.replace(range, postprocessed);
            } catch (e) {
                vscode.window.showErrorMessage('Invalid JSON: ' + (e as Error).message);
            }
        });
    });
}

const PLACEHOLDER_PREFIX = '__JSON_TOOLS_BIGINT_PRESERVE_';
const PLACEHOLDER_SUFFIX = '__';

function preprocessJson(text: string): string {
    // Regex that matches either JSON strings or numbers
    const jsonTokenRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    
    return text.replace(jsonTokenRegex, (match) => {
        // If it's a string token (starts with double quote), return it unchanged
        if (match.startsWith('"')) {
            return match;
        }
        
        // If it's a number token, check if it's an integer exceeding safe limits
        if (/^-?\d+$/.test(match)) {
            try {
                const num = BigInt(match);
                if (num > 9007199254740991n || num < -9007199254740991n) {
                    return `"${PLACEHOLDER_PREFIX}${match}${PLACEHOLDER_SUFFIX}"`;
                }
            } catch (e) {
                // Ignore any parsing errors and leave it as is
            }
        }
        return match;
    });
}

function postprocessJson(text: string): string {
    const restoreRegex = new RegExp(`"${PLACEHOLDER_PREFIX}(-?\\d+)${PLACEHOLDER_SUFFIX}"`, 'g');
    return text.replace(restoreRegex, '$1');
}

export function deactivate() { }

