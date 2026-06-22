# Contributing to JSON Tools

Thank you for your interest in contributing!

## Feedback

Please use [GitHub Issues](https://github.com/Korov/json-tools/issues) for bug
reports, feature requests, and usage questions. Formatting issues are easiest to
review when they include the input text, expected output, actual output, and the
extension version.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the watch script to compile TypeScript:
   ```bash
   npm run watch
   ```
3. Press `F5` in VS Code to start debugging.

## Packaging

To package the extension for distribution (generate a `.vsix` file):

```bash
npx @vscode/vsce package
```
