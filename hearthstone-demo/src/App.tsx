import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { createSolver } from './lib/solver'
import { loadFederalEquations } from './lib/federal'
import { loadWVEquations } from './lib/wv'
import { SAMPLE_CASE_EVENTS } from './data/sampleCase'
import type { SolverOutput } from './lib/types'

function App() {
  const [output, setOutput] = useState<SolverOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const solver = createSolver()
      solver.loadFederalEquations(loadFederalEquations())
      solver.loadJurisdiction('WV', loadWVEquations())

      const result = solver.solve(SAMPLE_CASE_EVENTS, 'WV')
      setOutput(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-hearthstone-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hearthstone-success mx-auto mb-4"></div>
          <p className="text-slate-400">Computing compliance state...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-hearthstone-bg flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-display font-bold text-xl mb-2">Computation Error</h2>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!output) {
    return null
  }

  return <Dashboard output={output} />
}

export default App
