# Custom Gate Creator - User Guide

## Overview

The Custom Gate Creator allows you to save combinations of single-qubit gates as reusable custom gates. This feature helps you create complex quantum operations that you can easily apply throughout your circuits.

## How to Create a Custom Gate

### Step 1: Build Your Gate Sequence

1. Clear your circuit canvas (or start with a fresh circuit)
2. Add single-qubit gates to **one qubit only**
3. Arrange them in the sequence you want

**Important Restrictions:**

- ✅ Only single-qubit gates (H, X, Y, Z, S, T, RX, RY, RZ, P)
- ❌ No multi-qubit gates (CNOT, CZ, SWAP, Toffoli)
- ✅ All gates must be on the same qubit
- ✅ You can include parametrized gates (RX, RY, RZ, P)

### Step 2: Open the Custom Gate Creator

1. Look in the left sidebar under "Circuit Controls"
2. Click the **"Create Custom Gate"** button
3. The button will be disabled if your circuit doesn't meet the requirements

### Step 3: Name Your Gate

1. **Gate Name** (required): Give your gate a descriptive name
   - Example: "Hadamard-X Combo" or "My Rotation"
2. **Symbol** (optional): A short symbol (max 4 characters) to display on the circuit
   - Example: "HX" or "ROT"
3. **Description** (optional): Describe what your gate does
   - Example: "Applies Hadamard followed by X gate"

### Step 4: Save

Click **"Create Gate"** and your custom gate will be:

- Saved to your browser's local storage
- Added to the gate palette under "Custom Gates"
- Ready to use immediately

## Using Custom Gates

Once created, custom gates appear in the sidebar under the **"Custom Gates"** category. Simply drag and drop them onto your circuit like any other gate.

**What happens when you drop a custom gate?**

- The gate expands into its component gates
- All gates are applied in sequence
- Parameters are preserved

## Example Use Cases

### Example 1: Hadamard-X Combination

```
Circuit: H → X on qubit 0
Custom Gate Name: "HX Gate"
Result: Reusable gate that applies H then X
```

### Example 2: Rotation Sequence

```
Circuit: RY(90°) → RZ(45°) → RY(-90°) on qubit 0
Custom Gate Name: "Z-Rotation Frame"
Result: Complex rotation sequence as one gate
```

### Example 3: Phase Gate Combo

```
Circuit: H → S → H on qubit 0
Custom Gate Name: "Phase Flip"
Result: Creates a specific phase transformation
```

## Validation Rules

The system will prevent you from creating a custom gate if:

- ❌ The circuit is empty
- ❌ The circuit contains multi-qubit gates
- ❌ Gates are on different qubits
- ❌ The circuit contains measurement gates

## Managing Custom Gates

### Viewing Your Custom Gates

- Custom gates appear in the sidebar under "Custom Gates"
- Each shows its name and symbol
- Hover over a gate to see its description

### Deleting Custom Gates

Currently, custom gates persist in local storage. To clear all custom gates:

1. Open browser console (F12)
2. Run: `localStorage.removeItem('quantumflow_custom_gates')`
3. Refresh the page

## Technical Details

### Storage

- Custom gates are stored in browser localStorage
- Key: `quantumflow_custom_gates`
- Format: JSON array of gate definitions

### Gate Structure

Each custom gate stores:

- Unique ID
- Name, symbol, description
- Category: "Custom Gates"
- Component gates (normalized to start at position 0, qubit 0)
- Creation timestamp

### Limitations

- Maximum 4 character symbol
- No multi-qubit operations in custom gates
- Custom gates are stored per browser (not synced across devices)
- Custom gates cannot contain other custom gates (prevents recursion)

## Tips & Best Practices

1. **Use Descriptive Names**: Make it easy to remember what each gate does
2. **Keep It Simple**: Start with 2-3 gate combinations
3. **Document Complex Gates**: Use the description field for gates with many operations
4. **Test First**: Build and test your gate sequence before saving
5. **Organize by Purpose**: Use consistent naming conventions (e.g., "Prep\_\*" for state preparation)

## Troubleshooting

### "Create Custom Gate" button is disabled

- Check that your circuit only contains single-qubit gates
- Ensure all gates are on the same qubit
- Verify the circuit is not empty

### Custom gate doesn't appear after creation

- Refresh the page
- Check browser console for errors
- Verify the gate was saved: `localStorage.getItem('quantumflow_custom_gates')`

### Custom gate doesn't work as expected

- The gate expands into its component gates when dropped
- Check that parameter values were preserved
- Verify gate order in the original sequence

## Future Enhancements

Potential improvements for future versions:

- Delete individual custom gates from UI
- Edit existing custom gates
- Export/import custom gate libraries
- Share custom gates with other users
- Custom gate visualization
- Nested custom gates (with safeguards)
