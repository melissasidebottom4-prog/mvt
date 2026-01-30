/**
 * WEST VIRGINIA EQUATIONS
 *
 * West Virginia child welfare requirements from:
 * - W. Va. Code § 49-4-601 et seq. (Child Welfare)
 * - W. Va. R. Civ. P. Rule 4 (Service of Process)
 * - W. Va. Code § 48-9-101 et seq. (Custody Proceedings)
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

export function loadWVEquations(): LegalEquation[] {
  return [
    // ============================================================
    // PRELIMINARY HEARING - 10 DAY REQUIREMENT
    // ============================================================
    {
      id: 'WV-49-4-602',
      jurisdiction: 'WV',
      citation: 'W. Va. Code § 49-4-602',
      statuteTitle: 'Preliminary Hearing Timeline',
      effectiveDate: '2015-06-12',
      description: 'Preliminary hearing required within 10 days of petition filing',
      category: 'HEARING_TIMELINE',
      triggers: [
        EventType.PETITION_FILED,
        EventType.EMERGENCY_REMOVAL,
        EventType.DEADLINE_CHECK
      ],
      compute: (event: CaseEvent, state: CaseState, _timeline: CaseEvent[]) => {
        if (
          event.eventType === EventType.PETITION_FILED ||
          event.eventType === EventType.EMERGENCY_REMOVAL
        ) {
          const filingDate = event.occurredAt;
          const deadline = addDays(filingDate, 10);

          return {
            stateUpdates: {
              deadlines: {
                ...state.deadlines,
                preliminaryHearing: {
                  name: 'Preliminary Hearing',
                  citation: 'W. Va. Code § 49-4-602',
                  triggeredAt: filingDate,
                  dueBy: deadline.toISOString(),
                  completed: false
                }
              },
              safeguards: {
                ...state.safeguards,
                preliminaryHearing: {
                  id: 'preliminaryHearing',
                  name: 'Preliminary Hearing within 10 days',
                  citation: 'W. Va. Code § 49-4-602',
                  status: SafeguardStatus.PENDING,
                  triggeredAt: filingDate,
                  dueBy: deadline.toISOString()
                }
              }
            },
            flags: []
          };
        }

        // Check if deadline was missed
        if (event.eventType === EventType.DEADLINE_CHECK) {
          const prelimDeadline = state.deadlines?.preliminaryHearing;
          if (prelimDeadline && !prelimDeadline.completed) {
            const dueDate = new Date(prelimDeadline.dueBy);
            const now = new Date();

            if (now > dueDate) {
              const daysOverdue = daysBetween(dueDate, now);
              return {
                stateUpdates: {},
                flags: [
                  {
                    type: 'PRELIMINARY_HEARING_MISSED',
                    category: 'HEARING_TIMELINE' as FlagCategory,
                    severity: 'CRITICAL' as const,
                    title: 'Preliminary Hearing Deadline Missed',
                    description: `Preliminary hearing was required within 10 days but is now ${daysOverdue} days overdue.`,
                    plainLanguage: `West Virginia law required a preliminary hearing within 10 days, but ${daysOverdue} days have passed without one. This delays your ability to contest the removal.`,
                    citation: 'W. Va. Code § 49-4-602',
                    status: 'ACTIVE' as const,
                    recommendedAction: 'File motion demanding immediate preliminary hearing'
                  }
                ]
              };
            }
          }
        }

        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // SERVICE OF PROCESS - WV RULES
    // ============================================================
    {
      id: 'WV-RCP-4',
      jurisdiction: 'WV',
      citation: 'W. Va. R. Civ. P. 4',
      statuteTitle: 'Service of Process Requirements',
      effectiveDate: '1998-01-01',
      description: 'Personal service required for custody proceedings',
      category: 'SERVICE_OF_PROCESS',
      triggers: [
        EventType.SERVICE_FAILED,
        EventType.SERVICE_ACKNOWLEDGMENT,
        EventType.EMERGENCY_ORDER,
        EventType.CUSTODY_ORDER
      ],
      compute: (event: CaseEvent, state: CaseState, timeline: CaseEvent[]) => {
        // Track service failures
        if (
          event.eventType === EventType.SERVICE_FAILED ||
          (event.eventType === EventType.SERVICE_ACKNOWLEDGMENT &&
            event.serviceResult === 'FAILED')
        ) {
          return {
            stateUpdates: {
              serviced: false
            },
            flags: [
              {
                type: 'SERVICE_FAILURE',
                category: 'SERVICE_OF_PROCESS' as FlagCategory,
                severity: 'EMERGENCY' as const,
                title: 'Defective Service of Process',
                description:
                  'Court orders issued without valid service of process. All subsequent orders may be void.',
                plainLanguage:
                  'You were never properly served with court papers. Any court orders made without proper notice to you may be invalid.',
                citation: 'W. Va. R. Civ. P. 4; W. Va. Code § 56-3-1',
                status: 'ACTIVE' as const,
                recommendedAction:
                  'File motion to vacate all orders for defective service',
                evidence: [
                  'No valid service completed',
                  event.notes || 'Service acknowledged as failed'
                ]
              }
            ]
          };
        }

        // Check if orders were issued without service
        if (
          event.eventType === EventType.EMERGENCY_ORDER ||
          event.eventType === EventType.CUSTODY_ORDER
        ) {
          const serviceCompleted = timeline.some(
            (e) =>
              e.eventType === EventType.SERVICE_COMPLETED &&
              new Date(e.occurredAt) < new Date(event.occurredAt)
          );

          if (!serviceCompleted && !state.serviced) {
            return {
              stateUpdates: {},
              flags: [
                {
                  type: 'ORDER_WITHOUT_SERVICE',
                  category: 'SERVICE_OF_PROCESS' as FlagCategory,
                  severity: 'CRITICAL' as const,
                  title: 'Court Order Issued Without Service',
                  description:
                    'A court order affecting custody was issued before the parent was properly served.',
                  plainLanguage:
                    'The court issued an order affecting your children before you were notified. You have the right to be served before orders are entered against you.',
                  citation: 'W. Va. R. Civ. P. 4(d)',
                  status: 'ACTIVE' as const,
                  recommendedAction: 'Challenge order as void for lack of personal jurisdiction'
                }
              ]
            };
          }
        }

        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // HEARING CANCELLATION PATTERN
    // ============================================================
    {
      id: 'WV-HEARING-PATTERN',
      jurisdiction: 'WV',
      citation: 'W. Va. Code § 49-4-601; U.S. Const. amend. XIV',
      statuteTitle: 'Right to Timely Hearing',
      effectiveDate: '2015-06-12',
      description: 'Pattern of hearing cancellations violates due process',
      category: 'HEARING_TIMELINE',
      triggers: [EventType.HEARING_CANCELLED],
      compute: (_event: CaseEvent, _state: CaseState, timeline: CaseEvent[]) => {
        const cancellations = timeline.filter(
          (e) => e.eventType === EventType.HEARING_CANCELLED
        );

        const newCount = cancellations.length;
        const flags = [];

        if (newCount >= 5) {
          flags.push({
            type: 'EXTREME_HEARING_PATTERN',
            category: 'HEARING_TIMELINE' as FlagCategory,
            severity: 'EMERGENCY' as const,
            title: 'Extreme Pattern of Hearing Cancellations',
            description: `${newCount} hearings have been cancelled. This represents a systematic denial of access to justice.`,
            plainLanguage: `${newCount} of your scheduled hearings have been cancelled. This pattern denies you the ability to present your case and constitutes a denial of due process.`,
            citation: 'U.S. Const. amend. XIV; W. Va. Code § 49-4-601',
            status: 'ACTIVE' as const,
            recommendedAction:
              'File emergency motion documenting pattern; consider federal civil rights complaint',
            evidence: cancellations.map((c) => `${c.title} - ${c.occurredAt}`)
          });
        } else if (newCount >= 3) {
          flags.push({
            type: 'HEARING_CANCELLATION_PATTERN',
            category: 'HEARING_TIMELINE' as FlagCategory,
            severity: 'CRITICAL' as const,
            title: 'Pattern of Hearing Cancellations',
            description: `${newCount} hearings have been cancelled, creating unreasonable delay.`,
            plainLanguage: `${newCount} hearings have been cancelled. You have a right to timely hearings to resolve your case.`,
            citation: 'W. Va. Code § 49-4-601',
            status: 'ACTIVE' as const,
            recommendedAction: 'File motion to set immediate hearing date with no further continuances'
          });
        } else if (newCount >= 2) {
          flags.push({
            type: 'MULTIPLE_CANCELLATIONS',
            category: 'HEARING_TIMELINE' as FlagCategory,
            severity: 'HIGH' as const,
            title: 'Multiple Hearing Cancellations',
            description: `${newCount} hearings have been cancelled.`,
            plainLanguage: `${newCount} hearings have been cancelled. Document the reasons and request expedited scheduling.`,
            citation: 'W. Va. Code § 49-4-601',
            status: 'ACTIVE' as const,
            recommendedAction: 'Request explanation for cancellations and expedited rescheduling'
          });
        }

        return {
          stateUpdates: {
            hearingsCancelled: newCount
          },
          flags
        };
      }
    },

    // ============================================================
    // CUSTODY REVERSAL TIMING
    // ============================================================
    {
      id: 'WV-CUSTODY-TIMING',
      jurisdiction: 'WV',
      citation: 'W. Va. Code § 48-9-401',
      statuteTitle: 'Custody Modification Standards',
      effectiveDate: '2001-10-01',
      description: 'Suspicious timing of custody changes',
      category: 'PROCEDURAL',
      triggers: [EventType.EMERGENCY_ORDER, EventType.CUSTODY_CHANGE],
      compute: (event: CaseEvent, _state: CaseState, timeline: CaseEvent[]) => {
        // Check for address notification shortly before custody change
        const addressNotifications = timeline.filter(
          (e) => e.eventType === EventType.ADDRESS_NOTIFICATION
        );

        const recentNotification = addressNotifications.find((notification) => {
          const notificationDate = new Date(notification.occurredAt);
          const orderDate = new Date(event.occurredAt);
          const daysBetweenEvents = daysBetween(notificationDate, orderDate);
          return daysBetweenEvents >= 0 && daysBetweenEvents <= 7;
        });

        if (recentNotification) {
          const daysBetweenEvents = daysBetween(recentNotification.occurredAt, event.occurredAt);
          return {
            stateUpdates: {},
            flags: [
              {
                type: 'SUSPICIOUS_CUSTODY_TIMING',
                category: 'PROCEDURAL' as FlagCategory,
                severity: 'HIGH' as const,
                title: 'Suspicious Timing of Custody Action',
                description: `Emergency custody order issued only ${daysBetweenEvents} days after mother notified court of new address.`,
                plainLanguage: `The court reversed custody just ${daysBetweenEvents} days after you notified them of your new address. This timing raises questions about whether the emergency action was truly based on child safety.`,
                citation: 'W. Va. Code § 48-9-401',
                status: 'ACTIVE' as const,
                recommendedAction: 'Document timeline and challenge basis for emergency determination'
              }
            ]
          };
        }

        return { stateUpdates: {}, flags: [] };
      }
    },

    // ============================================================
    // ADJUDICATORY HEARING DEADLINE
    // ============================================================
    {
      id: 'WV-49-4-601',
      jurisdiction: 'WV',
      citation: 'W. Va. Code § 49-4-601',
      statuteTitle: 'Adjudicatory Hearing Timeline',
      effectiveDate: '2015-06-12',
      description: 'Adjudicatory hearing required within 60 days',
      category: 'HEARING_TIMELINE',
      triggers: [EventType.PETITION_FILED],
      compute: (event: CaseEvent, state: CaseState) => {
        const filingDate = event.occurredAt;
        const deadline = addDays(filingDate, 60);

        return {
          stateUpdates: {
            deadlines: {
              ...state.deadlines,
              adjudicatoryHearing: {
                name: 'Adjudicatory Hearing',
                citation: 'W. Va. Code § 49-4-601',
                triggeredAt: filingDate,
                dueBy: deadline.toISOString(),
                completed: false
              }
            },
            safeguards: {
              ...state.safeguards,
              adjudicatoryHearing: {
                id: 'adjudicatoryHearing',
                name: 'Adjudicatory Hearing within 60 days',
                citation: 'W. Va. Code § 49-4-601',
                status: SafeguardStatus.PENDING,
                triggeredAt: filingDate,
                dueBy: deadline.toISOString()
              }
            }
          },
          flags: []
        };
      }
    },

    // ============================================================
    // HEARING HELD TRACKING
    // ============================================================
    {
      id: 'WV-HEARING-HELD',
      jurisdiction: 'WV',
      citation: 'W. Va. Code § 49-4-601',
      statuteTitle: 'Hearing Completion',
      effectiveDate: '2015-06-12',
      description: 'Track completed hearings and update safeguards',
      category: 'HEARING_TIMELINE',
      triggers: [EventType.HEARING_HELD],
      compute: (event: CaseEvent, state: CaseState) => {
        const hearingType = event.hearingType?.toLowerCase() || '';
        const updates: Partial<CaseState> = {
          hearingsHeld: state.hearingsHeld + 1,
          lastHearingDate: event.occurredAt
        };

        // Update relevant deadlines and safeguards
        if (hearingType.includes('preliminary')) {
          if (state.deadlines?.preliminaryHearing) {
            updates.deadlines = {
              ...state.deadlines,
              preliminaryHearing: {
                ...state.deadlines.preliminaryHearing,
                completed: true,
                completedAt: event.occurredAt
              }
            };
          }
          if (state.safeguards?.preliminaryHearing) {
            updates.safeguards = {
              ...state.safeguards,
              preliminaryHearing: {
                ...state.safeguards.preliminaryHearing,
                status: SafeguardStatus.COMPLETED,
                completedAt: event.occurredAt
              }
            };
          }
        }

        if (hearingType.includes('adjudicatory') || hearingType.includes('adjudication')) {
          if (state.deadlines?.adjudicatoryHearing) {
            updates.deadlines = {
              ...state.deadlines,
              adjudicatoryHearing: {
                ...state.deadlines.adjudicatoryHearing,
                completed: true,
                completedAt: event.occurredAt
              }
            };
          }
          if (state.safeguards?.adjudicatoryHearing) {
            updates.safeguards = {
              ...state.safeguards,
              adjudicatoryHearing: {
                ...state.safeguards.adjudicatoryHearing,
                status: SafeguardStatus.COMPLETED,
                completedAt: event.occurredAt
              }
            };
          }
        }

        return {
          stateUpdates: updates,
          flags: []
        };
      }
    },

    // ============================================================
    // DISPOSITIONAL HEARING REQUIREMENT
    // ============================================================
    {
      id: 'WV-49-4-604',
      jurisdiction: 'WV',
      citation: 'W. Va. Code § 49-4-604',
      statuteTitle: 'Dispositional Hearing Timeline',
      effectiveDate: '2015-06-12',
      description: 'Dispositional hearing required within 60 days of adjudication',
      category: 'HEARING_TIMELINE',
      triggers: [EventType.HEARING_HELD],
      compute: (event: CaseEvent, state: CaseState) => {
        const hearingType = event.hearingType?.toLowerCase() || '';

        if (hearingType.includes('adjudicatory') || hearingType.includes('adjudication')) {
          const deadline = addDays(event.occurredAt, 60);

          return {
            stateUpdates: {
              deadlines: {
                ...state.deadlines,
                dispositionalHearing: {
                  name: 'Dispositional Hearing',
                  citation: 'W. Va. Code § 49-4-604',
                  triggeredAt: event.occurredAt,
                  dueBy: deadline.toISOString(),
                  completed: false
                }
              },
              safeguards: {
                ...state.safeguards,
                dispositionalHearing: {
                  id: 'dispositionalHearing',
                  name: 'Dispositional Hearing within 60 days of adjudication',
                  citation: 'W. Va. Code § 49-4-604',
                  status: SafeguardStatus.PENDING,
                  triggeredAt: event.occurredAt,
                  dueBy: deadline.toISOString()
                }
              }
            },
            flags: []
          };
        }

        return { stateUpdates: {}, flags: [] };
      }
    }
  ];
}
