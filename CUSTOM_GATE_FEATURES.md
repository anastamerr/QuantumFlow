# Custom Gate Advanced Features

This document describes the new features added to the Custom Gate system in QuantumFlow.

## New Features Overview

### 1. **View/Edit Custom Gate Details**
- Each custom gate now has a menu (three-dot hamburger icon) in the sidebar
- Click the menu to access:
  - **View/Edit Details**: Opens a modal showing all gate information
  - **Delete Gate**: Removes the custom gate permanently

### 2. **Custom Gate Details Modal**
The details modal displays:
- **Gate Name**: The display name of the custom gate
- **Symbol**: The abbreviated symbol shown on the circuit (max 4 characters)
- **Description**: A detailed description of what the gate does
- **Composed Gates**: List of all gates that make up this custom gate
- **Metadata**: Creation date and unique ID

### 3. **Edit Mode**
- Click "Edit" button in the details modal to enter edit mode
- Modify the gate's name, symbol, and description
- Changes are saved to localStorage and immediately reflected in the sidebar
- Cannot edit the composed gates themselves (delete and recreate if needed)

### 4. **Automatic Gate Expansion**
When you drag and drop a custom gate onto the circuit:
- The system automatically **expands** it into its component gates
- All gates are placed sequentially on the same qubit
- Requires consecutive empty positions (checks for space before adding)
- Shows a success toast with the number of gates added

## Usage Guide

### Managing Custom Gates

#### View/Edit a Custom Gate
1. Locate your custom gate in the "Custom Gates" section of the sidebar
2. Click the **hamburger menu icon** (⋮) on the right side of the gate
3. Select "View/Edit Details"
4. In the modal:
   - View all gate information
   - Click "Edit" to modify name, symbol, or description
   - Click "Save Changes" to apply edits
   - Click "Close" to exit without changes

#### Delete a Custom Gate
1. Click the **hamburger menu icon** (⋮) on the custom gate
2. Select "Delete Gate"
3. Confirm deletion in the alert dialog
4. The gate will be removed from localStorage and the sidebar

### Using Custom Gates in Circuits

#### Applying a Custom Gate
1. **Drag** the custom gate from the sidebar
2. **Drop** it onto any qubit at any position
3. The gate automatically expands into its component gates
4. Each component gate is placed in sequential positions on the same qubit

#### Space Requirements
- Custom gates require **N consecutive empty positions** (where N = number of composed gates)
- Example: A custom gate with 3 gates (H, X, Y) needs 3 empty positions
- If there's not enough space, you'll see a warning message

#### Success Feedback
When a custom gate is successfully added:
- ✅ A success toast appears: "Custom gate added"
- Shows how many gates were expanded: "expanded into N gate(s)"
- All gates appear instantly on the circuit

## Technical Details

### Component Files Created
1. **`CustomGateMenu.tsx`**: Three-dot menu with delete/edit options
2. **`CustomGateDetailsModal.tsx`**: Modal for viewing and editing gate details

### Updated Files
1. **`customGateManager.ts`**: Added `updateCustomGate()` and `isCustomGate()` functions
2. **`Sidebar.tsx`**: Integrated menu and details modal with custom gates
3. **`CircuitCanvas.tsx`**: Added custom gate expansion logic in `handleDrop()`

### Key Functions

#### `updateCustomGate(gateId, updates)`
Updates an existing custom gate's metadata:
```typescript
updateCustomGate(gate.id, {
  name: "New Name",
  symbol: "NEW",
  description: "Updated description"
})
```

#### `isCustomGate(gate)`
Type guard to check if a gate is a custom gate:
```typescript
if (isCustomGate(gate)) {
  // gate is CustomGateDefinition type
  console.log(gate.composedGates);
}
```

#### `expandCustomGate(customGate, targetQubit, startPosition)`
Expands a custom gate into its component gates:
```typescript
const gates = expandCustomGate(customGate, 0, 5);
// Returns array of gates with updated positions and qubit numbers
```

### State Management
- Custom gates are stored in **localStorage** under `"quantumflow_custom_gates"`
- Changes to custom gates trigger a reload of the gate palette
- No page refresh needed for edits (refresh needed for new gates)

## User Experience Improvements

### Visual Feedback
- **Menu Icon**: Hamburger icon appears on hover over custom gates
- **Success Toasts**: Confirm when gates are added or updated
- **Warning Toasts**: Alert when there's insufficient space
- **Edit Indicator**: Modal title shows "Edit" or "View" mode

### Error Handling
- Validates gate name is not empty before saving
- Checks for consecutive space before expanding custom gates
- Prevents deletion while modal is animating
- Gracefully handles localStorage errors

### Accessibility
- Menu button has proper ARIA label
- Alert dialog follows accessibility guidelines
- Keyboard navigation fully supported
- Focus management in modals

## Examples

### Example 1: Creating and Using a Custom Bell State Prep
```
1. Create circuit: H on Q0, then save as custom gate "Bell Prep"
2. Clear circuit
3. Add 2 qubits
4. Drag "Bell Prep" to Q0, position 0
5. Result: H gate appears at Q0, position 0
```

### Example 2: Editing a Custom Gate
```
1. Find "My Gate" in Custom Gates section
2. Click hamburger menu → "View/Edit Details"
3. Click "Edit"
4. Change name to "My Quantum Gate"
5. Change description to "Applies H then X rotation"
6. Click "Save Changes"
7. Gate name updates immediately in sidebar
```

### Example 3: Space Validation
```
1. Create custom gate with 3 component gates (H, X, Y)
2. Add a circuit with existing gates at positions 0 and 1
3. Try to drop custom gate at position 0
4. Warning: "Not enough space - requires 3 consecutive positions"
5. Solution: Drop at position 2 or clear positions 0-2
```

## Troubleshooting

### Custom gate doesn't appear in sidebar after editing
- **Solution**: The gate should update automatically. If not, refresh the page.

### Can't drag custom gate to circuit
- **Check**: Ensure you have at least 1 qubit added to the circuit
- **Check**: Make sure the gate is draggable (cursor changes to "grab")

### "Not enough space" error
- **Cause**: Existing gates occupy the required positions
- **Solution**: Clear N consecutive positions (where N = number of composed gates)
- **Or**: Drop the custom gate at a different position

### Custom gate menu doesn't appear
- **Check**: Menu only appears for gates in "Custom Gates" category
- **Check**: Hover over the gate - menu appears on the right side
- **Try**: Refresh the page to reload custom gates

### Changes not saved after editing
- **Check**: localStorage must be enabled in your browser
- **Check**: Ensure you clicked "Save Changes" not "Cancel"
- **Try**: Check browser console for localStorage errors

## Best Practices

1. **Naming**: Use descriptive names like "Bell State Prep" instead of "Gate1"
2. **Symbols**: Keep symbols short (2-4 chars) for better circuit visualization
3. **Descriptions**: Add details about what the gate does and when to use it
4. **Organization**: Delete unused custom gates to keep the palette clean
5. **Testing**: Test custom gates on a simple circuit before using in complex algorithms
6. **Space**: Check circuit layout before adding large custom gates (many composed gates)

## Future Enhancements

Potential features for future versions:
- Export/import custom gates as JSON files
- Share custom gates with other users
- Visual editor for reordering composed gates
- Multi-qubit custom gates support
- Custom gate categories and tags
- Usage statistics for custom gates
