import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { BookOpen, LogOut, Dna } from 'lucide-react';

// --- 1. GAME LOGIC & STATE (Self-Contained Model) ---

type QubitPosition = '0' | '1' | '+' | '-' | '+i' | '-i';
type CardType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'I' | 'Meas' | '√X';
type GameMode = 'PVP' | 'PVC';

interface Card {
  id: string;
  type: CardType;
}

interface Player {
  id: number;
  name: string;
  endzone: QubitPosition; 
  touchdowns: number;
  hand: Card[];
}

interface PendingMove {
    newPos: QubitPosition;
    nextPid: number;
    newLastAction: string;
    updatedPlayers: Record<number, Player>;
    isOver: boolean;
    newDeck: Card[];
}

interface GameState {
  gameId: string;
  mode: GameMode;
  ballPosition: QubitPosition;
  currentPlayerId: number;
  deck: Card[];
  players: Record<number, Player>;
  lastAction: string;
  lastDieRoll: number | null;
  isOver: boolean;
  error: string | null;
  rollTrigger: number;
  isDiceRolling: boolean; 
  pendingMove: PendingMove | null; 
}

const DECK_COMPOSITION: Record<CardType, number> = {
  'H': 7, 'S': 7, 'X': 4, 'Y': 9, 'Z': 7, 'I': 3, 'Meas': 3, '√X': 12
};

// Quantum Gate Transition Logic
const GATE_TRANSITIONS: Record<string, Record<QubitPosition, QubitPosition>> = {
  'I': { '0': '0', '1': '1', '+': '+', '-': '-', '+i': '+i', '-i': '-i' },
  'X': { '0': '1', '1': '0', '+': '+', '-': '-', '+i': '-i', '-i': '+i' },
  'Y': { '0': '1', '1': '0', '+': '-', '-': '+', '+i': '+i', '-i': '-i' },
  'Z': { '0': '0', '1': '1', '+': '-', '-': '+', '+i': '-i', '-i': '+i' },
  'H': { '0': '+', '1': '-', '+': '0', '-': '1', '+i': '-i', '-i': '+i' },
  'S': { '0': '0', '1': '1', '+': '+i', '-': '-i', '+i': '-', '-i': '+' },
  '√X': { '0': '-i', '1': '+i', '+': '+', '-': '-', '+i': '0', '-i': '1' },
};

// Simple UUID generator
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  Object.entries(DECK_COMPOSITION).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) deck.push({ id: uuidv4(), type: type as CardType });
  });
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Generates a random 0 or 1 value, and ensures the position matches the value.
const rollDie = () => {
    const val = Math.random() < 0.5 ? 0 : 1;
    const pos = val === 0 ? '0' : '1';
    return { val, pos: pos as QubitPosition };
};

const initialState: GameState = {
  gameId: '', mode: 'PVC', ballPosition: '0', currentPlayerId: 1, deck: [],
  players: { 
      1: { id: 1, name: 'Player 1', endzone: '+', touchdowns: 0, hand: [] }, 
      2: { id: 2, name: 'Player 2', endzone: '-', touchdowns: 0, hand: [] } 
  },
  lastAction: 'Game Ready', lastDieRoll: null, isOver: true, error: null,
  rollTrigger: 0,
  isDiceRolling: false,
  pendingMove: null,
};

