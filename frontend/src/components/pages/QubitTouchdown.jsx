import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';

// --- 1. ICONS ---
const BookOpenIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><path d="M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z"/></svg>
);
const LogOutIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 22L3 15M10 2L3 9M15 2l7 7-7 7"/></svg>
);
const DnaIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10a8 8 0 1 0-16 0"/><path d="M12 2v20"/><path d="M12 12h8m-8 0L4 0M12 12L4 0m8 12l8 0m-8 0L4 24m8-12L4 24M12 12l8 8m-8-8l-8 8"/></svg>
);
const ArrowLeftIcon = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

// --- 2. GAME CONSTANTS ---
const DECK_COMPOSITION = { 'H': 7, 'S': 7, 'X': 4, 'Y': 9, 'Z': 7, 'I': 3, 'Meas': 3, '√X': 12 };
const CPU_DELAY = 2500; 

const GATE_TRANSITIONS = {
  'I': { '0': '0', '1': '1', '+': '+', '-': '-', '+i': '+i', '-i': '-i' },
  'X': { '0': '1', '1': '0', '+': '+', '-': '-', '+i': '-i', '-i': '+i' },
  'Y': { '0': '1', '1': '0', '+': '-', '-': '+', '+i': '+i', '-i': '-i' },
  'Z': { '0': '0', '1': '1', '+': '-', '-': '+', '+i': '-i', '-i': '+i' },
  'H': { '0': '+', '1': '-', '+': '0', '-': '1', '+i': '-i', '-i': '+i' },
  'S': { '0': '0', '1': '1', '+': '+i', '-': '-i', '+i': '-', '-i': '+' },
  '√X': { '0': '-i', '1': '+i', '+': '+', '-': '-', '+i': '0', '-i': '1' },
};

const NODE_POSITIONS = {
  '+': { top: '10%', left: '50%' },
  '0': { top: '35%', left: '25%' },
  '-i': { top: '35%', left: '75%' },
  '+i': { top: '65%', left: '25%' },
  '1': { top: '65%', left: '75%' },
  '-': { top: '90%', left: '50%' },
};

const EDGES = [
  { from: '0', to: '+', label: 'H' }, { from: '0', to: '-i', label: '√x' }, { from: '0', to: '1', label: 'X,Y' },
  { from: '+', to: '0', label: 'H' }, { from: '-i', to: '+', label: 'S' }, { from: '-i', to: '+i', label: 'X,Z,H' },
  { from: '-i', to: '1', label: '√x' }, { from: '1', to: '0', label: 'X,Y' }, { from: '1', to: '+i', label: '√x' },
  { from: '1', to: '-', label: 'H' }, { from: '-', to: '1', label: 'H' }, { from: '+i', to: '0', label: '√x' },
  { from: '+i', to: '-i', label: 'X,Z,H' }, { from: '+i', to: '-', label: 'S' },
];

// --- 3. HELPER FUNCTIONS ---
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const rollDie = () => {
    const val = Math.random() < 0.5 ? 0 : 1;
    const pos = val === 0 ? '0' : '1';
    return { val, pos };
};

const generateDeck = () => {
  const deck = [];
  Object.entries(DECK_COMPOSITION).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) deck.push({ id: uuidv4(), type });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// --- 4. GAME REDUCER ---
