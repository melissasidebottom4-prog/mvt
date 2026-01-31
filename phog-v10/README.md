# PHOG V10 - Physics-Governed Receipt Engine

Execute physics laws. Verify constraints. Generate cryptographic receipts.

## Quick Start

```bash
cd phog-v10
npm install
npm start       # Run first receipt demo
npm test        # Run test suite
```

## Architecture

```
src/
├── parser.ts        # Parse .phog law definitions
├── executor.ts      # Execute laws with Math.js
├── receipt.ts       # Generate SHA-256 hashed receipts
├── physics-index.ts # 239 laws across 12 categories
└── index.ts         # Exports
```

## Law Format

```phog
law newton_second {
  F = m * a
  constant: g = 9.8
  constraint: abs(F - m * a) < 1e-6
}
```

## Categories (239 laws)

| Category | Laws | Examples |
|----------|------|----------|
| classical_mechanics | 20 | newton_second, kinetic_energy, momentum |
| continuum_fluids | 20 | bernoulli_steady, hydrostatic_pressure |
| electromagnetism | 20 | ohms_law, coulomb_point_charge |
| thermodynamics | 20 | ideal_gas_state, carnot_efficiency |
| quantum_mechanics | 20 | photon_energy, heisenberg_uncertainty |
| relativity | 20 | mass_energy, time_dilation |
| optics_waves | 20 | snells_law, wave_equation |
| acoustic_bio | 20 | chest_acoustic, metabolic_rate |
| water_memory | 20 | water_acoustic_memory |
| genome_waveform | 19 | helix_sine_wave, replication_fork |
| planetary_physics | 20 | escape_velocity, kepler_third |
| frontier_physics | 20 | speed_of_thought, casimir_effect |

## Test Coverage

**21 laws verified** - Hand-picked laws with simple numeric inputs.

**218 laws to discover** - Not bugs. Just unexplored.

---

## 218 Untested Laws: Not Bugs, Just Unexplored

These laws exist in the index but haven't been run yet.

**They are not "broken."**

**They are "questions we haven't asked."**

As we build Phase 2+, we'll:

1. **Run them** (execute with inputs)
2. **Observe receipts** (see what they compute)
3. **Categorize results:**
   - Works immediately -> use it
   - Needs inputs -> provide them
   - Needs syntax fix -> rewrite law

**This is discovery, not debugging.**

Each receipt is an ANSWER, not a test result.

---

## PHOG Philosophy

*"There are no failed laws, only incomplete questions."*

---

## Receipt Example

```json
{
  "phog_version": "10.0.0",
  "law_id": "newton_second",
  "timestamp": "2026-01-31T02:52:34.258Z",
  "input_state": { "m": 1, "a": 9.8 },
  "output_state": { "m": 1, "a": 9.8, "F": 9.8 },
  "constraints_met": true,
  "hash": "6622b310f75900dbd983441e5abe0f1c..."
}
```

## Phase 2 (Coming)

Time-stepping simulation for dynamic laws.
