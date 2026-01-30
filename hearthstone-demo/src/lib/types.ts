/**
 * HEARTHSTONE CONTINUUM - TYPE SYSTEM
 *
 * Laws are equations. Cases are initial conditions. Compliance is computed state.
 */

export enum EventType {
  CASE_OPENED = 'CASE_OPENED',
  CASE_CLOSED = 'CASE_CLOSED',
  EMERGENCY_REMOVAL = 'EMERGENCY_REMOVAL',
  CUSTODY_CHANGE = 'CUSTODY_CHANGE',
  CUSTODY_ORDER = 'CUSTODY_ORDER',
  EMERGENCY_ORDER = 'EMERGENCY_ORDER',
  PLACEMENT_CHANGE = 'PLACEMENT_CHANGE',
  PETITION_FILED = 'PETITION_FILED',
  HEARING_SCHEDULED = 'HEARING_SCHEDULED',
  HEARING_HELD = 'HEARING_HELD',
  HEARING_CANCELLED = 'HEARING_CANCELLED',
  HEARING_CONTINUED = 'HEARING_CONTINUED',
  ORDER_ISSUED = 'ORDER_ISSUED',
  MOTION_FILED = 'MOTION_FILED',
  SERVICE_ATTEMPTED = 'SERVICE_ATTEMPTED',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  SERVICE_FAILED = 'SERVICE_FAILED',
  SERVICE_ACKNOWLEDGMENT = 'SERVICE_ACKNOWLEDGMENT',
  INVESTIGATION_OPENED = 'INVESTIGATION_OPENED',
  INVESTIGATION_CLOSED = 'INVESTIGATION_CLOSED',
  CPS_CONTACT = 'CPS_CONTACT',
  CPS_VISIT = 'CPS_VISIT',
  CPS_REPORT_FILED = 'CPS_REPORT_FILED',
  SAFETY_PLAN_CREATED = 'SAFETY_PLAN_CREATED',
  CASE_PLAN_CREATED = 'CASE_PLAN_CREATED',
  VISITATION_SCHEDULED = 'VISITATION_SCHEDULED',
  VISITATION_OCCURRED = 'VISITATION_OCCURRED',
  VISITATION_DENIED = 'VISITATION_DENIED',
  PARENT_CONTACT_ATTEMPTED = 'PARENT_CONTACT_ATTEMPTED',
  PARENT_CONTACT_MADE = 'PARENT_CONTACT_MADE',
  FINDING_ISSUED = 'FINDING_ISSUED',
  REASONABLE_EFFORTS_FINDING = 'REASONABLE_EFFORTS_FINDING',
  IMMINENT_DANGER_FINDING = 'IMMINENT_DANGER_FINDING',
  BEST_INTEREST_FINDING = 'BEST_INTEREST_FINDING',
  ADDRESS_NOTIFICATION = 'ADDRESS_NOTIFICATION',
  ATTORNEY_APPOINTED = 'ATTORNEY_APPOINTED',
  GAL_APPOINTED = 'GAL_APPOINTED',
  ARREST = 'ARREST',
  CHARGES_FILED = 'CHARGES_FILED',
  CHARGES_DISMISSED = 'CHARGES_DISMISSED',
  COMMUNICATION_SENT = 'COMMUNICATION_SENT',
  COMMUNICATION_RECEIVED = 'COMMUNICATION_RECEIVED',
  NO_RESPONSE = 'NO_RESPONSE',
  DOCUMENT_FILED = 'DOCUMENT_FILED',
  DOCUMENT_RECEIVED = 'DOCUMENT_RECEIVED',
  MEDICAL_EVENT = 'MEDICAL_EVENT',
  MENTAL_HEALTH_EVENT = 'MENTAL_HEALTH_EVENT',
  DEADLINE_CHECK = 'DEADLINE_CHECK',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK'
}

