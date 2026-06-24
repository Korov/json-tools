# Changelog

All notable changes to JSON Tools z will be documented in this file.

## 0.0.8

- Move the cursor and viewport to the formatted range start after formatting.

## 0.0.5

- Add JSON5 parsing and normalized JSON5 output.
- Preserve large integer literals when formatting or minifying JSON.
- Add automated tests for large integer handling.
- Add GitHub Actions CI.
- Add extension configuration options for indentation, large integer preservation,
  and final newlines.
- Improve invalid JSON handling so edits are only applied after all selected
  ranges are validated.
- Add Marketplace release metadata and assets.
