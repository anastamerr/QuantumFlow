import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import { Gate } from '../../types/circuit';
import { QuantumState, simulateGateApplication, calculateProbabilities } from '../../utils/stateEvolution';

interface CircuitTimelineGraphProps {
  circuit: Gate[];
  numQubits: number;
  width?: number;
  height?: number;
}

interface TimelineDataPoint {
  step: number;
  stepLabel: string;
  [basisState: string]: number | string; // Dynamic basis state probabilities
}

const CircuitTimelineGraph: React.FC<CircuitTimelineGraphProps> = ({
  circuit,
  numQubits,
  width,
  height = 400,
}) => {
  // Theme colors
  const textColor = useColorModeValue('#4A5568', '#CBD5F5');
  const gridColor = useColorModeValue('#E2E8F0', '#2D3748');
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const tooltipText = useColorModeValue('gray.800', 'gray.100');
  const tooltipSecondary = useColorModeValue('gray.600', 'gray.300');

  // Color palette for basis state lines
  const colorPalette = [
    '#3182CE', // blue
    '#38A169', // green
    '#D69E2E', // yellow
    '#ED64A6', // pink
    '#DD6B20', // orange
    '#9F7AEA', // purple
    '#319795', // teal
    '#718096', // gray
    '#2B6CB0', // dark blue
    '#805AD5', // dark purple
    '#C53030', // red
    '#48BB78', // light green
  ];

  // Compute timeline data by simulating circuit step-by-step
  const timelineData = useMemo(() => {
    if (numQubits === 0 || circuit.length === 0) {
      return [];
    }

    // Initialize quantum state: all qubits in |0⟩
    const initialState: QuantumState = {};
    const zeroState = '0'.repeat(numQubits);
    initialState[zeroState] = [1, 0]; // amplitude 1+0i

    // Fill all other states with zero amplitude
    const totalStates = Math.pow(2, numQubits);
    for (let i = 0; i < totalStates; i++) {
      const binaryString = i.toString(2).padStart(numQubits, '0');
      if (binaryString !== zeroState) {
        initialState[binaryString] = [0, 0];
      }
    }

    const data: TimelineDataPoint[] = [];
    let currentState: QuantumState = { ...initialState };

    // Add initial state (step 0)
    const initialProbs = calculateProbabilities(currentState);
    const initialDataPoint: TimelineDataPoint = {
      step: 0,
      stepLabel: 'Initial',
      ...initialProbs,
    };
    data.push(initialDataPoint);

    // Sort gates by position
    const sortedGates = [...circuit].sort((a, b) => (a.position || 0) - (b.position || 0));

    // Apply each gate step-by-step
    sortedGates.forEach((gate, index) => {
      try {
        // Apply the gate to current state
        currentState = simulateGateApplication(currentState, gate, numQubits);

        // Calculate probabilities after this gate
        const probs = calculateProbabilities(currentState);

        // Create data point for this step
        const stepLabel = gate.name || gate.type || `Gate ${index + 1}`;
        const dataPoint: TimelineDataPoint = {
          step: index + 1,
          stepLabel,
          ...probs,
        };
        data.push(dataPoint);
      } catch (err) {
        console.error(`Error applying gate at step ${index + 1}:`, err);
        // Continue with previous state if gate application fails
      }
    });

    return data;
  }, [circuit, numQubits]);

  // Get all unique basis states across all steps
  const allBasisStates = useMemo(() => {
    const statesSet = new Set<string>();
    timelineData.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (key !== 'step' && key !== 'stepLabel') {
          statesSet.add(key);
        }
      });
    });
    return Array.from(statesSet).sort();
  }, [timelineData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as TimelineDataPoint;
      const stepLabel = dataPoint.stepLabel || `Step ${dataPoint.step}`;

      return (
        <Box
          bg={tooltipBg}
          p={3}
          borderRadius="md"
          boxShadow="lg"
          border="1px solid"
          borderColor={gridColor}
        >
          <Text fontWeight="bold" mb={2} color={tooltipText}>
            {stepLabel} (Step {dataPoint.step})
          </Text>
          {payload
            .filter((item: any) => item.value > 0.0001) // Only show significant probabilities
            .sort((a: any, b: any) => b.value - a.value) // Sort by probability
            .slice(0, 10) // Limit to top 10
            .map((item: any) => (
              <Text key={item.dataKey} fontSize="sm" color={tooltipSecondary}>
                |{item.dataKey}⟩: {(item.value * 100).toFixed(4)}% ({item.value.toFixed(6)})
              </Text>
            ))}
        </Box>
      );
    }
    return null;
  };

  if (timelineData.length === 0) {
    return (
      <Box height={height} display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor}>No circuit data to visualize</Text>
      </Box>
    );
  }

  if (allBasisStates.length === 0) {
    return (
      <Box height={height} display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor}>No basis states found</Text>
      </Box>
    );
  }

  return (
    <Box width={width || '100%'} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={timelineData}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="step"
            tick={{ fill: textColor }}
            label={{
              value: 'Gate Step',
              position: 'insideBottom',
              offset: -10,
              style: { fill: textColor, textAnchor: 'middle' },
            }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            tick={{ fill: textColor }}
            label={{
              value: 'Probability',
              angle: -90,
              position: 'insideLeft',
              style: { fill: textColor, textAnchor: 'middle' },
            }}
          />
          <RechartsTooltip
            cursor={{ stroke: textColor, strokeWidth: 1 }}
            content={<CustomTooltip />}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => `|${value}⟩`}
          />
          {allBasisStates.map((basisState, index) => (
            <Line
              key={basisState}
              type="monotone"
              dataKey={basisState}
              stroke={colorPalette[index % colorPalette.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={800}
              connectNulls
              // Make lines thinner/fade for very small probabilities
              strokeOpacity={1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CircuitTimelineGraph;