function gameReducer(state: GameState, action: any): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const deck = generateDeck();
      const p1Hand = deck.splice(0, 4);
      const p2Hand = deck.splice(0, 4);
      const kickoff = rollDie(); // Initial Roll 1
      
      const starterId = 1; // Player 1 ALWAYS starts
      
      // Calculate Endzones: P1 goal is opposite the start position's axis pole.
      const p1Endzone = kickoff.pos === '0' ? '-' : '+'; 
      const p2Endzone = kickoff.pos === '0' ? '+' : '-';
      
      const p2Name = action.mode === 'PVC' ? 'Computer' : 'Player 2';
      
      const updatedPlayers: Record<number, Player> = {
          1: { ...state.players[1], name: 'Player 1', endzone: p1Endzone, hand: p1Hand, touchdowns: 0 },
          2: { ...state.players[2], name: p2Name, endzone: p2Endzone, hand: p2Hand, touchdowns: 0 }
      };

      const finalAction = `Kickoff roll: ${kickoff.val}. Ball placed at ${kickoff.pos}. Player 1 starts. P1 Goal: ${p1Endzone}, P2 Goal: ${p2Endzone}.`;

      // Store deferred move for resolution after animation
      const pending: PendingMove = {
          newPos: kickoff.pos, // Final position after roll
          nextPid: starterId,
          newLastAction: finalAction,
          updatedPlayers: updatedPlayers,
          isOver: false,
          newDeck: deck,
      };
      
      // ballPosition remains fixed at its initial state ('0') during the roll (Freeze)
      const preRollPos = state.ballPosition === '0' || state.ballPosition === '1' ? state.ballPosition : '0';

      return {
        ...state, 
        gameId: uuidv4(), 
        mode: action.mode, 
        isOver: false, 
        deck, 
        players: updatedPlayers,
        lastDieRoll: kickoff.val, 
        
        // --- Freezing State ---
        ballPosition: preRollPos, // Stays fixed visually
        currentPlayerId: 1, 
        lastAction: 'KICKOFF ROLLING...', 
        rollTrigger: state.rollTrigger + 1,
        isDiceRolling: true, 
        pendingMove: pending,
      };
    }
    case 'PLAY_CARD': {
      if (state.isOver || state.isDiceRolling) return state; // Block moves during roll
      const { playerId, cardId } = action;
      if (playerId !== state.currentPlayerId) return { ...state, error: "It's not your turn." };
      const player = state.players[playerId];
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return { ...state, error: "Card not found." };

      const newHand = [...player.hand];
      const playedCard = newHand.splice(cardIndex, 1)[0];
      const newDeck = [...state.deck];
      if (newDeck.length > 0) newHand.push(newDeck.pop()!);

      let newPos = state.ballPosition;
      let desc = '';
      let roll = state.lastDieRoll;
      let rollHappened = false;
      let shouldFreeze = false;
      let nextPid = playerId === 1 ? 2 : 1;
      
      const updatedPlayers = { ...state.players, [playerId]: { ...player, hand: newHand } };
      
      // 1. Determine new position or trigger measurement roll
      if (playedCard.type === 'Meas') {
        if (['+', '-', '+i', '-i'].includes(newPos)) {
          const outcome = rollDie();
          newPos = outcome.pos; // Post-roll position
          roll = outcome.val;
          desc = `Played Meas. Collapsed to ${newPos}`;
          rollHappened = true;
          shouldFreeze = true;
        } else {
          // Standard gate move applied instantly
          const trans = GATE_TRANSITIONS[playedCard.type];
          newPos = trans ? trans[newPos] : newPos;
          desc = `Played ${playedCard.type}: ${state.ballPosition} → ${newPos}`;
        }
      } else {
        const trans = GATE_TRANSITIONS[playedCard.type];
        newPos = trans ? trans[newPos] : newPos;
        desc = `Played ${playedCard.type}: ${state.ballPosition} → ${newPos}`;
      }

      let newLastAction = desc;
      const preRollPos = state.ballPosition; // Save current position for freeze

      // 2. Check for Score (Safety/Own Goal)
      if (newPos === player.endzone) {
        // SCORING: Player moved ball to their OWN goal (Safety/Own Goal)
        const opponentId = playerId === 1 ? 2 : 1;
        const opponentName = updatedPlayers[opponentId].name;
        updatedPlayers[opponentId].touchdowns += 1; // Opponent scores
        
        // Roll die to reset position to 0 or 1
        const kick = rollDie();
        newPos = kick.pos; // New position is 0 or 1
        roll = kick.val;
        
        newLastAction += ` SAFETY! ${opponentName} scores. Ball reset to ${newPos}. Kickoff to next player.`;
        
        rollHappened = true; 
        shouldFreeze = true; 
      }

      const isOver = newDeck.length === 0 && updatedPlayers[1].hand.length === 0 && updatedPlayers[2].hand.length === 0;
      if (isOver) newLastAction += " [GAME OVER]";

      if (shouldFreeze) {
          // DEFER STATE CHANGE (Wait for dice animation)
          const pending: PendingMove = {
              newPos: newPos,
              nextPid: nextPid,
              newLastAction: newLastAction,
              updatedPlayers: updatedPlayers,
              isOver: isOver,
              newDeck: newDeck,
          };
          return {
              ...state,
              deck: newDeck, 
              players: updatedPlayers, 
              lastDieRoll: roll, 
              rollTrigger: state.rollTrigger + 1,
              isDiceRolling: true, // Freeze UI
              lastAction: 'Rolling for result...',
              pendingMove: pending,
              ballPosition: preRollPos, // Field stays fixed
          };
      } else {
          // APPLY STATE CHANGE INSTANTLY (standard non-roll move)
          return { 
              ...state, 
              deck: newDeck, 
              ballPosition: newPos, 
              lastAction: newLastAction, 
              lastDieRoll: roll, 
              currentPlayerId: nextPid, 
              players: updatedPlayers, 
              isOver, 
              error: null,
          };
      }
    }
    case 'RESOLVE_ROLL': {
        const p = state.pendingMove;
        if (!p) return { ...state, isDiceRolling: false };
        
        // APPLY DEFERRED STATE CHANGES
        return { 
            ...state, 
            isDiceRolling: false,
            pendingMove: null, 
            
            ballPosition: p.newPos, // Apply new ball position (post-roll)
            currentPlayerId: p.nextPid, // Set next player
            lastAction: p.newLastAction, // Update action status
            players: p.updatedPlayers,
            isOver: p.isOver,
            deck: p.newDeck,
        };
    }
    case 'SET_ERROR': {
      return { ...state, error: action.error };
    }
    case 'CLEAR_ERROR': {
        return { ...state, error: null };
    }
    default: return state;
  }
}

