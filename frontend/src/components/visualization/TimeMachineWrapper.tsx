import React from "react";
import { Gate, Qubit } from "../../store/slices/circuitSlice";
import {
  Gate as TimeMachineGate,
  Qubit as TimeMachineQubit,
} from "../../types/circuit";
import QuantumTimeMachine from "./QuantumTimeMachine";

const transformGates = (gates: Gate[]): TimeMachineGate[] => {
  return gates.map((gate) => ({
    ...gate,
    name: gate.type,
    symbol: gate.type,
    description: `${gate.type} gate`,
    category: "basic",
    color: "blue",
  }));
};

const transformQubits = (qubits: Qubit[]): TimeMachineQubit[] => {
  return qubits;
};

interface TimeMachineWrapperProps {
  qubits: Qubit[];
  gates: Gate[];
  isRunning?: boolean;
  onStateChange?: (state: any) => void;
  onComplete?: (finalProbabilities: Record<string, number>) => void;
  autoPlay?: boolean;
  showEntanglement?: boolean;
  showGateImpacts?: boolean;
  height?: number;
}

const TimeMachineWrapper: React.FC<TimeMachineWrapperProps> = (props) => {
  const { qubits, gates, ...restProps } = props;

  const transformedGates = transformGates(gates);
  const transformedQubits = transformQubits(qubits);

  return (
    <QuantumTimeMachine
      qubits={transformedQubits}
      gates={transformedGates}
      {...restProps}
    />
  );
};

export default TimeMachineWrapper;
