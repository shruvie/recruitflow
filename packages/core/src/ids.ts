/**
 * UUIDv7 — time-ordered, so primary keys stay index-local instead of scattering
 * random writes across the B-tree. Generated in the application rather than the
 * database so a service knows an entity's id before it commits.
 *
 * Layout (RFC 9562): 48-bit big-endian unix millis | version 7 | 12 random bits
 * | variant 0b10 | 62 random bits.
 */
export function uuidv7(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const ms = Date.now();

  bytes[0] = Math.floor(ms / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ms / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ms / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ms / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;

  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Extracts the embedded timestamp. Useful in tests and for debugging ordering. */
export function uuidv7Timestamp(id: string): Date {
  const hex = id.replace(/-/g, '').slice(0, 12);
  return new Date(Number.parseInt(hex, 16));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function requestId(): string {
  const uuid =
    typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : uuidv7();
  return `req_${uuid.replace(/-/g, '')}`;
}

/** URL-safe slug within a tenant. Uniqueness is enforced by the database, not here. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
