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
                const jsonObj = JSON.parse(text);
                const formatted = indent > 0 ? JSON.stringify(jsonObj, null, indent) : JSON.stringify(jsonObj);
                editBuilder.replace(range, formatted);
            } catch (e) {
                vscode.window.showErrorMessage('Invalid JSON: ' + (e as Error).message);
            }
        });
    });
}

export function deactivate() { }
