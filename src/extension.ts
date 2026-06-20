import * as vscode from 'vscode';
import { formatJsonText, FormatJsonOptions } from './jsonProcessor';

export function activate(context: vscode.ExtensionContext) {
    console.log('JSON Tools is now active!');

    const prettyDisposable = vscode.commands.registerCommand('json-tools.pretty', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            processJson(editor, 'pretty');
        }
    });

    const minifyDisposable = vscode.commands.registerCommand('json-tools.minify', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            processJson(editor, 'minify');
        }
    });

    context.subscriptions.push(prettyDisposable);
    context.subscriptions.push(minifyDisposable);
}

type JsonReplacement = {
    range: vscode.Range;
    text: string;
};

type FormatMode = 'pretty' | 'minify';

function processJson(editor: vscode.TextEditor, mode: FormatMode) {
    const document = editor.document;
    const selections = editor.selections;
    const options = getFormatOptions(mode);

    // If no text is selected, select the entire document
    let textRanges: vscode.Range[] = selections.filter(s => !s.isEmpty);
    if (textRanges.length === 0) {
        textRanges = [new vscode.Range(0, 0, document.lineCount, 0)];
    }

    const replacements: JsonReplacement[] = [];
    for (const [index, range] of textRanges.entries()) {
        const text = document.getText(range);
        try {
            replacements.push({
                range,
                text: formatJsonText(text, options),
            });
        } catch (e) {
            vscode.window.showErrorMessage(formatInvalidJsonMessage(e, range, index, textRanges.length));
            return;
        }
    }

    editor.edit(editBuilder => {
        replacements.forEach(replacement => {
            editBuilder.replace(replacement.range, replacement.text);
        });
    });
}

function getFormatOptions(mode: FormatMode): FormatJsonOptions {
    const config = vscode.workspace.getConfiguration('jsonTools');

    return {
        indent: mode === 'pretty' ? normalizeIndentSize(config.get<number>('indentSize', 4)) : 0,
        preserveLargeIntegers: config.get<boolean>('preserveLargeIntegers', true),
        insertFinalNewline: config.get<boolean>('insertFinalNewline', false),
    };
}

function normalizeIndentSize(indentSize: number): number {
    if (!Number.isFinite(indentSize)) {
        return 4;
    }

    return Math.max(1, Math.min(8, Math.floor(indentSize)));
}

function formatInvalidJsonMessage(error: unknown, range: vscode.Range, index: number, total: number): string {
    const reason = error instanceof Error ? error.message : String(error);
    const location = total > 1
        ? `selection ${index + 1} at ${formatPosition(range.start)}`
        : `input at ${formatPosition(range.start)}`;

    return `Invalid JSON in ${location}: ${reason}`;
}

function formatPosition(position: vscode.Position): string {
    return `line ${position.line + 1}, column ${position.character + 1}`;
}

export function deactivate() { }
