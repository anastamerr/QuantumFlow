import {random} from 'lodash';

const QubitPosition = {
    ZERO: '0', ONE: '1', PLUS: '+', MINUS: '-', PLUS_I: '+i', MINUS_I: '-i'
};

const QubitCardType = {
    H: 'H', S: 'S', X: 'X', Y: 'Y', Z: 'Z', SQRT_X: '√X', I: 'I', MEASURE: 'Meas'
};

const DECK_COMPOSITION = {
    [QubitCardType.H]: 7, [QubitCardType.S]: 7, [QubitCardType.X]: 4, [QubitCardType.Y]: 9,
    [QubitCardType.Z]: 7, [QubitCardType.I]: 3, [QubitCardType.MEASURE]: 3, [QubitCardType.SQRT_X]: 12,
};

const GATE_TRANSITIONS = {
    [QubitCardType.I]: { '0': '0', '1': '1', '+': '+', '-': '-', '+i': '+i', '-i': '-i' },
    [QubitCardType.X]: { '0': '1', '1': '0', '+': '+', '-': '-', '+i': '-i', '-i': '+i' },
    [QubitCardType.Y]: { '0': '1', '1': '0', '+': '-', '-': '+', '+i': '+i', '-i': '-i' },
    [QubitCardType.Z]: { '0': '0', '1': '1', '+': '-', '-': '+', '+i': '-i', '-i': '+i' },
    [QubitCardType.H]: { '0': '+', '1': '-', '+': '0', '-': '1', '+i': '-i', '-i': '+i' },
    [QubitCardType.S]: { '0': '0', '1': '1', '+': '+i', '-': '-i', '+i': '-', '-i': '+' },
    [QubitCardType.SQRT_X]: { '0': '-i', '1': '+i', '+': '+', '-': '-', '+i': '0', '-i': '1' },
};

export const CPU_DELAY = 3000;

const uuidv4 = () => Math.random().toString(36).substr(2, 9);

const rollDie = () => {
    // 0 corresponds to position '0', 1 to position '1'
    const val = random(0, 1);
    const pos = val === 0 ? QubitPosition.ZERO : QubitPosition.ONE;
    return { val, pos };
};

const generateDeck = () => {
    const deck = [];
    Object.entries(DECK_COMPOSITION).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) deck.push({ id: uuidv4(), type });
    });
    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const applyGate = (cardType, pos) => {
    const trans = GATE_TRANSITIONS[cardType];
    return trans ? trans[pos] : pos;
};

const drawToHand = (deck, hand) => {
    if (deck.length > 0) hand.push(deck.pop());
    return { deck, hand };
};

// --- Public Actions ---

export const createNewGame = (mode) => {
    const deck = generateDeck();
    const p1Hand = deck.splice(0, 4);
    const p2Hand = deck.splice(0, 4);
    const kickoff = rollDie();

    const starterId = 1; // P1 always starts
    
    // Logic: P1 Goal is the opposite pole of the start position.
    // Start '0' -> P1 Goal is '-' (P2 Goal is '+')
    // Start '1' -> P1 Goal is '+' (P2 Goal is '-')
    const p1Goal = kickoff.pos === QubitPosition.ZERO ? QubitPosition.MINUS : QubitPosition.PLUS;
    const p2Goal = kickoff.pos === QubitPosition.ZERO ? QubitPosition.PLUS : QubitPosition.MINUS;
    
    const p2Name = mode === 'PVC' ? 'Computer' : 'Player 2';
    
    const players = [
         null, // Index 0 padding
         { id: 1, name: 'Player 1', endzone: p1Goal, hand: p1Hand, touchdowns: 0 },
         { id: 2, name: p2Name, endzone: p2Goal, hand: p2Hand, touchdowns: 0 }
    ];

    return {
        game_id: uuidv4(),
        mode,
        // We freeze the ball at the start position ('0' or '1') but apply it visually later
        ballPosition: '0', // Temporary visual placeholder before roll animation starts
        current_player_id: starterId,
        deck,
        players,
        lastDieRoll: kickoff.val,
        is_over: false,
        
        // Deferred state for animation
        isDiceRolling: true,
        rollTrigger: 1,
        lastAction: 'KICKOFF ROLLING...',
        
        // The state to apply AFTER animation finishes
        pendingMove: {
            newPos: kickoff.pos,
            nextPid: starterId,
            newLastAction: `Kickoff roll: ${kickoff.val}. Ball at ${kickoff.pos}. Player 1 starts.`,
            updatedPlayers: players,
            isOver: false,
            newDeck: deck,
        }
    };
};