// --- 2. UI COMPONENTS & HELPERS ---

// Visualization Constants from QubitBoard.tsx
const NODE_POSITIONS: Record<QubitPosition, { top: string; left: string }> = {
  '+': { top: '5%', left: '50%' },
  '0': { top: '30%', left: '25%' },
  '-i': { top: '30%', left: '75%' },
  '+i': { top: '60%', left: '25%' },
  '1': { top: '60%', left: '75%' },
  '-': { top: '85%', left: '50%' },
};

const EDGES = [
  { from: '0', to: '+', label: 'H' }, { from: '0', to: '-i', label: '√x' }, { from: '0', to: '1', label: 'X,Y' },
  { from: '+', to: '0', label: 'H' }, { from: '-i', to: '+', label: 'S' }, { from: '-i', to: '+i', label: 'X,Z,H' },
  { from: '-i', to: '1', label: '√x' }, { from: '1', to: '0', label: 'X,Y' }, { from: '1', to: '+i', label: '√x' },
  { from: '1', to: '-', label: 'H' }, { from: '-', to: '1', label: 'H' }, { from: '+i', to: '0', label: '√x' },
  { from: '+i', to: '-i', label: 'X,Z,H' }, { from: '+i', to: '-', label: 'S' },
];

function EdgeArrow({ edge }: { edge: any }) {
  const from = NODE_POSITIONS[edge.from as QubitPosition];
  const to = NODE_POSITIONS[edge.to as QubitPosition];
  const x1 = parseFloat(from.left), y1 = parseFloat(from.top);
  const x2 = parseFloat(to.left), y2 = parseFloat(to.top);
  const isBidirectional = EDGES.some((e) => e.from === edge.to && e.to === edge.from);
  const t = isBidirectional ? 0.25 : 0.5;
  const labelLeft = x1 + (x2 - x1) * t;
  const labelTop = y1 + (y2 - y1) * t;
  const markerId = `arrowhead-${edge.from}-${edge.to}`;

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <marker id={markerId} markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="white" />
            </marker>
          </defs>
          <line x1={from.left} y1={from.top} x2={to.left} y2={to.top} stroke="white" strokeWidth="2" opacity="0.8" markerEnd={`url(#${markerId})`} />
        </svg>
      </div>
      <div className="absolute z-10 transform -translate-x-1/2 -translate-y-[120%]" style={{ top: `${labelTop}%`, left: `${labelLeft}%` }}>
        <span className="text-xs font-bold text-white bg-black/70 px-1 rounded-sm whitespace-nowrap">{edge.label}</span>
      </div>
    </>
  );
}