const initialState = {
  gameId: '', mode: 'PVC', ballPosition: '0', currentPlayerId: 1, deck: [],
  players: { 
      1: { id: 1, name: 'Player 1', endzone: '+', touchdowns: 0, hand: [] }, 
      2: { id: 2, name: 'Player 2', endzone: '-', touchdowns: 0, hand: [] } 
  },
  lastAction: 'Game Ready', lastDieRoll: null, isOver: true, error: null,
  rollTrigger: 0, isDiceRolling: false, pendingMove: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME': {
      const deck = generateDeck();
      const p1Hand = deck.splice(0, 4);
      const p2Hand = deck.splice(0, 4);
      const kickoff = rollDie(); 
      const p1Goal = kickoff.pos === '0' ? '-' : '+'; 
      const p2Goal = kickoff.pos === '0' ? '+' : '-';
      
      const updatedPlayers = {
          1: { ...state.players[1], endzone: p1Goal, hand: p1Hand, touchdowns: 0 },
          2: { ...state.players[2], name: action.mode === 'PVC' ? 'CPU' : 'Player 2', endzone: p2Goal, hand: p2Hand, touchdowns: 0 }
      };

      const pending = {
          newPos: kickoff.pos, nextPid: 1,
          newLastAction: `Kickoff: ${kickoff.val}. Start at ${kickoff.pos}. P1 Goal: ${p1Goal}.`,
          updatedPlayers: updatedPlayers, isOver: false, newDeck: deck,
      };
      const preRollPos = state.ballPosition || '0';

      return {
        ...state, gameId: uuidv4(), mode: action.mode, isOver: false, deck, players: updatedPlayers,
        lastDieRoll: kickoff.val, currentPlayerId: 1, ballPosition: preRollPos,
        lastAction: 'ROLLING KICKOFF...', rollTrigger: state.rollTrigger + 1, isDiceRolling: true, pendingMove: pending, error: null,
      };
    }
    case 'PLAY_CARD': {
      if (state.isOver || state.isDiceRolling) return state;
      const { playerId, cardId } = action;
      const player = state.players[playerId];
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return state;

      let newHand = [...player.hand];
      const playedCard = newHand.splice(cardIndex, 1)[0];
      let newDeck = [...state.deck];
      if (newDeck.length > 0) newHand.push(newDeck.pop());

      let newPos = state.ballPosition;
      let desc = '';
      let roll = state.lastDieRoll;
      let shouldFreeze = false;
      let nextPid = playerId === 1 ? 2 : 1;
      
      let updatedPlayers = { ...state.players, [playerId]: { ...player, hand: newHand } };
      const opponentId = playerId === 1 ? 2 : 1;

      if (playedCard.type === 'Meas') {
        if (['+', '-', '+i', '-i'].includes(newPos)) {
            const outcome = rollDie();
            newPos = outcome.pos; roll = outcome.val;
            desc = `Measured! Collapsed to ${newPos}`;
            shouldFreeze = true;
        } else {
            desc = 'Measurement: No collapse.';
        }
      } else {
        const trans = GATE_TRANSITIONS[playedCard.type];
        newPos = trans ? trans[newPos] : newPos;
        desc = `Played ${playedCard.type}: ${state.ballPosition} -> ${newPos}`;
      }

      let newLastAction = desc;
      const preRollPos = state.ballPosition;

      if (newPos === player.endzone) {
         updatedPlayers[opponentId].touchdowns += 1;
         const kick = rollDie();
         newPos = kick.pos; roll = kick.val;
         newLastAction += ` SAFETY! Opponent scores! Reset to ${newPos}.`;
         shouldFreeze = true;
      } else if (newPos === updatedPlayers[opponentId].endzone) {
         updatedPlayers[playerId].touchdowns += 1;
         const kick = rollDie();
         newPos = kick.pos; roll = kick.val;
         newLastAction += ` TOUCHDOWN! Reset to ${newPos}.`;
         shouldFreeze = true;
      }

      const isOver = newDeck.length === 0 && updatedPlayers[1].hand.length === 0 && updatedPlayers[2].hand.length === 0;
      if (isOver) newLastAction += " [GAME OVER]";

      if (shouldFreeze) {
          const pending = { newPos, nextPid, newLastAction, updatedPlayers, isOver, newDeck };
          return {
              ...state, deck: newDeck, players: updatedPlayers, lastDieRoll: roll, 
              rollTrigger: state.rollTrigger + 1, isDiceRolling: true, lastAction: 'Rolling...', 
              pendingMove: pending, ballPosition: preRollPos 
          };
      } else {
          return { 
              ...state, deck: newDeck, ballPosition: newPos, lastAction: newLastAction, lastDieRoll: roll, 
              currentPlayerId: nextPid, players: updatedPlayers, isOver, error: null 
          };
      }
    }
    case 'RESOLVE_ROLL': {
        const p = state.pendingMove;
        if (!p) return { ...state, isDiceRolling: false };
        return { 
            ...state, isDiceRolling: false, pendingMove: null, 
            ballPosition: p.newPos, currentPlayerId: p.nextPid, 
            lastAction: p.newLastAction, players: p.updatedPlayers, isOver: p.isOver, deck: p.newDeck 
        };
    }
    default: return state;
  }
}