export const playCardLogic = (currentState, playerId, cardId) => {
    if (currentState.is_over || currentState.isDiceRolling) return currentState;

    let state = { ...currentState };
    let players = [...state.players]; // Shallow copy array
    let player = { ...players[playerId] }; // Shallow copy player object
    
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return state; // Card not found

    // Play Card
    let newHand = [...player.hand];
    const playedCard = newHand.splice(cardIndex, 1)[0];
    
    let newPos = state.ballPosition;
    let desc = '';
    let roll = state.lastDieRoll;
    let shouldFreeze = false;
    let nextPid = playerId === 1 ? 2 : 1;
    
    // Draw Replacement
    let newDeck = [...state.deck];
    let drawResult = drawToHand(newDeck, newHand);
    newDeck = drawResult.deck;
    player.hand = drawResult.hand;
    players[playerId] = player;

    // 1. Apply Card Effect
    if (playedCard.type === QubitCardType.MEASURE) {
        if ([QubitPosition.PLUS, QubitPosition.MINUS, QubitPosition.PLUS_I, QubitPosition.MINUS_I].includes(newPos)) {
            const outcome = rollDie();
            newPos = outcome.pos;
            roll = outcome.val;
            desc = `Measured! Collapsed to ${newPos}`;
            shouldFreeze = true;
        } else {
            desc = 'Measurement on basis state (No change).';
        }
    } else {
        const oldPos = newPos;
        newPos = applyGate(playedCard.type, oldPos);
        desc = `Played ${playedCard.type}: ${oldPos} → ${newPos}`;
    }

    let newLastAction = desc;
    const preRollPos = state.ballPosition; // Save for visual freeze

    // 2. Check Scoring
    const opponentId = playerId === 1 ? 2 : 1;
    const opponent = { ...players[opponentId] };

    if (newPos === player.endzone) {
        // TOUCHDOWN (Player reached opponent's goal)
        player.touchdowns += 1;
        newLastAction += " TOUCHDOWN!";
        
        const kick = rollDie();
        newPos = kick.pos;
        roll = kick.val;
        newLastAction += ` Reset to ${newPos}.`;
        shouldFreeze = true;
    } else if (newPos === opponent.endzone) {
        // SAFETY (Player reached OWN goal -> Opponent scores)
        opponent.touchdowns += 1;
        players[opponentId] = opponent; // Commit opponent update
        newLastAction += ` SAFETY! ${opponent.name} scores!`;
        
        const kick = rollDie();
        newPos = kick.pos;
        roll = kick.val;
        newLastAction += ` Reset to ${newPos}.`;
        shouldFreeze = true;
    }

    // Game Over Check
    const isOver = newDeck.length === 0 && players[1].hand.length === 0 && players[2].hand.length === 0;
    if (isOver) newLastAction += " [GAME OVER]";

    // Construct Result State
    let result = { 
        ...state, deck: newDeck, players, 
        lastDieRoll: roll, is_over: isOver 
    };

    if (shouldFreeze) {
        // Defer update
        result.ballPosition = preRollPos; // Freeze visual position
        result.isDiceRolling = true;
        result.rollTrigger = (state.rollTrigger || 0) + 1;
        result.lastAction = 'Rolling...';
        result.pendingMove = {
            newPos: newPos,
            nextPid: nextPid,
            newLastAction: newLastAction,
            updatedPlayers: players,
            isOver: isOver,
            newDeck: newDeck,
        };
    } else {
        // Immediate update
        result.ballPosition = newPos;
        result.current_player_id = nextPid;
        result.lastAction = newLastAction;
    }
    
    return result;
};

export const getCpuMoveCardId = (state) => {
    const computer = state.players[2];
    const validMoves = computer.hand.filter(c => 
        c.type === QubitCardType.MEASURE || 
        (GATE_TRANSITIONS[c.type] && applyGate(c.type, state.ballPosition) !== state.ballPosition)
    );
    const card = validMoves.length 
        ? validMoves[Math.floor(Math.random() * validMoves.length)] 
        : computer.hand[Math.floor(Math.random() * computer.hand.length)];
    return card ? card.id : null;
};