function BoardNode({ pos, isBallHere, isGoal }: { pos: QubitPosition; isBallHere: boolean; isGoal: boolean }) {
  const node = NODE_POSITIONS[pos];

  let nodeClasses = 'bg-yellow-200 text-black border-yellow-600';
  let goalRing = '';

  if (isGoal) {
      nodeClasses = 'bg-blue-300 text-black border-blue-600'; 
      goalRing = 'ring-4 ring-offset-2 ring-blue-500 ring-offset-gray-800';
  }

  if (isBallHere) {
      nodeClasses = 'bg-yellow-400 text-black border-orange-500 shadow-[0_0_15px_rgba(255,200,0,0.8)]';
      goalRing = ''; 
  }
  
  return (
    <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20" style={{ top: node.top, left: node.left }}>
      <div className={`
        w-[70px] h-[70px] rounded-full flex items-center justify-center border-[3px] font-bold text-2xl transition-all duration-300
        ${nodeClasses} ${goalRing}
      `}>
        {pos}
      </div>
    </div>
  );
}

const QubitBoard = React.memo(({ ballPosition, players }: { ballPosition: QubitPosition, players: Record<number, Player> }) => {
    // Determine which nodes are goals (touchdown nodes)
    const p1Goal = players[1].endzone;
    const p2Goal = players[2].endzone;

    // Check if the current ball position is one of the goal states
    const isGoalNode = (pos: QubitPosition) => pos === p1Goal || pos === p2Goal;

    return (
        <div className="flex-1 w-full h-full relative rounded-md border border-white/20 overflow-hidden bg-green-800">
            {EDGES.map((edge, i) => <EdgeArrow key={i} edge={edge} />)}
            {Object.keys(NODE_POSITIONS).map((pos) => (
                <BoardNode 
                    key={pos} 
                    pos={pos as QubitPosition} 
                    isBallHere={ballPosition === pos} 
                    isGoal={isGoalNode(pos as QubitPosition)}
                />
            ))}
        </div>
    );
});


const CardButton = ({ card, canPlay, isFaceUp, onClick }: { card: Card; canPlay: boolean; isFaceUp: boolean; onClick: () => void }) => {
  // Determine if the card is a gate (blue) or measurement/identity (purple/gray)
  const isGate = ['H', 'X', 'Y', 'Z', 'S', '√X'].includes(card.type);

  return (
    <button
      onClick={onClick}
      disabled={!canPlay}
      className={`
        relative w-[120px] h-[168px] transition-all duration-300 ease-out shrink-0
        ${canPlay ? 'cursor-pointer hover:scale-105 hover:-translate-y-3 hover:z-10 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)]' : 'cursor-default opacity-50'}
        ${!canPlay && isFaceUp ? 'opacity-70 grayscale' : 'opacity-100'}
      `}
    >
      <div className={`
        w-full h-full rounded-md border flex flex-col items-center justify-center overflow-hidden shadow-md
        ${isFaceUp ? 'bg-white border-gray-300' : 'bg-blue-900 border-blue-800'}
      `}
      style={{
        backgroundImage: !isFaceUp ? "repeating-linear-gradient(45deg, #1e3a8a 0, #1e3a8a 10px, #172554 10px, #172554 20px)" : "none"
      }}>
        {isFaceUp ? (
          <>
            <span className="absolute top-2 left-2 text-xs font-bold text-gray-500">{card.type}</span>
            <span className={`text-3xl font-black ${isGate ? 'text-blue-600' : 'text-purple-600'}`}>{card.type}</span>
            <span className="absolute bottom-2 right-2 text-xs font-bold text-gray-500 rotate-180">{card.type}</span>
          </>
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
            <span className="text-white font-bold text-xl">?</span>
          </div>
        )}
      </div>
    </button>
  );
};

