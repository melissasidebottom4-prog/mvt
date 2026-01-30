import { CaseEvent, EventType } from '../lib/types';

interface TimelineProps {
  events: CaseEvent[];
  flaggedEventIds: Set<string>;
}

const EVENT_ICONS: Partial<Record<EventType, string>> = {
  [EventType.ARREST]: '⚠️',
  [EventType.EMERGENCY_ORDER]: '📋',
  [EventType.CUSTODY_CHANGE]: '👨‍👩‍👧‍👦',
  [EventType.HEARING_CANCELLED]: '❌',
  [EventType.HEARING_HELD]: '✅',
  [EventType.SERVICE_ACKNOWLEDGMENT]: '📬',
  [EventType.SERVICE_FAILED]: '📭',
  [EventType.FINDING_ISSUED]: '⚖️',
  [EventType.ADDRESS_NOTIFICATION]: '📍',
  [EventType.VISITATION_DENIED]: '🚫',
  [EventType.COMMUNICATION_SENT]: '✉️'
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getEventTypeLabel(type: EventType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function Timeline({ events, flaggedEventIds }: TimelineProps) {
  return (
    <div className="bg-hearthstone-surface rounded-lg border border-hearthstone-border p-4 md:p-6">
      <h2 className="font-display font-bold text-xl text-white mb-4">Case Timeline</h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-hearthstone-border" />

        <div className="space-y-4">
          {events.map((event, index) => {
            const isFlagged = flaggedEventIds.has(event.id);
            const icon = EVENT_ICONS[event.eventType] || '📄';

            return (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${
                      isFlagged
                        ? 'bg-hearthstone-emergency ring-2 ring-hearthstone-emergency/50'
                        : 'bg-hearthstone-border'
                    }`}
                >
                  <span className="text-[10px]">{icon}</span>
                </div>

                {/* Event card */}
                <div
                  className={`rounded-lg p-3 transition-colors
                    ${
                      isFlagged
                        ? 'bg-red-900/20 border border-red-500/50'
                        : 'bg-hearthstone-bg border border-hearthstone-border'
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400">{formatDate(event.occurredAt)}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {getEventTypeLabel(event.eventType)}
                    </span>
                    {isFlagged && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                        VIOLATION
                      </span>
                    )}
                  </div>

                  <h3 className="font-medium text-white text-sm">{event.title}</h3>

                  {event.description && (
                    <p className="text-slate-400 text-sm mt-1">{event.description}</p>
                  )}

                  {event.notes && (
                    <p className="text-slate-500 text-xs mt-2 italic">Note: {event.notes}</p>
                  )}

                  {event.actorRole && (
                    <p className="text-slate-500 text-xs mt-1">Actor: {event.actorRole}</p>
                  )}
                </div>

                {/* Connector to next event */}
                {index < events.length - 1 && (
                  <div className="absolute left-[18px] top-full h-4 w-0.5 bg-hearthstone-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
