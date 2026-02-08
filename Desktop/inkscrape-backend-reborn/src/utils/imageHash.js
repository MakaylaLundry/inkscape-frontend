const path = require("path");

const HASH_BITS = 64;
const HASH_HEX_LENGTH = HASH_BITS / 4; // 16 hex chars for 64 bits
const HASH_PREFIX_LENGTH = 4; // first 4 hex chars => 16-bit bucket
const HASH_ALGO = "phash";
const HASH_VERSION = 1;

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".gif",
  ".tif",
  ".tiff",
  ".avif",
  ".heic",
  ".heif"
]);

function isImageFile({ mimeType, fileName }) {
  if (typeof mimeType === "string" && mimeType.toLowerCase().startsWith("image/")) {
    return true;
  }

  if (typeof fileName === "string" && fileName.trim()) {
    const extension = path.extname(fileName).toLowerCase();
    return IMAGE_EXTENSIONS.has(extension);
  }

  return false;
}

function normalizeHashHex(hashValue) {
  if (typeof hashValue !== "string") {
    return null;
  }

  const normalized = hashValue.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized)) {
    return null;
  }

  if (normalized.length === HASH_HEX_LENGTH) {
    return normalized;
  }

  if (normalized.length > HASH_HEX_LENGTH) {
    return normalized.slice(0, HASH_HEX_LENGTH);
  }

  return normalized.padStart(HASH_HEX_LENGTH, "0");
}

function buildStoredHash(hashValue) {
  const normalized = normalizeHashHex(hashValue);
  if (!normalized) {
    return null;
  }

  return {
    value: normalized,
    bits: HASH_BITS,
    prefix: normalized.slice(0, HASH_PREFIX_LENGTH),
    algo: HASH_ALGO,
    version: HASH_VERSION
  };
}

function dct1d(values) {
  const size = values.length;
  const output = new Array(size).fill(0);
  const factor = Math.PI / (2 * size);

  for (let u = 0; u < size; u += 1) {
    let sum = 0;
    for (let x = 0; x < size; x += 1) {
      sum += values[x] * Math.cos((2 * x + 1) * u * factor);
    }

    const scale = u === 0 ? Math.sqrt(1 / size) : Math.sqrt(2 / size);
    output[u] = scale * sum;
  }

  return output;
}

function computePHashFromRaw(rawPixels, size) {
  // rawPixels is a 1D grayscale buffer (length = size*size)
  const matrix = [];
  for (let y = 0; y < size; y += 1) {
    const row = rawPixels.slice(y * size, (y + 1) * size);
    matrix.push(dct1d(row));
  }

  // DCT over columns
  for (let x = 0; x < size; x += 1) {
    const column = [];
    for (let y = 0; y < size; y += 1) {
      column.push(matrix[y][x]);
    }

    const transformed = dct1d(column);
    for (let y = 0; y < size; y += 1) {
      matrix[y][x] = transformed[y];
    }
  }

  // Collect top-left 8x8 DCT coefficients, excluding DC (0,0) for median calc
  const coefficients = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      if (x === 0 && y === 0) {
        continue;
      }
      coefficients.push(matrix[y][x]);
    }
  }

  const sorted = [...coefficients].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;

  // Build 64-bit hash from the 8x8 block.
  // Important: Force DC bit to 0 to avoid brightness dominating the first bit.
  let bitString = "";
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      if (x === 0 && y === 0) {
        bitString += "0";
        continue;
      }
      bitString += matrix[y][x] > median ? "1" : "0";
    }
  }

  const bigintValue = BigInt(`0b${bitString}`);
  return bigintValue.toString(16).padStart(HASH_HEX_LENGTH, "0");
}

let warnedSharpMissing = false;

async function computePHashWithSharp(filePath) {
  let sharp;

  try {
    // Lazy-load so the app can still boot even if sharp isn't available.
    sharp = require("sharp");
  } catch (_error) {
    if (!warnedSharpMissing) {
      warnedSharpMissing = true;
      // eslint-disable-next-line no-console
      console.warn("[imageHash] sharp not available; perceptual hashing disabled.");
    }
    return null;
  }

  const size = 32;
  const rawPixels = await sharp(filePath, { failOn: "none" })
    .grayscale()
    .resize(size, size, { fit: "fill" })
    .raw()
    .toBuffer();

  return computePHashFromRaw(rawPixels, size);
}

async function computeImagePHash(filePath, fileMeta = {}) {
  if (!isImageFile(fileMeta)) {
    return null;
  }

  try {
    const hashHex = await computePHashWithSharp(filePath);
    return buildStoredHash(hashHex);
  } catch (_error) {
    return null;
  }
}

function hammingDistanceHex(leftHex, rightHex) {
  if (typeof leftHex !== "string" || typeof rightHex !== "string") {
    return null;
  }

  const left = normalizeHashHex(leftHex);
  const right = normalizeHashHex(rightHex);
  if (!left || !right || left.length !== right.length) {
    return null;
  }

  let distance = 0;
  for (let i = 0; i < left.length; i += 1) {
    const xor = parseInt(left[i], 16) ^ parseInt(right[i], 16);

    if (xor === 0) continue;
    if (xor === 1 || xor === 2 || xor === 4 || xor === 8) {
      distance += 1;
      continue;
    }
    if (xor === 3 || xor === 5 || xor === 6 || xor === 9 || xor === 10 || xor === 12) {
      distance += 2;
      continue;
    }
    if (xor === 7 || xor === 11 || xor === 13 || xor === 14) {
      distance += 3;
      continue;
    }
    distance += 4;
  }

  return distance;
}

function similarityPercentFromHamming(hammingDistance, bits = HASH_BITS) {
  if (!Number.isFinite(hammingDistance) || !Number.isFinite(bits) || bits <= 0) {
    return null;
  }

  const raw = (1 - hammingDistance / bits) * 100;

  if (raw <= 0) return 0;
  if (raw >= 100) return 100;

  return Number(raw.toFixed(2));
}

module.exports = {
  HASH_ALGO,
  HASH_BITS,
  HASH_PREFIX_LENGTH,
  HASH_VERSION,
  buildStoredHash,
  computeImagePHash,
  hammingDistanceHex,
  isImageFile,
  similarityPercentFromHamming
};