const Dice = ({ value, rollTrigger, onAnimationEnd }: { value: number | null, rollTrigger: number, onAnimationEnd: () => void }) => {
  const [display, setDisplay] = useState(value);
  const [rolling, setRolling] = useState(false);
  const animationFinishedRef = useRef(false);

  useEffect(() => {
    if (rollTrigger === 0) return;
    if (value === null) return;
    if (rolling) return; 

    setRolling(true);
    animationFinishedRef.current = false;
    
    let count = 0;
    const maxCount = 12; 
    let delay = 50; 
    let timeoutId: number;

    const animate = () => {
      if (count >= maxCount) {
        // Stop rolling and display final value
        setDisplay(value);
        setRolling(false);
        animationFinishedRef.current = true;
        onAnimationEnd(); // SIGNAL COMPLETE: The final state can now be applied
        return;
      }

      setDisplay(Math.random() > 0.5 ? 1 : 0);
      count++;
      
      delay = Math.floor(delay * 1.25); 
      timeoutId = setTimeout(animate, delay);
    };

    timeoutId = setTimeout(animate, delay);

    return () => clearTimeout(timeoutId);

  }, [rollTrigger]); 

  // Update displayed value immediately when value changes outside of a roll
  useEffect(() => {
      if (!rolling && !animationFinishedRef.current) {
          setDisplay(value);
      }
  }, [value, rolling]);


  if (value === null) return null;

  return (
    <div className={`
      w-12 h-12 flex items-center justify-center rounded-xl
      border-2 select-none transition-all duration-200 ease-out
      ${rolling 
        ? 'bg-yellow-300 border-yellow-500 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.6)] rotate-6' 
        : 'bg-white border-gray-300 scale-100 shadow-[0_4px_0_#bdc3c7] rotate-0'
      }
    `}>
      <span className={`font-black text-2xl ${rolling ? 'text-yellow-900' : 'text-black'}`}>
        {display}
      </span>
    </div>
  );
};

