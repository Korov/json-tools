# JSON Tools z

JSON Tools z is a small VS Code extension for formatting and minifying JSON.
It focuses on one practical edge case that generic JSON formatters can get
wrong in JavaScript: preserving integer values that are larger than
`Number.MAX_SAFE_INTEGER`.

## Features

- Pretty print JSON with 4-space indentation.
- Minify JSON by removing unnecessary whitespace.
- Preserve large integer literals while formatting or minifying JSON.
- Format the selected range, or the whole document when nothing is selected.

## Why large integer preservation matters

JavaScript stores JSON numbers as `number` values when using `JSON.parse`.
Integer values outside the safe range can lose precision if they are parsed and
stringified directly.

Input:

```json
{"id":9007199254740993123,"name":"example"}
```

Pretty print output:

```json
{
    "id": 9007199254740993123,
    "name": "example"
}
```

The `id` value remains a JSON number literal instead of being rounded.

## Commands

- `JSON Tools: Pretty Print`: Format JSON with 4 spaces indentation.
  - Mac: `Cmd+Alt+M`
  - Windows/Linux: `Ctrl+Alt+M`
- `JSON Tools: Minify`: Remove all whitespace from JSON.
  - `Alt+M`

## Configuration

The extension contributes these VS Code settings:

- `jsonTools.indentSize`: Number of spaces used by the pretty print command.
  Defaults to `4`.
- `jsonTools.preserveLargeIntegers`: Preserve integer literals outside
  JavaScript's safe integer range. Defaults to `true`.
- `jsonTools.insertFinalNewline`: Insert a final newline after formatting or
  minifying JSON. Defaults to `false`.

## Installation

This extension can be installed from a packaged VSIX file during development:

```bash
npm install
npx @vscode/vsce package
```

Then install the generated `.vsix` file with VS Code's "Install from VSIX..."
command.

## Release packaging

Marketplace release assets live in `images/`. The extension manifest uses
`images/icon.png` as the published icon, and `images/icon.svg` is kept as the
editable source artwork.

Before publishing a release, run:

```bash
npm test
npx @vscode/vsce package
```

The `.vscodeignore` file excludes source-only files, tests, CI configuration,
generated source maps, local editor settings, and old `.vsix` packages from the
published extension archive.

## Development

```bash
npm install
npm run compile
```

For extension debugging, open this repository in VS Code and press `F5`.

## Project status

The extension currently supports standard JSON. JSON5 features such as comments,
trailing commas, and unquoted property names are not supported yet.

Planned maintenance work includes automated tests for large integer handling,
GitHub Actions CI, Marketplace release assets, and configurable formatting
options.

## Contributing

Issues and pull requests are welcome. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for local setup and packaging notes.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE)
for details.
