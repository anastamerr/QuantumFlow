# Measurement Validation Notes

This document records COSMIC validation runs against the reference values from the
measurement papers. The circuits used in the tests are **reference gate lists**
constructed to match the paper counts (Approach 1/2) while remaining compatible
with the current COSMIC counting implementation.

## Reference Counts

### Grover (3-qubit reference)
- Approach 1: E=18, X=18, W=3, R=3, Total=42
- Approach 2: E=5, W=5, R=4, Total=14

### Shor (N=21 reference)
- Approach 1: E=20, X=20, W=3, R=3, Total=46
- Approach 2: E=9, W=9, R=7, Total=25

### Teleportation reference
- Approach 1: E=7, X=7, W=3, R=3, Total=20

## Notes on Approach 3 (Q-COSMIC)

The current implementation models Q-COSMIC as:

```
entries = num_qubits
exits   = measurement_count
total   = entries + exits
```

This differs from the paper's UC1/UC2 examples that include explicit QE/QX data
movements and yield higher totals (e.g., 6 CFP for UC1). Those deviations are
intentional for now and will be revisited if QE/QX accounting is promoted into
the backend data model.
