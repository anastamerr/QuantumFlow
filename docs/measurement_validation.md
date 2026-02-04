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

Q-COSMIC now reports explicit quantum data movements (QE/QX) in line with the
paper examples. The metrics are derived from input/measurement vectors:

```
entries = # input vectors
exits   = # measurement vectors
q_entries = 1 (if quantum processing present)
q_exits   = 1 (if quantum processing present)
total   = entries + exits + q_entries + q_exits
```

To match the paper’s Shor example (UC1: 2E, 2X, 1QE, 1QX = 6 QCFP), provide
`cosmic_input_vectors` and `cosmic_measurement_vectors` with two registers
(e.g., `[[0,1,2], [3,4]]`).
