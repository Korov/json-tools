const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const size = 128;
const pixels = Buffer.alloc(size * size * 4);

const colors = {
    background: [31, 41, 55, 255],
    card: [248, 250, 252, 255],
    blue: [37, 99, 235, 255],
    green: [22, 163, 74, 255],
    amber: [245, 158, 11, 255],
};
const crcTable = Array.from({ length: 256 }, (_, index) => {
    let value = index;

    for (let bit = 0; bit < 8; bit++) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    return value >>> 0;
});

function setPixel(x, y, color) {
    if (x < 0 || x >= size || y < 0 || y >= size) {
        return;
    }

    const offset = (y * size + x) * 4;
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = color[3];
}

function fillRect(x, y, width, height, color) {
    for (let yy = y; yy < y + height; yy++) {
        for (let xx = x; xx < x + width; xx++) {
            setPixel(xx, yy, color);
        }
    }
}

function fillRoundedRect(x, y, width, height, radius, color) {
    for (let yy = y; yy < y + height; yy++) {
        for (let xx = x; xx < x + width; xx++) {
            const left = x + radius;
            const right = x + width - radius - 1;
            const top = y + radius;
            const bottom = y + height - radius - 1;
            const cornerX = xx < left ? left : xx > right ? right : xx;
            const cornerY = yy < top ? top : yy > bottom ? bottom : yy;
            const dx = xx - cornerX;
            const dy = yy - cornerY;

            if (dx * dx + dy * dy <= radius * radius) {
                setPixel(xx, yy, color);
            }
        }
    }
}

function fillCircle(cx, cy, radius, color) {
    for (let yy = cy - radius; yy <= cy + radius; yy++) {
        for (let xx = cx - radius; xx <= cx + radius; xx++) {
            const dx = xx - cx;
            const dy = yy - cy;
            if (dx * dx + dy * dy <= radius * radius) {
                setPixel(xx, yy, color);
            }
        }
    }
}

function fillPolygon(points, color) {
    const minX = Math.floor(Math.min(...points.map(point => point[0])));
    const maxX = Math.ceil(Math.max(...points.map(point => point[0])));
    const minY = Math.floor(Math.min(...points.map(point => point[1])));
    const maxY = Math.ceil(Math.max(...points.map(point => point[1])));

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (isInsidePolygon(x + 0.5, y + 0.5, points)) {
                setPixel(x, y, color);
            }
        }
    }
}

function isInsidePolygon(x, y, points) {
    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersects) {
            inside = !inside;
        }
    }

    return inside;
}

function drawBrace(x, mirror) {
    const sign = mirror ? -1 : 1;
    fillRect(x, 39, 9, 18, colors.blue);
    fillRect(x, 80, 9, 18, colors.blue);
    fillRect(x + sign * 8, 39, 14, 9, colors.blue);
    fillRect(x + sign * 8, 89, 14, 9, colors.blue);
    fillRect(x + sign * 8, 62, 14, 9, colors.blue);
    fillRect(x + sign * 8, 66, 14, 9, colors.blue);
    fillCircle(x + sign * 8, 57, 8, colors.blue);
    fillCircle(x + sign * 8, 80, 8, colors.blue);
}

fillRoundedRect(0, 0, 128, 128, 24, colors.background);
fillRoundedRect(18, 18, 92, 92, 14, colors.card);

drawBrace(38, false);
drawBrace(81, true);

fillRoundedRect(57, 82, 27, 8, 4, colors.green);
fillPolygon([
    [66, 45],
    [54, 70],
    [67, 70],
    [61, 91],
    [80, 62],
    [66, 62],
    [74, 45],
], colors.amber);

const raw = Buffer.alloc((size * 4 + 1) * size);
for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
}

const output = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    createChunk('IHDR', Buffer.from([
        0x00, 0x00, 0x00, size,
        0x00, 0x00, 0x00, size,
        0x08, 0x06, 0x00, 0x00, 0x00,
    ])),
    createChunk('IDAT', zlib.deflateSync(raw)),
    createChunk('IEND', Buffer.alloc(0)),
]);

const outputPath = path.join(__dirname, '..', 'images', 'icon.png');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

function createChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
    let crc = 0xffffffff;

    for (const byte of buffer) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
    }

    return (crc ^ 0xffffffff) >>> 0;
}
