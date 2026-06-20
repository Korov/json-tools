const assert = require('node:assert/strict');
const test = require('node:test');

const { formatJsonText } = require('../out/jsonProcessor');

const defaultOptions = {
    indent: 4,
    preserveLargeIntegers: true,
    insertFinalNewline: false,
};

test('pretty prints JSON while preserving positive large integers', () => {
    const input = '{"id":9007199254740993123,"name":"example"}';

    assert.equal(
        formatJsonText(input, defaultOptions),
        '{\n    "id": 9007199254740993123,\n    "name": "example"\n}'
    );
});

test('pretty prints JSON while preserving negative large integers', () => {
    const input = '{"id":-9007199254740993123}';

    assert.equal(
        formatJsonText(input, defaultOptions),
        '{\n    "id": -9007199254740993123\n}'
    );
});

test('minifies JSON while preserving large integers', () => {
    const input = '{\n    "id": 9007199254740993123,\n    "nested": {\n        "value": -9007199254740993123\n    }\n}';

    assert.equal(
        formatJsonText(input, { ...defaultOptions, indent: 0 }),
        '{"id":9007199254740993123,"nested":{"value":-9007199254740993123}}'
    );
});

test('does not treat numeric strings as large integer placeholders', () => {
    const input = '{"id":"9007199254740993123","note":"keep as text"}';

    assert.equal(
        formatJsonText(input, defaultOptions),
        '{\n    "id": "9007199254740993123",\n    "note": "keep as text"\n}'
    );
});

test('keeps safe integers as regular JSON numbers', () => {
    const input = '{"max":9007199254740991,"min":-9007199254740991}';

    assert.equal(
        formatJsonText(input, { ...defaultOptions, indent: 0 }),
        '{"max":9007199254740991,"min":-9007199254740991}'
    );
});

test('uses the configured indentation size', () => {
    const input = '{"name":"example","enabled":true}';

    assert.equal(
        formatJsonText(input, { ...defaultOptions, indent: 2 }),
        '{\n  "name": "example",\n  "enabled": true\n}'
    );
});

test('can disable large integer preservation', () => {
    const input = '{"id":9007199254740993123}';

    assert.equal(
        formatJsonText(input, { ...defaultOptions, preserveLargeIntegers: false }),
        '{\n    "id": 9007199254740993000\n}'
    );
});

test('can insert a final newline', () => {
    const input = '{"name":"example"}';

    assert.equal(
        formatJsonText(input, { ...defaultOptions, insertFinalNewline: true }),
        '{\n    "name": "example"\n}\n'
    );
});
