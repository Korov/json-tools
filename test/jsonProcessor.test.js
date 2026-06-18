const assert = require('node:assert/strict');
const test = require('node:test');

const { formatJsonText } = require('../out/jsonProcessor');

test('pretty prints JSON while preserving positive large integers', () => {
    const input = '{"id":9007199254740993123,"name":"example"}';

    assert.equal(
        formatJsonText(input, 4),
        '{\n    "id": 9007199254740993123,\n    "name": "example"\n}'
    );
});

test('pretty prints JSON while preserving negative large integers', () => {
    const input = '{"id":-9007199254740993123}';

    assert.equal(
        formatJsonText(input, 4),
        '{\n    "id": -9007199254740993123\n}'
    );
});

test('minifies JSON while preserving large integers', () => {
    const input = '{\n    "id": 9007199254740993123,\n    "nested": {\n        "value": -9007199254740993123\n    }\n}';

    assert.equal(
        formatJsonText(input, 0),
        '{"id":9007199254740993123,"nested":{"value":-9007199254740993123}}'
    );
});

test('does not treat numeric strings as large integer placeholders', () => {
    const input = '{"id":"9007199254740993123","note":"keep as text"}';

    assert.equal(
        formatJsonText(input, 4),
        '{\n    "id": "9007199254740993123",\n    "note": "keep as text"\n}'
    );
});

test('keeps safe integers as regular JSON numbers', () => {
    const input = '{"max":9007199254740991,"min":-9007199254740991}';

    assert.equal(
        formatJsonText(input, 0),
        '{"max":9007199254740991,"min":-9007199254740991}'
    );
});
