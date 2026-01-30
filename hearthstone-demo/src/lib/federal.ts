/**
 * FEDERAL EQUATIONS
 *
 * Federal child welfare requirements from:
 * - Adoption and Safe Families Act (ASFA) - 42 U.S.C. § 671-679b
 * - Child Abuse Prevention and Treatment Act (CAPTA)
 * - Indian Child Welfare Act (ICWA)
 * - Constitutional Due Process (14th Amendment)
 */

import {
  LegalEquation,
  EventType,
  CaseEvent,
  CaseState,
  SafeguardStatus,
  FlagCategory
} from './types';
import { addDays, daysBetween } from './solver';

export function loadFederalEquations(): LegalEquation[] {
  return [
    // ============================================================
    // ASFA - PERMANENCY TIMELINES
    // ============================================================
    {
      id: 'FED-ASFA-001',
      jurisdiction: 'FEDERAL',
      citation: '42 U.S.C. § 675(5)(C)',
      statuteTitle: 'ASFA Permanency Hearing Timeline',
      effectiveDate: '1997-11-19',
      description: 'Permanency hearing required within 12 months of removal',
      category: 'HEARING_TIMELINE',
      triggers: [EventType.EMERGENCY_REMOVAL, EventType.CUSTODY_CHANGE],
      compute: (event: CaseEvent, state: CaseState) => {
        if (
          event.eventType === EventType.EMERGENCY_REMOVAL ||
          event.eventType === EventType.CUSTODY_CHANGE
        ) {
          const removalDate = event.occurredAt;
          const permanencyDeadline = addDays(removalDate, 365);

          return {
            stateUpdates: {
              removalDate,
              deadlines: {
                ...state.deadlines,
                permanencyHearing: {
                  name: 'Permanency Hearing',
                  citation: '42 U.S.C. § 675(5)(C)',
                  triggeredAt: removalDate,
                  dueBy: permanencyDeadline.toISOString(),
                  completed: false
                }
              },
              safeguards: {
                ...state.safeguards,
                permanencyHearing: {
                  id: 'permanencyHearing',
                  name: 'Permanency Hearing within 12 months',
                  citation: '42 U.S.C. § 675(5)(C)',
                  status: SafeguardStatus.PENDING,
                  triggeredAt: removalDate,
                  dueBy: permanencyDeadline.toISOString()
                }
              }
            },
            flags: []
          };
        }
        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // ASFA - 15/22 MONTH RULE
    // ============================================================
    {
      id: 'FED-ASFA-002',
      jurisdiction: 'FEDERAL',
      citation: '42 U.S.C. § 675(5)(E)',
      statuteTitle: 'ASFA 15/22 Month TPR Requirement',
      effectiveDate: '1997-11-19',
      description: 'TPR petition required if child in care 15 of last 22 months',
      category: 'PROCEDURAL',
      triggers: [EventType.DEADLINE_CHECK],
      compute: (_event: CaseEvent, state: CaseState) => {
        if (state.removalDate) {
          const daysInCare = daysBetween(state.removalDate, new Date());
          const monthsInCare = Math.floor(daysInCare / 30);

          if (monthsInCare >= 15) {
            return {
              stateUpdates: {
                daysInCare,
                monthsInCare
              },
              flags: [
                {
                  type: 'ASFA_15_22_TRIGGERED',
                  category: 'PROCEDURAL' as FlagCategory,
                  severity: 'HIGH' as const,
                  title: 'ASFA 15/22 Month Rule Triggered',
                  description: `Child has been in care for ${monthsInCare} months. Federal law requires TPR petition or documented exception.`,
                  plainLanguage: `Your children have been in out-of-home care for ${monthsInCare} months. Federal law (ASFA) requires the state to either file to terminate parental rights or document why an exception applies.`,
                  citation: '42 U.S.C. § 675(5)(E)',
                  status: 'ACTIVE' as const,
                  recommendedAction:
                    'Request documentation of ASFA exception or challenge basis for continued removal'
                }
              ]
            };
          }
        }
        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // REASONABLE EFFORTS - REMOVAL
    // ============================================================
    {
      id: 'FED-ASFA-003',
      jurisdiction: 'FEDERAL',
      citation: '42 U.S.C. § 671(a)(15)(B)',
      statuteTitle: 'Reasonable Efforts to Prevent Removal',
      effectiveDate: '1997-11-19',
      description: 'Reasonable efforts to prevent removal must be documented',
      category: 'REASONABLE_EFFORTS',
      triggers: [EventType.EMERGENCY_REMOVAL, EventType.CUSTODY_CHANGE, EventType.EMERGENCY_ORDER],
      compute: (event: CaseEvent, state: CaseState, timeline: CaseEvent[]) => {
        // Check if reasonable efforts finding was made
        const reasonableEffortsFindings = timeline.filter(
          (e) =>
            e.eventType === EventType.REASONABLE_EFFORTS_FINDING &&
            new Date(e.occurredAt) <= new Date(event.occurredAt)
        );

        if (reasonableEffortsFindings.length === 0) {
          return {
            stateUpdates: {
              safeguards: {
                ...state.safeguards,
                reasonableEfforts: {
                  id: 'reasonableEfforts',
                  name: 'Reasonable Efforts Finding',
                  citation: '42 U.S.C. § 671(a)(15)(B)',
                  status: SafeguardStatus.MISSED,
                  triggeredAt: event.occurredAt
                }
              }
            },
            flags: [
              {
                type: 'NO_REASONABLE_EFFORTS_FINDING',
                category: 'REASONABLE_EFFORTS' as FlagCategory,
                severity: 'CRITICAL' as const,
                title: 'Missing Reasonable Efforts Finding',
                description:
                  'Removal occurred without documented judicial finding of reasonable efforts to prevent removal.',
                plainLanguage:
                  'The court removed your children without first finding that the state made reasonable efforts to keep your family together. This is required by federal law.',
                citation: '42 U.S.C. § 671(a)(15)(B)',
                status: 'ACTIVE' as const,
                recommendedAction:
                  'Challenge removal - demand documentation of reasonable efforts made to prevent removal'
              }
            ]
          };
        }

        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // DUE PROCESS - NOTICE AND HEARING
    // ============================================================
    {
      id: 'FED-DUE-PROCESS-001',
      jurisdiction: 'FEDERAL',
      citation: 'U.S. Const. amend. XIV',
      statuteTitle: '14th Amendment Due Process',
      effectiveDate: '1868-07-09',
      description: 'Constitutional right to notice and hearing before deprivation of liberty',
      category: 'DUE_PROCESS',
      triggers: [EventType.ARREST],
      compute: (event: CaseEvent, _state: CaseState, timeline: CaseEvent[]) => {
        // Check for valid service before arrest
        const serviceEvents = timeline.filter(
          (e) =>
            e.eventType === EventType.SERVICE_COMPLETED &&
            new Date(e.occurredAt) < new Date(event.occurredAt)
        );

        // Check for acknowledgment of failed service
        const serviceAcknowledgment = timeline.find(
          (e) => e.eventType === EventType.SERVICE_ACKNOWLEDGMENT && e.serviceResult === 'FAILED'
        );

        if (serviceEvents.length === 0 || serviceAcknowledgment) {
          return {
            stateUpdates: {
              serviced: false
            },
            flags: [
              {
                type: 'ARREST_WITHOUT_SERVICE',
                category: 'DUE_PROCESS' as FlagCategory,
                severity: 'EMERGENCY' as const,
                title: 'Constitutional Due Process Violation',
                description:
                  'Arrest occurred on court order without proper service of process. This violates fundamental constitutional rights.',
                plainLanguage:
                  'You were arrested on a court order that you were never properly notified about. The Constitution requires you receive notice and an opportunity to be heard before the government can take action against you.',
                citation: 'U.S. Const. amend. XIV; Mathews v. Eldridge, 424 U.S. 319 (1976)',
                status: 'ACTIVE' as const,
                recommendedAction:
                  'File immediate motion to vacate all orders - constitutional violation',
                evidence: ['No service of process before arrest', 'Court acknowledged no service']
              }
            ]
          };
        }

        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // PARENTAL RIGHTS - FUNDAMENTAL LIBERTY
    // ============================================================
    {
      id: 'FED-PARENTAL-001',
      jurisdiction: 'FEDERAL',
      citation: 'U.S. Const. amend. XIV',
      statuteTitle: 'Fundamental Right to Parent',
      effectiveDate: '1868-07-09',
      description:
        'Parental rights are fundamental liberty interest requiring strict scrutiny for deprivation',
      category: 'PARENT_RIGHTS',
      triggers: [EventType.VISITATION_DENIED],
      compute: (_event: CaseEvent, state: CaseState, timeline: CaseEvent[]) => {
        const denials = timeline.filter((e) => e.eventType === EventType.VISITATION_DENIED);

        if (denials.length >= 1) {
          return {
            stateUpdates: {
              lastContactWithChildren: state.lastContactWithChildren
            },
            flags: [
              {
                type: 'VISITATION_DENIED_PATTERN',
                category: 'PARENT_RIGHTS' as FlagCategory,
                severity: denials.length >= 3 ? ('CRITICAL' as const) : ('HIGH' as const),
                title: 'Parental Visitation Rights Violated',
                description: `Visitation has been denied ${denials.length} time(s). Parental rights are fundamental liberty interests protected by the Constitution.`,
                plainLanguage: `You have been denied contact with your children ${denials.length} time(s). Your right to maintain a relationship with your children is constitutionally protected.`,
                citation:
                  'Troxel v. Granville, 530 U.S. 57 (2000); Santosky v. Kramer, 455 U.S. 745 (1982)',
                status: 'ACTIVE' as const,
                recommendedAction: 'File motion to enforce visitation rights'
              }
            ]
          };
        }

        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // CPS RESPONSE REQUIREMENTS
    // ============================================================
    {
      id: 'FED-CPS-001',
      jurisdiction: 'FEDERAL',
      citation: '42 U.S.C. § 5106a(b)(2)(B)',
      statuteTitle: 'CAPTA Response Requirements',
      effectiveDate: '1974-01-31',
      description: 'CPS must respond to and investigate reports',
      category: 'COMMUNICATION',
      triggers: [EventType.COMMUNICATION_SENT, EventType.NO_RESPONSE],
      compute: (_event: CaseEvent, _state: CaseState, timeline: CaseEvent[]) => {
        // Count unanswered communications
        const sentToCPS = timeline.filter(
          (e) =>
            e.eventType === EventType.COMMUNICATION_SENT &&
            (e.actorRole === 'CPS_WORKER' || e.description?.toLowerCase().includes('cps'))
        );

        const responses = timeline.filter(
          (e) =>
            e.eventType === EventType.COMMUNICATION_RECEIVED ||
            e.eventType === EventType.CPS_CONTACT
        );

        const unanswered = sentToCPS.length - responses.length;

        if (unanswered >= 3) {
          return {
            stateUpdates: {
              unansweredCommunications: unanswered,
              cpsResponsePending: true
            },
            flags: [
              {
                type: 'CPS_NON_RESPONSE',
                category: 'COMMUNICATION' as FlagCategory,
                severity: 'HIGH' as const,
                title: 'CPS Non-Response Pattern',
                description: `${unanswered} communications to CPS have gone unanswered. Federal funding requires responsive child welfare services.`,
                plainLanguage: `You have sent ${unanswered} communications to CPS that have not been answered. Child welfare agencies are required to maintain communication with families.`,
                citation: '42 U.S.C. § 5106a(b)(2)(B)',
                status: 'ACTIVE' as const,
                recommendedAction:
                  'Document all unanswered communications and file complaint with state ombudsman'
              }
            ]
          };
        }

        return {
          stateUpdates: {
            unansweredCommunications: Math.max(0, unanswered)
          },
          flags: []
        };
      }
    },

    // ============================================================
    // IMMINENT DANGER REQUIREMENT
    // ============================================================
    {
      id: 'FED-DANGER-001',
      jurisdiction: 'FEDERAL',
      citation: '42 U.S.C. § 671(a)(15)',
      statuteTitle: 'Imminent Danger Finding Required',
      effectiveDate: '1997-11-19',
      description: 'Emergency removal requires imminent danger finding',
      category: 'FINDINGS_REQUIRED',
      triggers: [EventType.EMERGENCY_REMOVAL, EventType.EMERGENCY_ORDER],
      compute: (event: CaseEvent, state: CaseState, timeline: CaseEvent[]) => {
        // Check for imminent danger finding before or concurrent with removal
        const dangerFindings = timeline.filter(
          (e) =>
            e.eventType === EventType.IMMINENT_DANGER_FINDING &&
            new Date(e.occurredAt) <= new Date(event.occurredAt)
        );

        if (dangerFindings.length === 0) {
          return {
            stateUpdates: {
              safeguards: {
                ...state.safeguards,
                imminentDanger: {
                  id: 'imminentDanger',
                  name: 'Imminent Danger Finding',
                  citation: '42 U.S.C. § 671(a)(15)',
                  status: SafeguardStatus.MISSED,
                  triggeredAt: event.occurredAt
                }
              }
            },
            flags: [
              {
                type: 'NO_IMMINENT_DANGER_FINDING',
                category: 'FINDINGS_REQUIRED' as FlagCategory,
                severity: 'CRITICAL' as const,
                title: 'Emergency Removal Without Imminent Danger Finding',
                description:
                  'Emergency removal occurred without judicial finding of imminent danger to children.',
                plainLanguage:
                  'Your children were removed in an emergency without the court finding they were in immediate danger. Emergency removals require proof of imminent harm.',
                citation: '42 U.S.C. § 671(a)(15)',
                status: 'ACTIVE' as const,
                recommendedAction:
                  'Challenge removal - demand evidence of imminent danger that justified emergency action'
              }
            ]
          };
        }

        return { stateUpdates: {}, flags: [] };
      }
    }
  ];
}