export enum ActorRole {
  MOTHER = 'MOTHER',
  FATHER = 'FATHER',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
  JUDGE = 'JUDGE',
  MAGISTRATE = 'MAGISTRATE',
  CPS_WORKER = 'CPS_WORKER',
  CPS_SUPERVISOR = 'CPS_SUPERVISOR',
  GAL = 'GAL',
  CASA = 'CASA',
  PROSECUTOR = 'PROSECUTOR',
  DEFENSE_ATTORNEY = 'DEFENSE_ATTORNEY',
  PARENT_ATTORNEY = 'PARENT_ATTORNEY',
  CHILD_ATTORNEY = 'CHILD_ATTORNEY',
  LAW_ENFORCEMENT = 'LAW_ENFORCEMENT',
  MEDICAL_PROVIDER = 'MEDICAL_PROVIDER',
  THERAPIST = 'THERAPIST',
  SCHOOL = 'SCHOOL',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  WITNESS = 'WITNESS',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

export interface CaseEvent {
  id: string;
  caseId: string;
  eventType: EventType;
  occurredAt: string;
  recordedAt?: string;
  actorId?: string;
  actorRole?: ActorRole;
  actorName?: string;
  affectedParties?: string[];
  title: string;
  description?: string;
  citations?: string[];
  orderNumber?: string;
  documentIds?: string[];
  source?: 'COURT' | 'CPS' | 'PARENT' | 'ATTORNEY' | 'SYSTEM' | 'OTHER';
  verified?: boolean;
  notes?: string;
  findingType?: string;
  findingResult?: 'MADE' | 'NOT_MADE' | 'UNKNOWN';
  hearingType?: string;
  hearingResult?: string;
  serviceMethod?: string;
  serviceResult?: 'COMPLETED' | 'FAILED' | 'ATTEMPTED';
}

export type FlagSeverity = 'EMERGENCY' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FlagCategory =
  | 'DUE_PROCESS'
  | 'SERVICE_OF_PROCESS'
  | 'HEARING_TIMELINE'
  | 'REASONABLE_EFFORTS'
  | 'FINDINGS_REQUIRED'
  | 'DOCUMENTATION'
  | 'PARENT_RIGHTS'
  | 'CHILD_SAFETY'
  | 'COMMUNICATION'
  | 'PROCEDURAL';

export interface ComplianceFlag {
  id?: string;
  type: string;
  category: FlagCategory;
  severity: FlagSeverity;
  title: string;
  description: string;
  plainLanguage: string;
  citation: string;
  statuteText?: string;
  triggeredByEvent?: string;
  equationId?: string;
  evidence?: string[];
  status: 'ACTIVE' | 'RESOLVED' | 'DISPUTED';
  resolvedAt?: string;
  resolvedBy?: string;
  recommendedAction?: string;
  requiredAction?: string;
  deadline?: string;
  computedAt?: string;
  verifiedBy?: string;
}

export interface EquationResult {
  stateUpdates: Partial<CaseState>;
  flags?: Omit<ComplianceFlag, 'triggeredByEvent' | 'equationId' | 'computedAt'>[];
}

export interface LegalEquation {
  id: string;
  jurisdiction: string;
  citation: string;
  statuteTitle: string;
  effectiveDate: string;
  triggers: EventType[];
  compute: (event: CaseEvent, state: CaseState, timeline: CaseEvent[]) => EquationResult;
  verifiedAgainst?: string;
  verifiedDate?: string;
  verifiedBy?: string;
  description: string;
  category: string;
}

export enum SafeguardStatus {
  NOT_TRIGGERED = 'NOT_TRIGGERED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED'
}

export interface Safeguard {
  id: string;
  name: string;
  citation: string;
  status: SafeguardStatus;
  triggeredAt?: string;
  dueBy?: string;
  completedAt?: string;
  notes?: string;
}

export interface DeadlineState {
  name: string;
  citation: string;
  triggeredAt: string;
  dueBy: string;
  completed: boolean;
  completedAt?: string;
}

export interface Deadline extends DeadlineState {
  id: string;
  daysRemaining: number;
  daysOverdue?: number;
}

export interface CaseState {
  jurisdiction: string;
  custodyStatus: 'WITH_MOTHER' | 'WITH_FATHER' | 'FOSTER_CARE' | 'RELATIVE' | 'SPLIT' | 'UNKNOWN';
  removalDate: string | null;
  placementDate?: string;
  serviced: boolean;
  serviceDate?: string;
  serviceMethod?: string;
  hearingsHeld: number;
  hearingsCancelled: number;
  lastHearingDate?: string;
  nextHearingDate?: string;
  findings: { [key: string]: { made: boolean; date: string; details?: string } };
  deadlines: { [key: string]: DeadlineState | null };
  safeguards: { [key: string]: Safeguard };
  actors: { [key: string]: { role: ActorRole; name?: string; assignedDate?: string } };
  lastContactWithChildren: string | null;
  cpsResponsePending: boolean;
  cpsLastContact?: string;
  unansweredCommunications?: number;
  daysInCare?: number;
  monthsInCare?: number;
}

export interface SolverOutput {
  caseId: string;
  jurisdiction: string;
  computedAt: string;
  timeline: CaseEvent[];
  compliance: {
    flags: ComplianceFlag[];
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    totalViolations: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  deadlines: { upcoming: Deadline[]; missed: Deadline[] };
  safeguards: { required: Safeguard[]; completed: Safeguard[]; missing: Safeguard[] };
  recommendations: { immediate: string[]; legal: string[]; documentation: string[] };
  state: CaseState;
}
