import { RoleKey } from './enums';

/**
 * The permission catalog. These keys are code constants; the `permissions` table
 * exists so roles can reference them and the admin UI can render them.
 *
 * Organizations may define custom roles. They may not invent permissions.
 */
export const PERMISSIONS = [
  'candidate.read',
  'candidate.create',
  'candidate.update',
  'candidate.delete',
  'candidate.export',

  'job.read',
  'job.create',
  'job.update',
  'job.delete',
  'job.publish',

  'application.read',
  'application.create',
  'application.update',
  'application.move_stage',
  'application.reject',

  'interview.read',
  'interview.create',
  'interview.update',
  'interview.cancel',

  'feedback.read',
  'feedback.submit',

  'task.read',
  'task.create',
  'task.update',

  'note.read',
  'note.create',
  'note.delete',

  'document.read',
  'document.upload',
  'document.delete',

  'email.read',
  'email.send',

  'pipeline.read',
  'pipeline.manage',

  'automation.read',
  'automation.manage',

  'analytics.read',
  'analytics.export',

  'org.read',
  'org.manage',
  'member.manage',
  'role.manage',

  'audit.read',

  'ai.execute',
  'mcp.execute',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_SET: ReadonlySet<Permission> = new Set(PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value as Permission);
}

/**
 * Permissions whose effect is visible outside RecruitFlow, or is hard to undo.
 * AI and MCP tools touching these require human confirmation — reversibility
 * inside the product is not the test; whether the outside world sees it is.
 */
export const DESTRUCTIVE_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  'candidate.delete',
  'job.delete',
  'note.delete',
  'document.delete',
  'application.reject',
  'application.move_stage',
  'interview.cancel',
  'email.send',
  'candidate.export',
  'analytics.export',
  'member.manage',
  'role.manage',
  'org.manage',
]);

/**
 * Default role → permission mapping, seeded per organization and editable by ORG_ADMIN.
 * Row-level scoping (e.g. an INTERVIEWER only sees interviews they are on) is applied
 * separately in the service layer — permission answers "what kind of thing", scope
 * answers "which rows".
 */
const RECRUITER: Permission[] = [
  'candidate.read',
  'candidate.create',
  'candidate.update',
  'candidate.export',
  'job.read',
  'job.create',
  'job.update',
  'job.publish',
  'application.read',
  'application.create',
  'application.update',
  'application.move_stage',
  'application.reject',
  'interview.read',
  'interview.create',
  'interview.update',
  'interview.cancel',
  'feedback.read',
  'task.read',
  'task.create',
  'task.update',
  'note.read',
  'note.create',
  'note.delete',
  'document.read',
  'document.upload',
  'document.delete',
  'email.read',
  'email.send',
  'pipeline.read',
  'automation.read',
  'analytics.read',
  'org.read',
  'ai.execute',
];

const HIRING_MANAGER: Permission[] = [
  'candidate.read',
  'job.read',
  'job.create',
  'job.update',
  'application.read',
  'application.move_stage',
  'interview.read',
  'feedback.read',
  'feedback.submit',
  'task.read',
  'task.create',
  'note.read',
  'note.create',
  'document.read',
  'pipeline.read',
  'analytics.read',
  'org.read',
  'ai.execute',
];

const INTERVIEWER: Permission[] = [
  'candidate.read',
  'job.read',
  'application.read',
  'interview.read',
  'feedback.read',
  'feedback.submit',
  'note.read',
  'note.create',
  'document.read',
  'org.read',
];

const ORG_ADMIN: Permission[] = [...PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<RoleKey, readonly Permission[]>> = {
  [RoleKey.SUPER_ADMIN]: [...PERMISSIONS],
  [RoleKey.ORG_ADMIN]: ORG_ADMIN,
  [RoleKey.RECRUITER]: RECRUITER,
  [RoleKey.HIRING_MANAGER]: HIRING_MANAGER,
  [RoleKey.INTERVIEWER]: INTERVIEWER,
  // Reserved. Deliberately empty: the future candidate portal is the one principal
  // that must see *a row* rather than *an organization*, so it gets purpose-built
  // scoping rather than a slice of the internal permission set.
  [RoleKey.CANDIDATE]: [],
};

export const SYSTEM_ROLES: readonly RoleKey[] = [
  RoleKey.ORG_ADMIN,
  RoleKey.RECRUITER,
  RoleKey.HIRING_MANAGER,
  RoleKey.INTERVIEWER,
];

export interface PermissionMetadata {
  key: Permission;
  resource: string;
  action: string;
  isDestructive: boolean;
}

export function describePermission(key: Permission): PermissionMetadata {
  const [resource = key, action = ''] = key.split('.');
  return {
    key,
    resource,
    action,
    isDestructive: DESTRUCTIVE_PERMISSIONS.has(key),
  };
}
