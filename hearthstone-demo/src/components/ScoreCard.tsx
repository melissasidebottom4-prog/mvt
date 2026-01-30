interface ScoreCardProps {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

const RISK_CONFIG = {
  CRITICAL: {
    color: 'text-red-500',
    bg: 'bg-red-500',
    label: 'CRITICAL RISK',
    description: 'Immediate intervention required'
  },
  HIGH: {
    color: 'text-orange-500',
    bg: 'bg-orange-500',
    label: 'HIGH RISK',
    description: 'Significant compliance failures'
  },
  MEDIUM: {
    color: 'text-yellow-500',
    bg: 'bg-yellow-500',
    label: 'MEDIUM RISK',
    description: 'Notable compliance concerns'
  },
  LOW: {
    color: 'text-green-500',
    bg: 'bg-green-500',
    label: 'LOW RISK',
    description: 'Generally compliant'
  }
};

function ScoreGauge({ score }: { score: number }) {
  // Calculate the arc path for the gauge
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color based on score
  let gaugeColor = '#EF4444'; // red
  if (score >= 75) gaugeColor = '#22C55E'; // green
  else if (score >= 50) gaugeColor = '#EAB308'; // yellow
  else if (score >= 25) gaugeColor = '#F97316'; // orange

  return (
    <div className="relative w-48 h-28 mx-auto">
      <svg viewBox="0 0 200 110" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#334155"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <span className="text-4xl font-display font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

export function ScoreCard({
  score,
  riskLevel,
  totalViolations,
  criticalCount,
  highCount,
  mediumCount,
  lowCount
}: ScoreCardProps) {
  const risk = RISK_CONFIG[riskLevel];

  return (
    <div className="bg-hearthstone-surface rounded-lg border border-hearthstone-border p-4 md:p-6">
      <h2 className="font-display font-bold text-xl text-white mb-4 text-center">
        Compliance Score
      </h2>

      {/* Gauge */}
      <ScoreGauge score={score} />

      {/* Risk Level Badge */}
      <div className="text-center mt-4">
        <span
          className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${risk.bg}`}
        >
          {risk.label}
        </span>
        <p className="text-slate-400 text-sm mt-2">{risk.description}</p>
      </div>

      {/* Violation Breakdown */}
      <div className="mt-6 space-y-2">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          Violations by Severity
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-center">
            <span className="block text-2xl font-bold text-red-400">{criticalCount}</span>
            <span className="text-xs text-red-400/70">Critical/Emergency</span>
          </div>
          <div className="bg-orange-900/20 border border-orange-500/30 rounded p-2 text-center">
            <span className="block text-2xl font-bold text-orange-400">{highCount}</span>
            <span className="text-xs text-orange-400/70">High</span>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2 text-center">
            <span className="block text-2xl font-bold text-yellow-400">{mediumCount}</span>
            <span className="text-xs text-yellow-400/70">Medium</span>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2 text-center">
            <span className="block text-2xl font-bold text-blue-400">{lowCount}</span>
            <span className="text-xs text-blue-400/70">Low</span>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-hearthstone-border mt-4">
          <span className="text-3xl font-bold text-white">{totalViolations}</span>
          <span className="text-slate-400 ml-2">Total Violations</span>
        </div>
      </div>
    </div>
  );
}
