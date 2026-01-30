interface RecommendationsProps {
  recommendations: {
    immediate: string[];
    legal: string[];
    documentation: string[];
  };
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  const hasRecommendations =
    recommendations.immediate.length > 0 ||
    recommendations.legal.length > 0 ||
    recommendations.documentation.length > 0;

  if (!hasRecommendations) {
    return null;
  }

  return (
    <div className="bg-hearthstone-surface rounded-lg border border-hearthstone-border p-4 md:p-6">
      <h2 className="font-display font-bold text-xl text-white mb-4">Recommended Actions</h2>

      <div className="space-y-4">
        {/* Immediate Actions */}
        {recommendations.immediate.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-2">
              <span className="text-lg">🚨</span>
              Immediate Actions Required
            </h3>
            <ul className="space-y-2">
              {recommendations.immediate.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-200 text-sm">
                  <span className="text-red-400 mt-0.5">→</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legal Actions */}
        {recommendations.legal.length > 0 && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold flex items-center gap-2 mb-2">
              <span className="text-lg">⚖️</span>
              Legal Actions
            </h3>
            <ul className="space-y-2">
              {recommendations.legal.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-200 text-sm">
                  <span className="text-orange-400 mt-0.5">→</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documentation */}
        {recommendations.documentation.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
              <span className="text-lg">📋</span>
              Documentation Needed
            </h3>
            <ul className="space-y-2">
              {recommendations.documentation.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-200 text-sm">
                  <span className="text-blue-400 mt-0.5">→</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
