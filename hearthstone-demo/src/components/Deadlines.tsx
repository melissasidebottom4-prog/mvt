import { Deadline } from '../lib/types';

interface DeadlinesProps {
  upcoming: Deadline[];
  missed: Deadline[];
}

export function Deadlines({ upcoming, missed }: DeadlinesProps) {
  if (upcoming.length === 0 && missed.length === 0) {
    return null;
  }

  return (
    <div className="bg-hearthstone-surface rounded-lg border border-hearthstone-border p-4 md:p-6">
      <h2 className="font-display font-bold text-xl text-white mb-4">Case Deadlines</h2>

      <div className="space-y-4">
        {/* Missed Deadlines */}
        {missed.length > 0 && (
          <div>
            <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wide mb-2">
              Missed Deadlines
            </h3>
            <div className="space-y-2">
              {missed.map((deadline) => (
                <div
                  key={deadline.id}
                  className="bg-red-900/20 border border-red-500/30 rounded p-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{deadline.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{deadline.citation}</p>
                    </div>
                    <span className="text-red-400 font-bold text-sm">
                      {deadline.daysOverdue} days overdue
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Due: {new Date(deadline.dueBy).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        {upcoming.length > 0 && (
          <div>
            <h3 className="text-yellow-400 font-semibold text-sm uppercase tracking-wide mb-2">
              Upcoming Deadlines
            </h3>
            <div className="space-y-2">
              {upcoming.map((deadline) => (
                <div
                  key={deadline.id}
                  className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{deadline.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{deadline.citation}</p>
                    </div>
                    <span
                      className={`font-bold text-sm ${
                        deadline.daysRemaining <= 7 ? 'text-orange-400' : 'text-yellow-400'
                      }`}
                    >
                      {deadline.daysRemaining} days
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Due: {new Date(deadline.dueBy).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