// --- 5. SUB-COMPONENTS ---
const Dice = ({ value, rollTrigger, onAnimationEnd }) => {
  const [display, setDisplay] = useState(value);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (rollTrigger === 0 || value === null) return;
    if (!rolling) {
        setRolling(true);
        let count = 0;
        let delay = 50;
        let timeoutId;
        const animate = () => {
          if (count >= 12) {
            setDisplay(value);
            setRolling(false);
            setTimeout(onAnimationEnd, 300);
            return;
          }
          setDisplay(Math.random() > 0.5 ? 1 : 0);
          count++;
          delay = Math.floor(delay * 1.25);
          timeoutId = setTimeout(animate, delay);
        };
        timeoutId = setTimeout(animate, delay);
        return () => clearTimeout(timeoutId);
    }
  }, [rollTrigger, value]);

  return (
    <div className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 select-none transition-all duration-200 ${rolling ? 'bg-yellow-300 scale-110 rotate-12 border-yellow-600 text-black' : 'bg-white scale-100 rotate-0 border-gray-400 text-black'}`}>
      <span className="font-black text-xl">{display}</span>
    </div>
  );
};

const BoardNode = ({ pos, isBallHere, isGoal }) => {
  const node = NODE_POSITIONS[pos];
  let classes = "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 text-xl md:text-2xl font-black transition-all duration-300 absolute -translate-x-1/2 -translate-y-1/2 ";
  
  if (isBallHere) classes += "bg-yellow-400 border-orange-500 text-black shadow-[0_0_20px_rgba(255,200,0,0.8)] z-30 scale-110";
  else if (isGoal) classes += "bg-blue-300 border-blue-600 text-black z-10 ring-4 ring-blue-500/30";
  else classes += "bg-gray-700 border-gray-600 text-gray-400 z-10";

  return (
    <div className={classes} style={{ top: node.top, left: node.left }}>{pos}</div>
  );
};

const CardButton = ({ card, canPlay, isFaceUp, onClick }) => {
  const isGate = ['H', 'X', 'Y', 'Z', 'S', '√X'].includes(card.type);
  return (
    <button onClick={onClick} disabled={!canPlay} className={`relative w-20 h-28 md:w-24 md:h-32 shrink-0 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center shadow-lg ${canPlay ? 'hover:-translate-y-2 hover:shadow-xl cursor-pointer' : 'cursor-default opacity-60'} ${isFaceUp ? 'bg-white border-gray-300' : 'bg-blue-900 border-blue-800'}`}>
       {isFaceUp ? (
         <>
           <span className="absolute top-1 left-1 text-[10px] font-bold text-gray-500">{card.type}</span>
           <span className={`text-2xl font-black ${isGate ? 'text-blue-600' : 'text-purple-600'}`}>{card.type}</span>
           <span className="absolute bottom-1 right-1 text-[10px] font-bold text-gray-500 rotate-180">{card.type}</span>
         </>
       ) : (
         <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center"><span className="text-white text-lg">?</span></div>
       )}
    </button>
  );
};

// --- 6. MAIN APP COMPONENT ---
export default function QubitTouchdown({ onExit }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [rulesOpen, setRulesOpen] = useState(false);
  const cpuTimerRef = useRef(null);

  // --- Initialization ---
  useEffect(() => {
      dispatch({ type: 'START_GAME', mode: 'PVC' });
  }, []);

  // --- CPU Logic ---
  useEffect(() => {
      if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
      if (state.isOver || state.mode !== 'PVC' || state.currentPlayerId !== 2 || state.isDiceRolling) return;
      
      cpuTimerRef.current = setTimeout(() => {
          const cpu = state.players[2];
          const valid = cpu.hand.filter(c => c.type === 'Meas' || (GATE_TRANSITIONS[c.type] && GATE_TRANSITIONS[c.type][state.ballPosition] !== state.ballPosition));
          const card = valid.length ? valid[Math.floor(Math.random() * valid.length)] : cpu.hand[0];
          if (card) dispatch({ type: 'PLAY_CARD', playerId: 2, cardId: card.id });
      }, CPU_DELAY);

      return () => clearTimeout(cpuTimerRef.current);
  }, [state.currentPlayerId, state.isDiceRolling, state.ballPosition, state.isOver, state.mode, state.players]);

  const handleRollEnd = useCallback(() => dispatch({ type: 'RESOLVE_ROLL' }), []);
  const handlePlay = (cid) => !state.isDiceRolling && dispatch({ type: 'PLAY_CARD', playerId: 1, cardId: cid });
  const p1 = state.players[1];
  const p2 = state.players[2];
  const isP1Turn = state.currentPlayerId === 1;

  return (
    <div className="h-full w-full bg-gray-900 text-gray-100 flex flex-col overflow-hidden font-sans">
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
            .custom-scrollbar { scrollbar-color: #4b5563 #1f2937; }
        `}</style>

      {/* Header */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0 z-20 shadow-md">
         <div className="flex items-center gap-3">
            {onExit && (
                <button onClick={onExit} className="mr-2 p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors" title="Back to Workbench">
                    <ArrowLeftIcon size={24} />
                </button>
            )}
            <div className="p-2 bg-blue-600 rounded shadow-lg"><DnaIcon size={20}/></div>
            <h1 className="hidden md:block text-xl font-bold tracking-widest text-white">QUBIT TOUCHDOWN</h1>
            <h1 className="md:hidden text-lg font-bold tracking-widest text-white">QUBIT TD</h1>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${state.isOver ? 'bg-red-600' : 'bg-green-600'}`}>{state.isOver ? 'GAME OVER' : 'LIVE'}</span>
         </div>
         <div className="text-xs md:text-sm font-medium text-yellow-400 truncate max-w-[150px] md:max-w-md text-center">{state.lastAction}</div>
         <div className="flex gap-2">
            <button onClick={() => dispatch({type:'START_GAME', mode:'PVC'})} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${state.mode==='PVC'?'bg-purple-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>CPU</button>
            <button onClick={() => dispatch({type:'START_GAME', mode:'PVP'})} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${state.mode==='PVP'?'bg-blue-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>2P</button>
            <button onClick={() => dispatch({type:'START_GAME', mode:state.mode})} className="px-3 py-1 text-xs font-bold bg-green-700 hover:bg-green-600 text-white rounded hidden sm:block">Restart</button>
            <button onClick={() => setRulesOpen(true)} className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white"><BookOpenIcon size={18}/></button>
         </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
          
          {/* Left: Field (Fixed width on md+) */}
          <div className="w-full md:w-80 lg:w-96 relative bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-inner shrink-0 min-h-[300px]">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#4b5563"/></marker></defs>
                  {EDGES.map((e, i) => {
                      const from = NODE_POSITIONS[e.from]; const to = NODE_POSITIONS[e.to];
                      return <line key={i} x1={from.left} y1={from.top} x2={to.left} y2={to.top} stroke="#374151" strokeWidth="2" markerEnd="url(#arrow)" />;
                  })}
              </svg>
              {EDGES.map((e, i) => {
                  const from = NODE_POSITIONS[e.from]; const to = NODE_POSITIONS[e.to];
                  const top = `calc(${from.top} + (${to.top} - ${from.top}) * 0.5)`;
                  const left = `calc(${from.left} + (${to.left} - ${from.left}) * 0.5)`;
                  return <div key={i} className="absolute z-10 text-[9px] md:text-[10px] font-bold bg-gray-900 text-gray-500 px-1 rounded border border-gray-700 -translate-x-1/2 -translate-y-1/2 select-none" style={{top, left}}>{e.label}</div>;
              })}
              {Object.keys(NODE_POSITIONS).map(pos => (
                  <BoardNode key={pos} pos={pos} isBallHere={state.ballPosition === pos} isGoal={pos === p1.endzone || pos === p2.endzone} />
              ))}
          </div>

          {/* Right: Controls */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
              
              {/* Scoreboard */}
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg shrink-0">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                      <h2 className="text-xs font-bold text-gray-500 tracking-wider">SCOREBOARD</h2>
                      {state.lastDieRoll !== null && (
                          <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400">ROLL:</span>
                              <Dice value={state.lastDieRoll} rollTrigger={state.rollTrigger} onAnimationEnd={handleRollEnd} />
                          </div>
                      )}
                  </div>
                  <div className="flex justify-between px-2 md:px-4">
                      <div className="text-center">
                          <div className="text-[10px] md:text-xs font-bold text-blue-400 mb-1">PLAYER 1 ({p1.endzone})</div>
                          <div className="text-3xl md:text-4xl font-black">{p1.touchdowns}</div>
                      </div>
                      <div className="text-center px-4 border-x border-gray-700">
                           <div className="text-[10px] md:text-xs font-bold text-gray-500 mb-1">DECK</div>
                           <div className="text-xl md:text-2xl font-bold text-gray-300">{state.deck.length}</div>
                      </div>
                      <div className="text-center">
                          <div className="text-[10px] md:text-xs font-bold text-purple-400 mb-1">{p2.name.toUpperCase()} ({p2.endzone})</div>
                          <div className="text-3xl md:text-4xl font-black">{p2.touchdowns}</div>
                      </div>
                  </div>
              </div>

              {/* Hands Container - Side by Side */}
              <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 p-2 md:p-4 flex flex-col gap-4 overflow-hidden">
                  {/* P1 Hand */}
                  <div className={`flex-1 p-2 rounded-lg border flex flex-col ${isP1Turn ? 'bg-blue-900/20 border-blue-500/30' : 'bg-transparent border-transparent'}`}>
                      <div className="flex justify-between mb-2 shrink-0">
                          <span className="text-xs font-bold text-blue-300">PLAYER 1</span>
                          {isP1Turn && !state.isDiceRolling && !state.isOver && <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded text-white font-bold animate-pulse">YOUR TURN</span>}
                      </div>
                      {/* Horizontal scroll for hand */}
                      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                          <div className="flex flex-row gap-2 items-center h-full">
                              {p1.hand.map(c => <CardButton key={c.id} card={c} isFaceUp={isP1Turn || state.isOver} canPlay={!state.isDiceRolling && isP1Turn} onClick={() => handlePlay(c.id)} />)}
                              {p1.hand.length === 0 && <span className="text-xs text-gray-500 italic w-full text-center">Empty Hand</span>}
                          </div>
                      </div>
                  </div>

                  {/* P2 Hand */}
                  <div className={`flex-1 p-2 rounded-lg border flex flex-col ${!isP1Turn ? 'bg-purple-900/20 border-purple-500/30' : 'bg-transparent border-transparent'}`}>
                      <div className="flex justify-between mb-2 shrink-0">
                          <span className="text-xs font-bold text-purple-300">{p2.name.toUpperCase()}</span>
                          {!isP1Turn && !state.isDiceRolling && !state.isOver && <span className="text-[10px] bg-purple-600 px-2 py-0.5 rounded text-white font-bold">{state.mode === 'PVC' ? 'THINKING...' : 'YOUR TURN'}</span>}
                      </div>
                      {/* Horizontal scroll for hand */}
                      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                          <div className="flex flex-row gap-2 items-center h-full">
                              {p2.hand.map(c => <CardButton key={c.id} card={c} isFaceUp={!isP1Turn || state.isOver} canPlay={!state.isDiceRolling && !isP1Turn && state.mode === 'PVP'} onClick={() => dispatch({type:'PLAY_CARD', playerId:2, cardId:c.id})} />)}
                              {p2.hand.length === 0 && <span className="text-xs text-gray-500 italic w-full text-center">Empty Hand</span>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </main>

      {rulesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setRulesOpen(false)}>
              <div className="bg-gray-800 max-w-lg w-full rounded-xl border border-gray-600 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                      <h2 className="text-xl font-bold text-white">How to Play</h2>
                      <button onClick={() => setRulesOpen(false)} className="text-gray-400 hover:text-white"><LogOutIcon size={20}/></button>
                  </div>
                  <ul className="space-y-4 text-sm text-gray-300 list-disc pl-4 leading-relaxed">
                      <li><strong className="text-blue-400">Objective:</strong> Move the ball (yellow) to your opponent's goal node.</li>
                      <li><strong className="text-yellow-400">Start:</strong> A die roll places the ball at state <strong>0</strong> or <strong>1</strong>. Your goal is the <strong>OPPOSITE</strong> pole.</li>
                      <li><strong className="text-green-400">Playing Cards:</strong> Use quantum gate cards (H, X, Y, etc.) to move the ball.</li>
                      <li><strong className="text-purple-400">Measurement (Meas):</strong> Collapses a "superposition" (+, -, +i, -i) to <strong>0</strong> or <strong>1</strong>.</li>
                      <li><strong className="text-red-400">Safety:</strong> Entering your OWN start node gives the opponent a point!</li>
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                      <button onClick={() => setRulesOpen(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Got it!</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}