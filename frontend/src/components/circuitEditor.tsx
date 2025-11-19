import React, { useEffect, useRef } from 'react';
import { Box, Flex, useBreakpointValue } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';

import SnapshotViewer from './SnapshotViewer';
import Toolbar from './layout/Sidebar';
import CircuitEditor from './CircuitEditor';

import { setSnapshots, clearSnapshots } from '../features/snapshots/snapshotsSlice';

import {
  normalizeSnapshot,
  calculateTotalSize,
  shouldAutoCollapse,
} from '../utils/snapshotSafetyUtils';

const CircuitPage = () => {
  const dispatch = useDispatch();
  const workerRef = useRef<Worker | null>(null);

  // Layout responsiveness
  const flexDirection = useBreakpointValue<'row' | 'column'>({
    base: 'column',
    md: 'row',
  });

  const snapshotWidth = useBreakpointValue({
    base: '100%',
    md: '400px',
    lg: '450px',
  });

  // -----------------------------
  // 1️⃣ INITIALIZE WORKER
  // -----------------------------
  useEffect(() => {
    const worker = new Worker(new URL('../workers/state_worker.ts', import.meta.url), {
      type: 'module'
    });

    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { snapshots } = e.data;

      if (!snapshots) {
        dispatch(clearSnapshots());
        return;
      }

      const normalized = snapshots.map((raw: any, index: number) =>
        normalizeSnapshot(raw, index)
      );

      const totalChars = calculateTotalSize(normalized);
      const autoCollapsed = shouldAutoCollapse(normalized);

      dispatch(
        setSnapshots({
          snapshots: normalized,
          totalCharacterCount: totalChars,
          autoCollapsed,
        })
      );
    };

    return () => worker.terminate();
  }, [dispatch]);

  // -----------------------------
  // 2️⃣ HANDLER CALLED BY TOOLBAR
  // -----------------------------
  const handleRunWithSnapshots = (numQubits: number, gates: any[]) => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      action: 'RUN_EVOLUTION',
      numQubits,
      gates,
    });
  };

  // -----------------------------
  // 3️⃣ HANDLER FOR NORMAL EXECUTION
  // -----------------------------
  const handleRunWithoutSnapshots = () => {
    dispatch(clearSnapshots());
  };
interface CircuitPageProps {
  numQubits: number;
  gates: any[];
  
  // This is the new prop definition:
  onReturnWithSnapshots: (numQubits: number, gates: any[]) => void;
  // If you are using the other handler as well:
  onReturnWithoutSnapshots: (numQubits: number, gates: any[]) => void;
}
  // -----------------------------
  // 4️⃣ PAGE LAYOUT
  // -----------------------------
  return (
    <Flex direction="column" h="100vh" overflow="hidden">
      <Toolbar
        onRunWithSnapshots={handleRunWithSnapshots}
        onRunWithoutSnapshots={handleRunWithoutSnapshots}
      />

      <Flex direction={flexDirection} flex="1" overflow="hidden">
        {/* LEFT SIDE: circuit editor */}
        <Box flex="1" overflow="hidden">
          <CircuitEditor />
        </Box>

        {/* RIGHT SIDE: snapshot panel */}
        <Box
          w={snapshotWidth}
          borderLeft="1px solid"
          borderColor="gray.200"
          bg="gray.50"
          overflow="hidden"
        >
          <SnapshotViewer />
        </Box>
      </Flex>
    </Flex>
  );
};

export default CircuitPage;