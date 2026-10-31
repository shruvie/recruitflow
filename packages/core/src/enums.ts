/**
 * Closed sets that change with code, not with tenant configuration.
 *
 * Sets that tenants configure — pipeline stages, rejection reasons, tags, skills —
 * are lookup tables in the database, not enums here.
 */

export const RoleKey = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  RECRUITER: 'RECRUITER',
  HIRING_MANAGER: 'HIRING_MANAGER',
  INTERVIEWER: 'INTERVIEWER',
  /** Reserved: future external candidate portal. Modelled from day one, no login path yet. */
  CANDIDATE: 'CANDIDATE',
} as const;
export type RoleKey = (typeof RoleKey)[keyof typeof RoleKey];

export const UserStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const JobStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
  FILLED: 'FILLED',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERNSHIP: 'INTERNSHIP',
  TEMPORARY: 'TEMPORARY',
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const LocationType = {
  ONSITE: 'ONSITE',
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID',
} as const;
export type LocationType = (typeof LocationType)[keyof typeof LocationType];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const CandidateStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  DO_NOT_CONTACT: 'DO_NOT_CONTACT',
} as const;
export type CandidateStatus = (typeof CandidateStatus)[keyof typeof CandidateStatus];

export const CandidateSource = {
  APPLIED: 'APPLIED',
  REFERRAL: 'REFERRAL',
  SOURCED: 'SOURCED',
  AGENCY: 'AGENCY',
  JOB_BOARD: 'JOB_BOARD',
  EVENT: 'EVENT',
  IMPORT: 'IMPORT',
  OTHER: 'OTHER',
} as const;
export type CandidateSource = (typeof CandidateSource)[keyof typeof CandidateSource];

export const ApplicationStatus = {
  ACTIVE: 'ACTIVE',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  ON_HOLD: 'ON_HOLD',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

/**
 * Stage *type* is a fixed classification; stage *names* are tenant-defined.
 * Analytics keys off the type so a tenant renaming "Screening" to "Triage"
 * does not break the funnel.
 */
export const StageType = {
  OPEN: 'OPEN',
  OFFER: 'OFFER',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
  ON_HOLD: 'ON_HOLD',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type StageType = (typeof StageType)[keyof typeof StageType];

export const TERMINAL_STAGE_TYPES: readonly StageType[] = [
  StageType.HIRED,
  StageType.REJECTED,
  StageType.WITHDRAWN,
];

export const InterviewType = {
  PHONE: 'PHONE',
  VIDEO: 'VIDEO',
  TECHNICAL: 'TECHNICAL',
  HR: 'HR',
  BEHAVIORAL: 'BEHAVIORAL',
  PANEL: 'PANEL',
  ONSITE: 'ONSITE',
} as const;
export type InterviewType = (typeof InterviewType)[keyof typeof InterviewType];

export const InterviewStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type InterviewStatus = (typeof InterviewStatus)[keyof typeof InterviewStatus];

export const InterviewRecommendation = {
  STRONG_HIRE: 'STRONG_HIRE',
  HIRE: 'HIRE',
  MAYBE: 'MAYBE',
  NO_HIRE: 'NO_HIRE',
  STRONG_NO_HIRE: 'STRONG_NO_HIRE',
} as const;
export type InterviewRecommendation =
  (typeof InterviewRecommendation)[keyof typeof InterviewRecommendation];

export const ParticipantRole = {
  ORGANIZER: 'ORGANIZER',
  INTERVIEWER: 'INTERVIEWER',
  OBSERVER: 'OBSERVER',
} as const;
export type ParticipantRole = (typeof ParticipantRole)[keyof typeof ParticipantRole];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

/** Polymorphic attachment targets for notes, documents, and activities. */
export const EntityType = {
  ORGANIZATION: 'ORGANIZATION',
  CANDIDATE: 'CANDIDATE',
  JOB: 'JOB',
  APPLICATION: 'APPLICATION',
  INTERVIEW: 'INTERVIEW',
  TASK: 'TASK',
  USER: 'USER',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const DocumentType = {
  RESUME: 'RESUME',
  COVER_LETTER: 'COVER_LETTER',
  CERTIFICATE: 'CERTIFICATE',
  PORTFOLIO: 'PORTFOLIO',
  OFFER: 'OFFER',
  OTHER: 'OTHER',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

/**
 * Who performed an action. AI and MCP actors always carry the invoking user's
 * permissions — they have none of their own.
 */
export const ActorType = {
  USER: 'USER',
  AI: 'AI',
  MCP: 'MCP',
  AUTOMATION: 'AUTOMATION',
  SYSTEM: 'SYSTEM',
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];
