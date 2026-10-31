import { ActorType, RoleKey } from './enums';
import { AppError } from './errors';
import type { Permission } from './permissions';

/**
 * Carried by every call into the application layer. There is no repository or
 * service overload that omits it — that is what makes a missing tenant filter a
 * compile error rather than a runtime leak.
 */
export interface TenantContext {
  /** Absent only for SUPER_ADMIN platform-level operations. */
  readonly organizationId: string;
  readonly userId: string;
  readonly roles: readonly RoleKey[];
  readonly permissions: ReadonlySet<Permission>;
  readonly requestId: string;
  readonly actor: Actor;
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * `actor` makes AI and MCP actions auditable *without* granting them privileges:
 * a non-USER actor always carries the invoking user's permission set, so the AI
 * can never do something the user could not do themselves.
 */
export interface Actor {
  readonly type: ActorType;
  readonly onBehalfOfUserId?: string;
  /** Set for AI/MCP actors so an audit row links back to the prompt that caused it. */
  readonly aiConversationId?: string;
  readonly aiToolExecutionId?: string;
  readonly mcpClientId?: string;
}

export interface PlatformContext extends Omit<TenantContext, 'organizationId'> {
  readonly organizationId: null;
}

export function hasPermission(ctx: TenantContext, permission: Permission): boolean {
  return ctx.permissions.has(permission);
}

export function hasAllPermissions(
  ctx: TenantContext,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((p) => ctx.permissions.has(p));
}

export function hasAnyPermission(
  ctx: TenantContext,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => ctx.permissions.has(p));
}

/** Throws `FORBIDDEN` unless the context holds every listed permission. */
export function assertPermissions(
  ctx: TenantContext,
  ...permissions: readonly Permission[]
): void {
  const missing = permissions.filter((p) => !ctx.permissions.has(p));
  if (missing.length > 0) {
    throw new AppError('FORBIDDEN', 'You do not have permission to perform this action', {
      meta: { required: permissions, missing },
    });
  }
}

export function hasRole(ctx: TenantContext, role: RoleKey): boolean {
  return ctx.roles.includes(role);
}

export function isOrgAdmin(ctx: TenantContext): boolean {
  return hasRole(ctx, RoleKey.ORG_ADMIN) || hasRole(ctx, RoleKey.SUPER_ADMIN);
}

/**
 * Derives a context for an AI or MCP actor. The permission set is copied, never
 * widened — the whole point of the actor model.
 */
export function deriveActorContext(
  ctx: TenantContext,
  actor: Omit<Actor, 'onBehalfOfUserId'>,
): TenantContext {
  return {
    ...ctx,
    actor: { ...actor, onBehalfOfUserId: ctx.userId },
  };
}

/** Test/seed/worker helper. Never reachable from an HTTP request. */
export function systemContext(organizationId: string, requestId: string): TenantContext {
  return {
    organizationId,
    userId: 'system',
    roles: [],
    permissions: new Set<Permission>(),
    requestId,
    actor: { type: ActorType.SYSTEM },
  };
}
