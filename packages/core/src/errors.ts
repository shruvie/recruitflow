/**
 * One error taxonomy across every entry point, so HTTP, AI tools, and MCP tools
 * report failures identically.
 */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE: 'UNPROCESSABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  INTERNAL: 'INTERNAL',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ERROR_STATUS: Readonly<Record<ErrorCode, number>> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  PROVIDER_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export interface ErrorDetail {
  path?: string;
  message: string;
  [key: string]: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[];
  readonly meta: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    options: { details?: ErrorDetail[]; meta?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = options.details ?? [];
    this.meta = options.meta ?? {};
    Error.captureStackTrace?.(this, AppError);
  }

  static validation(message: string, details: ErrorDetail[] = []): AppError {
    return new AppError(ErrorCode.VALIDATION_FAILED, message, { details });
  }

  static unauthenticated(message = 'Authentication required'): AppError {
    return new AppError(ErrorCode.UNAUTHENTICATED, message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message);
  }

  /**
   * Also the correct response for a resource that exists in another tenant.
   * A 403 there would confirm the resource exists, which is itself a disclosure.
   */
  static notFound(resource: string, id?: string): AppError {
    return new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, {
      meta: id ? { id } : {},
    });
  }

  static conflict(message: string, meta: Record<string, unknown> = {}): AppError {
    return new AppError(ErrorCode.CONFLICT, message, { meta });
  }

  /** Valid input, invalid domain transition. */
  static unprocessable(message: string, meta: Record<string, unknown> = {}): AppError {
    return new AppError(ErrorCode.UNPROCESSABLE, message, { meta });
  }

  static rateLimited(message: string, meta: Record<string, unknown> = {}): AppError {
    return new AppError(ErrorCode.RATE_LIMITED, message, { meta });
  }

  static providerUnavailable(provider: string, cause?: unknown): AppError {
    return new AppError(ErrorCode.PROVIDER_UNAVAILABLE, `${provider} is currently unavailable`, {
      meta: { provider },
      cause,
    });
  }

  static internal(message = 'An unexpected error occurred', cause?: unknown): AppError {
    return new AppError(ErrorCode.INTERNAL, message, { cause });
  }

  toJSON(): { code: ErrorCode; message: string; details: ErrorDetail[] } {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
