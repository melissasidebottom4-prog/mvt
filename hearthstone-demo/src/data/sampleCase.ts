/**
 * SAMPLE CASE DATA
 *
 * Based on the founder's case - demonstrating the system's ability
 * to compute compliance violations from case events.
 *
 * Case: FC-39-2024-D-58
 * Jurisdiction: West Virginia
 * Children: Ivan, Amos, Samuel, June
 */

import { CaseEvent, EventType, ActorRole } from '../lib/types';

export const SAMPLE_CASE_EVENTS: CaseEvent[] = [
  // Initial custody finding
  {
    id: 'evt-001',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.FINDING_ISSUED,
    occurredAt: '2024-10-15T10:00:00Z',
    title: 'Court Finding on Custody',
    description:
      "Father found to be more interested in thwarting mother's relationship with children than in children's best interests",
    actorRole: ActorRole.JUDGE,
    findingType: 'custody_evaluation',
    findingResult: 'MADE',
    source: 'COURT',
    verified: true
  },

  // Mother notifies court of address change
  {
    id: 'evt-002',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.ADDRESS_NOTIFICATION,
    occurredAt: '2024-10-25T14:00:00Z',
    title: 'Address Change Notification',
    description: 'Mother notifies court and opposing counsel of new address per court rules',
    actorRole: ActorRole.MOTHER,
    source: 'PARENT',
    verified: true
  },

  // Emergency custody order - just 4 days after address notification
  {
    id: 'evt-003',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.EMERGENCY_ORDER,
    occurredAt: '2024-10-29T09:00:00Z',
    title: 'Emergency Custody Order',
    description:
      'Custody reversed via emergency order 4 days after mother notified court of new address. No imminent danger finding documented.',
    actorRole: ActorRole.JUDGE,
    source: 'COURT',
    verified: true,
    orderNumber: 'EMO-2024-1029'
  },

  // Arrest on the unserved order
  {
    id: 'evt-004',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.ARREST,
    occurredAt: '2024-11-05T07:30:00Z',
    title: 'Arrest on Court Order',
    description:
      'Mother arrested on emergency custody order. Mother had not been served with the order prior to arrest.',
    actorRole: ActorRole.LAW_ENFORCEMENT,
    source: 'COURT',
    verified: true
  },

  // Court acknowledges no service
  {
    id: 'evt-005',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.SERVICE_ACKNOWLEDGMENT,
    occurredAt: '2024-11-13T11:00:00Z',
    title: 'Court Acknowledges Defective Service',
    description:
      'Court acknowledges on the record that mother was never properly served with the emergency order prior to her arrest.',
    actorRole: ActorRole.JUDGE,
    serviceResult: 'FAILED',
    source: 'COURT',
    verified: true,
    notes: 'Court stated: "the record reflects service was not completed"'
  },

  // First cancelled hearing
  {
    id: 'evt-006',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.HEARING_CANCELLED,
    occurredAt: '2024-11-20T00:00:00Z',
    title: 'Hearing Cancelled #1',
    description: 'Scheduled hearing cancelled by court',
    actorRole: ActorRole.JUDGE,
    source: 'COURT',
    verified: true
  },

  // Second cancelled hearing
  {
    id: 'evt-007',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.HEARING_CANCELLED,
    occurredAt: '2024-12-05T00:00:00Z',
    title: 'Hearing Cancelled #2',
    description: 'Scheduled hearing cancelled by court',
    actorRole: ActorRole.JUDGE,
    source: 'COURT',
    verified: true
  },

  // Third cancelled hearing
  {
    id: 'evt-008',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.HEARING_CANCELLED,
    occurredAt: '2024-12-20T00:00:00Z',
    title: 'Hearing Cancelled #3',
    description: 'Scheduled hearing cancelled by court',
    actorRole: ActorRole.JUDGE,
    source: 'COURT',
    verified: true
  },

  // Fourth cancelled hearing
  {
    id: 'evt-009',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.HEARING_CANCELLED,
    occurredAt: '2025-01-10T00:00:00Z',
    title: 'Hearing Cancelled #4',
    description: 'Scheduled hearing cancelled by court',
    actorRole: ActorRole.JUDGE,
    source: 'COURT',
    verified: true
  },

  // Fifth cancelled hearing
  {
    id: 'evt-010',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.HEARING_CANCELLED,
    occurredAt: '2025-01-25T00:00:00Z',
    title: 'Hearing Cancelled #5',
    description: 'Fifth scheduled hearing cancelled by court',
    actorRole: ActorRole.JUDGE,
    source: 'COURT',
    verified: true
  },

  // Visitation denied
  {
    id: 'evt-011',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.VISITATION_DENIED,
    occurredAt: '2024-11-15T10:00:00Z',
    title: 'Visitation Denied',
    description: 'Mother denied contact with children Ivan, Amos, Samuel, and June',
    actorRole: ActorRole.SYSTEM,
    affectedParties: ['Ivan', 'Amos', 'Samuel', 'June'],
    source: 'COURT',
    verified: true
  },

  // Communication sent to CPS
  {
    id: 'evt-012',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.COMMUNICATION_SENT,
    occurredAt: '2024-11-18T09:00:00Z',
    title: 'Communication to CPS #1',
    description: 'Mother sends written inquiry to CPS regarding case status',
    actorRole: ActorRole.MOTHER,
    source: 'PARENT'
  },

  // No response from CPS
  {
    id: 'evt-013',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.COMMUNICATION_SENT,
    occurredAt: '2024-12-02T09:00:00Z',
    title: 'Follow-up Communication to CPS #2',
    description: 'Second written inquiry to CPS - no response to first communication',
    actorRole: ActorRole.MOTHER,
    source: 'PARENT'
  },

  // Third communication
  {
    id: 'evt-014',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.COMMUNICATION_SENT,
    occurredAt: '2024-12-16T09:00:00Z',
    title: 'Communication to CPS #3',
    description: 'Third written inquiry to CPS requesting case information',
    actorRole: ActorRole.MOTHER,
    source: 'PARENT'
  },

  // Fourth communication
  {
    id: 'evt-015',
    caseId: 'FC-39-2024-D-58',
    eventType: EventType.COMMUNICATION_SENT,
    occurredAt: '2025-01-06T09:00:00Z',
    title: 'Communication to CPS #4',
    description: 'Fourth written inquiry to CPS - still no response',
    actorRole: ActorRole.MOTHER,
    source: 'PARENT'
  }
];

export const CASE_SUMMARY = {
  caseId: 'FC-39-2024-D-58',
  jurisdiction: 'WV',
  county: 'Kanawha',
  children: [
    { name: 'Ivan', role: 'child' },
    { name: 'Amos', role: 'child' },
    { name: 'Samuel', role: 'child' },
    { name: 'June', role: 'child' }
  ],
  keyFacts: [
    'Court found father was "thwarting mother" 10/15/2024',
    'Mother notified court of new address 10/25/2024',
    'Emergency custody reversal 4 days later 10/29/2024',
    'Mother arrested on order she was never served 11/05/2024',
    'Court acknowledged no service 11/13/2024',
    '5 hearings cancelled since arrest',
    'No contact with children allowed',
    'HHS-OIG found 91% of WV child welfare cases non-compliant'
  ],
  adjudicationDate: '2025-02-26T00:00:00Z'
};
