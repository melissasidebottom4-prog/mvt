import { SolverOutput } from '../lib/types';
import { CASE_SUMMARY } from '../data/sampleCase';
import { ScoreCard } from './ScoreCard';
import { ComplianceFlags } from './ComplianceFlags';
import { Timeline } from './Timeline';
import { Recommendations } from './Recommendations';
import { Deadlines } from './Deadlines';

interface DashboardProps {
  output: SolverOutput;
}

function Header() {
  return (
    <header className="bg-hearthstone-surface border-b border-hearthstone-border">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
              Hearthstone Continuum
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Federal Child Welfare Compliance Monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-hearthstone-bg border border-hearthstone-border rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors no-print"
            >
              Export PDF
            </button>
            <span className="px-3 py-1 bg-hearthstone-success/20 border border-hearthstone-success/30 rounded text-hearthstone-success text-xs font-medium">
              DEMO
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function CaseSummaryCard() {
  return (
    <div className="bg-hearthstone-surface rounded-lg border border-hearthstone-border p-4 md:p-6">
      <h2 className="font-display font-bold text-xl text-white mb-4">Case Summary</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">Case ID</p>
          <p className="text-white font-mono">{CASE_SUMMARY.caseId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">Jurisdiction</p>
          <p className="text-white">{CASE_SUMMARY.jurisdiction} - {CASE_SUMMARY.county} County</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Children</p>
        <div className="flex flex-wrap gap-2">
          {CASE_SUMMARY.children.map((child) => (
            <span
              key={child.name}
              className="px-3 py-1 bg-hearthstone-bg rounded-full text-sm text-white"
            >
              {child.name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Key Facts</p>
        <ul className="space-y-1">
          {CASE_SUMMARY.keyFacts.map((fact, i) => (
            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
              <span className="text-hearthstone-success mt-1">•</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-4 border-t border-hearthstone-border">
        <p className="text-xs text-slate-400 uppercase tracking-wide">Adjudication Date</p>
        <p className="text-white font-medium">
          {new Date(CASE_SUMMARY.adjudicationDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-hearthstone-surface border-t border-hearthstone-border py-6 mt-8 no-print">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-slate-400 text-sm">
          Hearthstone Continuum - Laws are equations. Cases are initial conditions. Compliance is computed state.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Built for HHS demonstration • Computed at{' '}
          {new Date().toLocaleString()}
        </p>
      </div>
    </footer>
  );
}

export function Dashboard({ output }: DashboardProps) {
  // Create set of flagged event IDs for timeline highlighting
  const flaggedEventIds = new Set(
    output.compliance.flags
      .filter((f) => f.triggeredByEvent)
      .map((f) => f.triggeredByEvent!)
  );

  return (
    <div className="min-h-screen bg-hearthstone-bg">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Top row - Score and Case Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <ScoreCard
              score={output.compliance.score}
              riskLevel={output.compliance.riskLevel}
              totalViolations={output.compliance.totalViolations}
              criticalCount={output.compliance.criticalCount}
              highCount={output.compliance.highCount}
              mediumCount={output.compliance.mediumCount}
              lowCount={output.compliance.lowCount}
            />
          </div>
          <div className="lg:col-span-2">
            <CaseSummaryCard />
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <Recommendations recommendations={output.recommendations} />
        </div>

        {/* Deadlines */}
        <div className="mb-6">
          <Deadlines upcoming={output.deadlines.upcoming} missed={output.deadlines.missed} />
        </div>

        {/* Main content - Flags and Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="print-break">
            <ComplianceFlags flags={output.compliance.flags} />
          </div>
          <div className="print-break">
            <Timeline events={output.timeline} flaggedEventIds={flaggedEventIds} />
          </div>
        </div>

        {/* Raw Data (for debugging/verification) */}
        <details className="mt-8 no-print">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-300 text-sm">
            View Raw Computation Data
          </summary>
          <pre className="mt-4 p-4 bg-hearthstone-surface rounded-lg border border-hearthstone-border text-xs text-slate-400 overflow-auto max-h-96">
            {JSON.stringify(output, null, 2)}
          </pre>
        </details>
      </main>

      <Footer />
    </div>
  );
}
