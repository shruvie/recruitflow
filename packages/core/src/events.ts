import type { ActorType } from './enums';

/**
 * Domain events are the seam between modules: Notifications listens for
 * `application.stage_changed`; Applications has never heard of Notifications.
 *
 * Events are written to a transactional outbox in the same transaction as the
 * state change, then relayed to the queue — so the row and the event cannot
 * disagree about whether something happened.
 */
export const DomainEvent = {
  CANDIDATE_CREATED: 'candidate.created',
  CANDIDATE_UPDATED: 'candidate.updated',
  CANDIDATE_DELETED: 'candidate.deleted',

  JOB_CREATED: 'job.created',
  JOB_UPDATED: 'job.updated',
  JOB_PUBLISHED: 'job.published',
  JOB_CLOSED: 'job.closed',

  APPLICATION_CREATED: 'application.created',
  APPLICATION_STAGE_CHANGED: 'application.stage_changed',
  APPLICATION_REJECTED: 'application.rejected',
  APPLICATION_WITHDRAWN: 'application.withdrawn',
  APPLICATION_HIRED: 'application.hired',

  INTERVIEW_SCHEDULED: 'interview.scheduled',
  INTERVIEW_RESCHEDULED: 'interview.rescheduled',
  INTERVIEW_CANCELLED: 'interview.cancelled',
  INTERVIEW_COMPLETED: 'interview.completed',
  INTERVIEW_FEEDBACK_SUBMITTED: 'interview.feedback_submitted',

  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_DUE_SOON: 'task.due_soon',

  NOTE_CREATED: 'note.created',
  NOTE_MENTION: 'note.mention',

  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_PROCESSED: 'document.processed',
  DOCUMENT_FAILED: 'document.failed',

  EMAIL_QUEUED: 'email.queued',
  EMAIL_SENT: 'email.sent',
  EMAIL_FAILED: 'email.failed',

  AI_TOOL_EXECUTED: 'ai.tool_executed',
} as const;
export type DomainEvent = (typeof DomainEvent)[keyof typeof DomainEvent];

export interface DomainEventEnvelope<TPayload = Record<string, unknown>> {
  id: string;
  name: DomainEvent;
  organizationId: string;
  payload: TPayload;
  actor: { type: ActorType; userId?: string };
  requestId: string;
  occurredAt: Date;
  /**
   * Guards against automation loops: an event emitted by an automation carries
   * an incremented depth, and handlers refuse to act past the limit.
   */
  depth: number;
}

export const MAX_EVENT_DEPTH = 5;

export interface ApplicationStageChangedPayload {
  applicationId: string;
  candidateId: string;
  jobId: string;
  fromStageId: string | null;
  toStageId: string;
  toStageType: string;
  secondsInFromStage: number | null;
}

export interface InterviewScheduledPayload {
  interviewId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  scheduledAt: string;
  participantUserIds: string[];
}

export interface DocumentUploadedPayload {
  documentId: string;
  entityType: string;
  entityId: string;
  documentType: string;
  mimeType: string;
}

export interface EventPublisher {
  /** Must be called inside the same transaction as the state change it describes. */
  publish<T>(event: Omit<DomainEventEnvelope<T>, 'id' | 'occurredAt'>): Promise<void>;
}

export interface EventHandler<T = Record<string, unknown>> {
  readonly events: readonly DomainEvent[];
  handle(event: DomainEventEnvelope<T>): Promise<void>;
}
