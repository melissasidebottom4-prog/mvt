import { ComplianceFlag, FlagSeverity } from '../lib/types';

interface ComplianceFlagsProps {
  flags: ComplianceFlag[];
}

const SEVERITY_CONFIG: Record<
  FlagSeverity,
  { bg: string; border: string; text: string; badge: string; label: string }
> = {
  EMERGENCY: {
    bg: 'bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-400',
    badge: 'bg-red-500',
    label: 'EMERGENCY'
  },
  CRITICAL: {
    bg: 'bg-red-900/20',
    border: 'border-red-600',
    text: 'text-red-400',
    badge: 'bg-red-600',
    label: 'CRITICAL'
  },
  HIGH: {
    bg: 'bg-orange-900/20',
    border: 'border-orange-500',
    text: 'text-orange-400',
    badge: 'bg-orange-500',
    label: 'HIGH'
  },
  MEDIUM: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500',
    label: 'MEDIUM'
  },
  LOW: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500',
    text: 'text-blue-400',
    badge: 'bg-blue-500',
    label: 'LOW'
  }
};

export function ComplianceFlags({ flags }: ComplianceFlagsProps) {
  if (flags.length === 0) {
    return (
      <div className="bg-hearthstone-surface rounded-lg border border-hearthstone-border p-6">
        <h2 className="font-display font-bold text-xl text-white mb-4">Compliance Violations</h2>
        <div className="text-center py-8">
          <div className="text-hearthstone-success text-4xl mb-2">✓</div>
          <p className="text-slate-400">No compliance violations detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-hearthstone-surface rounded-lg border border-hearthstone-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-white">Compliance Violations</h2>
        <span className="text-sm text-slate-400">{flags.length} violations detected</span>
      </div>

      <div className="space-y-4">
        {flags.map((flag, index) => {
          const config = SEVERITY_CONFIG[flag.severity];

          return (
            <div
              key={`${flag.type}-${index}`}
              className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded text-white ${config.badge}`}
                >
                  {config.label}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                  {flag.category.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Title */}
              <h3 className={`font-semibold text-lg ${config.text}`}>{flag.title}</h3>

              {/* Description */}
              <p className="text-slate-300 text-sm mt-2">{flag.description}</p>

              {/* Plain Language Explanation */}
              <div className="mt-3 p-3 bg-slate-800/50 rounded">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Plain Language
                </p>
                <p className="text-slate-200 text-sm">{flag.plainLanguage}</p>
              </div>

              {/* Citation */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Citation: </span>
                  <span className="text-slate-300 font-mono">{flag.citation}</span>
                </div>
              </div>

              {/* Evidence */}
              {flag.evidence && flag.evidence.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Evidence</p>
                  <ul className="text-sm text-slate-300 list-disc list-inside">
                    {flag.evidence.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Action */}
              {flag.recommendedAction && (
                <div className="mt-3 p-3 bg-hearthstone-success/10 border border-hearthstone-success/30 rounded">
                  <p className="text-xs text-hearthstone-success uppercase tracking-wide mb-1">
                    Recommended Action
                  </p>
                  <p className="text-slate-200 text-sm">{flag.recommendedAction}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
