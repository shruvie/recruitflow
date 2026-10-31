import { AppError } from './errors';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
/**
 * Offset pagination is supported only where a UI genuinely needs page numbers,
 * and capped: `OFFSET 200000` makes Postgres walk 200 000 rows to discard them.
 */
export const MAX_OFFSET = 10_000;
/** Above this, `meta.total` is an estimate — an exact COUNT on a large filtered set is the
 *  single most common cause of a slow "fast" list endpoint. */
export const EXACT_COUNT_THRESHOLD = 5_000;

export interface CursorPage<T> {
  data: T[];
  meta: { hasMore: boolean; total?: number; totalIsEstimate?: boolean };
  links: { next?: string };
}

export interface CursorParams {
  limit: number;
  cursor?: string;
  withTotal?: boolean;
}

/** Opaque to clients; encodes the sort key plus the id tiebreaker. */
export interface CursorPayload {
  /** ISO date, numeric string, or text — whatever the sort column holds. */
  k: string;
  /** UUID tiebreaker, so rows with an identical sort key still paginate deterministically. */
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as CursorPayload).k !== 'string' ||
      typeof (parsed as CursorPayload).id !== 'string'
    ) {
      throw new Error('malformed cursor payload');
    }
    return parsed as CursorPayload;
  } catch (cause) {
    throw AppError.validation('Invalid cursor', [{ path: 'cursor', message: 'Malformed cursor' }]);
  }
}

export function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(limit) || limit < 1) {
    throw AppError.validation('Invalid limit', [
      { path: 'limit', message: 'Must be a positive integer' },
    ]);
  }
  return Math.min(limit, MAX_PAGE_SIZE);
}

/**
 * Repositories fetch `limit + 1` rows; this trims the extra and reports `hasMore`
 * without a second COUNT query.
 */
export function buildCursorPage<T>(
  rows: T[],
  limit: number,
  toCursor: (row: T) => CursorPayload,
  buildNextLink?: (cursor: string) => string,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];

  const links: CursorPage<T>['links'] = {};
  if (hasMore && last !== undefined && buildNextLink) {
    links.next = buildNextLink(encodeCursor(toCursor(last)));
  }

  return { data, meta: { hasMore }, links };
}

export interface SortSpec<TField extends string = string> {
  field: TField;
  direction: 'asc' | 'desc';
}

/**
 * Sort fields are whitelisted per endpoint: every sortable field must have a
 * supporting index, so arbitrary sort input is refused rather than served slowly.
 */
export function parseSort<TField extends string>(
  raw: string | undefined,
  allowed: readonly TField[],
  fallback: SortSpec<TField>,
): SortSpec<TField> {
  if (!raw) return fallback;
  const direction = raw.startsWith('-') ? 'desc' : 'asc';
  const field = (raw.startsWith('-') ? raw.slice(1) : raw) as TField;
  if (!allowed.includes(field)) {
    throw AppError.validation('Invalid sort field', [
      { path: 'sort', message: `Must be one of: ${allowed.join(', ')}` },
    ]);
  }
  return { field, direction };
}
