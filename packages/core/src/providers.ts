/**
 * Provider interfaces. No application service imports a driver — services depend
 * on these, and a DI module binds one implementation per interface, chosen by config.
 * Swapping local disk for S3, or SMTP for SES, is a driver change.
 */

import type { TenantContext } from './tenancy';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export interface StoredObject {
  key: string;
  size: number;
  checksumSha256: string;
}

export interface StorageProvider {
  readonly driver: string;
  /** The key is generated server-side; a client-supplied filename is never a path. */
  put(key: string, body: Buffer, opts: { contentType: string }): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Short-lived, authorized download URL. Buckets are never publicly readable. */
  signedUrl(key: string, opts: { expiresInSeconds: number; fileName?: string }): Promise<string>;
  health(): Promise<HealthStatus>;
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  providerMessageId: string;
  acceptedAt: Date;
}

export interface EmailProvider {
  readonly driver: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
  health(): Promise<HealthStatus>;
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/** Separate queues so a backlog of resume parsing cannot delay interview reminders. */
export const QueueName = {
  DOCUMENTS: 'documents',
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  AUTOMATIONS: 'automations',
  ANALYTICS: 'analytics',
  EVENTS: 'events',
} as const;
export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export interface JobOptions {
  delayMs?: number;
  attempts?: number;
  /** Stable id makes enqueueing idempotent — and makes a job cancellable by key. */
  jobId?: string;
  priority?: number;
}

export interface QueueProvider {
  readonly driver: string;
  enqueue<T>(queue: QueueName, name: string, payload: T, opts?: JobOptions): Promise<string>;
  /** Used to cancel interview reminders on reschedule or cancellation. */
  cancel(queue: QueueName, jobId: string): Promise<void>;
  health(): Promise<HealthStatus>;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

export interface CacheProvider {
  readonly driver: string;
  /**
   * Implementations MUST tenant-prefix keys. A cache leak never reaches the
   * database, so no RLS policy will catch it.
   */
  get<T>(ctx: TenantContext, key: string): Promise<T | null>;
  set<T>(ctx: TenantContext, key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(ctx: TenantContext, key: string): Promise<void>;
  deletePrefix(ctx: TenantContext, prefix: string): Promise<void>;
  health(): Promise<HealthStatus>;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchHit {
  entityType: string;
  entityId: string;
  title: string;
  snippet?: string;
  score: number;
}

export interface SearchQuery {
  q: string;
  types?: string[];
  limit: number;
}

export interface SearchProvider {
  readonly driver: string;
  search(ctx: TenantContext, query: SearchQuery): Promise<SearchHit[]>;
  health(): Promise<HealthStatus>;
}

// ---------------------------------------------------------------------------
// Auth — RESERVED
// ---------------------------------------------------------------------------

export interface Principal {
  userId: string;
  organizationId: string;
  /** Whatever subject claim the identity provider issues; stored on `users.auth_subject`. */
  authSubject?: string;
}

/**
 * The seam for the reserved authentication module. The base build ships a
 * development-only driver; real auth (OAuth/JWT/MFA/SSO) plugs in behind this
 * interface and nothing else changes.
 */
export interface AuthProvider {
  readonly driver: string;
  /** Returns null when the credential is absent or invalid — never throws for bad input. */
  resolvePrincipal(headers: Record<string, string | string[] | undefined>): Promise<Principal | null>;
  health(): Promise<HealthStatus>;
}

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

export interface RealtimeProvider {
  readonly driver: string;
  publish(ctx: TenantContext, channel: string, event: string, payload: unknown): Promise<void>;
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface HealthStatus {
  ok: boolean;
  detail?: string;
}