// --- 3. MAIN APP ---

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  
  const isCpuTurnAfterRollRef = useRef(false); 

  // --- Callbacks ---

  const handleDieAnimationEnd = useCallback(() => {
      // 1. Unfreeze the game state and apply pending move
      dispatch({ type: 'RESOLVE_ROLL' });

      // 2. If it's the CPU's turn immediately after the roll, trigger the logic.
      if (state.pendingMove?.nextPid === 2 && state.mode === 'PVC' && !state.pendingMove?.isOver) {
          isCpuTurnAfterRollRef.current = true; // Signal CPU to move next tick
      }
  }, [state.pendingMove, state.mode]);
  
  const handlePlayCard = (cardId: string) => {
    // Block action if game is over or the dice is rolling/processing
    if (state.isOver || state.isDiceRolling) return;
    dispatch({ type: 'PLAY_CARD', playerId: 1, cardId });
  };

  // --- Effects ---

  // Custom Toast/Error handling
  useEffect(() => {
    if (state.error) {
      setToastMessage(state.error);
      setShowToast(true);
      const timer = setTimeout(() => {
          setShowToast(false);
          dispatch({ type: 'CLEAR_ERROR' }); 
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Initial Game Start on load
  useEffect(() => { dispatch({ type: 'START_GAME', mode: 'PVC' }); }, []);

  // CPU Logic (Player 2)
  useEffect(() => {
    // Block CPU if game is over, not PVC mode, not P2's turn, OR if the game is frozen
    if (state.isOver || state.mode !== 'PVC' || state.currentPlayerId !== 2 || state.isDiceRolling) {
        isCpuTurnAfterRollRef.current = false;
        return;
    }
    
    // Check if this is the special trigger case (CPU turn immediately following a roll resolution)
    if (!isCpuTurnAfterRollRef.current) return;
    
    // CPU Delay is 3000ms
    const delay = 3000;
    
    const timer = setTimeout(() => {
      // AI Logic: Prefer a card that moves the ball, else random card
      const valid = state.players[2].hand.filter(c => 
          c.type === 'Meas' || 
          (GATE_TRANSITIONS[c.type] && GATE_TRANSITIONS[c.type][state.ballPosition] !== state.ballPosition)
      );
      const card = valid.length ? valid[Math.floor(Math.random() * valid.length)] : state.players[2].hand[0];
      
      if (card) {
        dispatch({ type: 'PLAY_CARD', playerId: 2, cardId: card.id });
      }
      isCpuTurnAfterRollRef.current = false; // Reset trigger after move
    }, delay); 
    
    return () => clearTimeout(timer);
  }, [state.currentPlayerId, state.mode, state.isOver, state.ballPosition, state.isDiceRolling, state.gameId]);

  const player1 = state.players[1];
  const player2 = state.players[2];
  
  // Determine if human interaction is locked
  const gameLocked = state.isOver || state.isDiceRolling || (state.mode === 'PVC' && state.currentPlayerId === 2);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden flex flex-col font-sans">
      
      {/* HEADER */}
      <div className="h-16 px-4 flex items-center justify-between bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 rounded shadow"><Dna size={20} /></div>
          <h1 className="text-lg font-bold tracking-wide">QUBIT TOUCHDOWN</h1>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${state.isOver ? "bg-red-900 text-red-200" : "bg-green-900 text-green-200"}`}>
            {state.isOver ? "GAME OVER" : "LIVE"}
          </span>
        </div>
        
        <div className="hidden md:block text-sm font-bold text-yellow-400 max-w-[40%] truncate">
            {state.lastAction}
        </div>

        <div className="flex gap-3">
          <div className="flex bg-black/30 rounded p-1 gap-1">
             <button onClick={() => dispatch({ type: 'START_GAME', mode: 'PVP' })} className={`px-3 py-1 text-xs font-bold rounded ${state.mode === 'PVP' ? 'bg-blue-600' : 'text-gray-400 hover:bg-gray-700'}`}>2 Player</button>
             <button onClick={() => dispatch({ type: 'START_GAME', mode: 'PVC' })} className={`px-3 py-1 text-xs font-bold rounded ${state.mode === 'PVC' ? 'bg-purple-600' : 'text-gray-400 hover:bg-gray-700'}`}>Vs CPU</button>
          </div>
          <button onClick={() => dispatch({ type: 'START_GAME', mode: state.mode })} className="text-xs font-medium bg-green-700 px-3 py-1 rounded hover:bg-green-600">New Game</button>
          <button onClick={() => setRulesOpen(true)} className="text-xs font-medium hover:text-blue-400 flex items-center gap-1"><BookOpen size={14}/> Rules</button>
        </div>
      </div>

      {/* MAIN CONTENT: Flex Row (Field Left, Controls Right) */}
      <div className="flex-1 flex flex-row p-4 gap-4 overflow-hidden">
        
        {/* LEFT: THE FIELD (Flex 2) - Smaller width */}
        <div className="flex-[2] flex flex-col bg-gray-800 rounded-md border border-gray-700 p-2 relative">
             <QubitBoard ballPosition={state.ballPosition} players={state.players} />
        </div>

        {/* RIGHT: CONTROLS (Flex 3) - Wider width for card layout */}
        <div className="flex-[3] flex flex-col gap-4 min-w-[400px] bg-gray-800 p-4 rounded-md border border-gray-700 overflow-y-auto custom-scrollbar">
            
            {/* SCOREBOARD */}
            <div className="bg-gray-700 p-3 rounded-md shadow-inner">
                <h3 className="text-xs text-gray-400 font-bold uppercase mb-2">TOUCHDOWNS</h3>
                
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-blue-300">{player1.name} (Goal: {player1.endzone})</span>
                    <span className="text-xl font-black text-white">{player1.touchdowns}</span>
                </div>
                <div className="flex justify-between mb-3">
                    <span className="text-sm font-bold text-purple-300">{player2.name} (Goal: {player2.endzone})</span>
                    <span className="text-xl font-black text-white">{player2.touchdowns}</span>
                </div>

                <div className="pt-3 border-t border-gray-600 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400">CARDS LEFT: <span className="text-white">{state.deck.length}</span></span>
                    {state.lastDieRoll !== null && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400">LAST ROLL:</span>
                            <Dice 
                                value={state.lastDieRoll} 
                                rollTrigger={state.rollTrigger} 
                                onAnimationEnd={handleDieAnimationEnd}
                            />
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-xs text-gray-400 font-bold uppercase mt-2">Player Hands</h3>

            {/* PLAYER 1 HAND */}
            <div className={`p-2 rounded-md transition-colors ${state.currentPlayerId === 1 ? 'bg-white/10' : 'bg-transparent'}`}>
                <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-blue-200">{player1.name}</span>
                    {state.currentPlayerId === 1 && !state.isOver && <span className="px-2 py-0.5 bg-blue-600 text-[10px] font-bold rounded text-white">YOUR TURN</span>}
                    {state.isDiceRolling && <span className="px-2 py-0.5 bg-yellow-600 text-[10px] font-bold rounded text-white">ROLLING...</span>}
                </div>
                <div className="flex flex-wrap gap-4 min-h-[180px] content-start">
                    {player1.hand.map(card => (
                        <CardButton 
                            key={card.id} card={card} 
                            isFaceUp={true} 
                            canPlay={!gameLocked && state.currentPlayerId === 1} 
                            onClick={() => handlePlayCard(card.id)} 
                        />
                    ))}
                    {player1.hand.length === 0 && <span className="text-xs text-gray-500">No cards</span>}
                </div>
            </div>

            {/* PLAYER 2 HAND */}
            <div className={`p-2 rounded-md transition-colors ${state.currentPlayerId === 2 ? 'bg-white/10' : 'bg-transparent'}`}>
                <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-purple-200">{player2.name}</span>
                    {state.currentPlayerId === 2 && !state.isOver && (
                        <span className="px-2 py-0.5 bg-purple-600 text-[10px] font-bold rounded text-white">
                            {state.mode === 'PVC' ? 'CPU THINKING...' : 'YOUR TURN'}
                        </span>
                    )}
                    {state.isDiceRolling && <span className="px-2 py-0.5 bg-yellow-600 text-[10px] font-bold rounded text-white">ROLLING...</span>}
                </div>
                <div className="flex flex-wrap gap-4 min-h-[180px] content-start">
                    {player2.hand.map(card => (
                        <CardButton 
                            key={card.id} card={card} 
                            isFaceUp={state.mode === 'PVC' || state.currentPlayerId === 2 || state.isOver} 
                            canPlay={!gameLocked && state.currentPlayerId === 2 && state.mode === 'PVP'} 
                            onClick={() => dispatch({ type: 'PLAY_CARD', playerId: 2, cardId: card.id })} 
                        />
                    ))}
                    {player2.hand.length === 0 && <span className="text-xs text-gray-500">No cards</span>}
                </div>
            </div>

        </div>
      </div>

      {/* RULES MODAL */}
      {rulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setRulesOpen(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-2xl border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">How to Play</h3>
              <button onClick={() => setRulesOpen(false)} className="text-gray-400 hover:text-white"><LogOut size={20} /></button>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <p><strong>Goal:</strong> Move the ball to your **opponent's** endzone (the node opposite your own goal).</p>
              <p><strong>Safety/Own Goal:</strong> If you move the ball into your **own** endzone (the blue highlighted node), the **opponent** scores a point, and the ball is reset via a dice roll.</p>
              <p><strong>Start:</strong> The initial die roll sets the ball position (0 or 1). Your goal (endzone) is automatically set to the opposite superposition state from that initial position (e.g., if ball starts at 0, your goal is '-'). Player 1 always starts first.</p>
              <p><strong>Turns:</strong> Play a card (Gate) to move the ball along the paths.</p>
              <div className="bg-gray-900 p-3 rounded font-mono text-xs mt-2">
                <p>H: 0/1 ↔ +/-</p>
                <p>Meas: Collapses superposition</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOAST (Error Message) */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-3 rounded-lg shadow-xl animate-bounce-in">
          <p className="font-bold">Error</p>
          <p className="text-sm">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}