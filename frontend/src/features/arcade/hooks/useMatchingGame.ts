/**
 * useMatchingGame Hook
 * Contains all game logic for the Matching Rush game
 * Separated from presentation layer for better maintainability
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface MatchPair {
  id: string;
  term: string;
  definition: string;
}

export interface Card {
  id: string;
  pairId: string;
  content: string;
  type: 'term' | 'definition';
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
}

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'won' | 'lost';
export type Difficulty = 'normal' | 'hard';

// =============================================================================
// Constants
// =============================================================================

const FREE_DAILY_LIMIT = 3;
const GAME_TIME_SECONDS = 45;
const PAIRS_PER_GAME = 6;
const STORAGE_KEY = 'thynkr_matching_games';
const POINTS_PER_MATCH = 100;
const TIME_BONUS_MULTIPLIER = 5;

// Sample data
const SAMPLE_PAIRS: MatchPair[] = [
  { id: '1', term: 'Mitochondria', definition: 'Powerhouse of the cell' },
  { id: '2', term: 'Photosynthesis', definition: 'Process plants use to convert sunlight to energy' },
  { id: '3', term: 'DNA', definition: 'Molecule carrying genetic instructions' },
  { id: '4', term: 'Osmosis', definition: 'Movement of water across a membrane' },
  { id: '5', term: 'Nucleus', definition: 'Control center of the cell' },
  { id: '6', term: 'Cytoplasm', definition: 'Gel-like fluid inside the cell' },
  { id: '7', term: 'Ribosome', definition: 'Organelle that synthesizes proteins' },
  { id: '8', term: 'Chloroplast', definition: 'Contains chlorophyll for photosynthesis' },
];

const HARD_MODE_PAIRS: MatchPair[] = [
  { id: '1', term: 'Endoplasmic Reticulum', definition: 'Network of membranes for protein transport' },
  { id: '2', term: 'Golgi Apparatus', definition: 'Packages and modifies proteins' },
  { id: '3', term: 'Lysosome', definition: 'Contains digestive enzymes' },
  { id: '4', term: 'Vacuole', definition: 'Storage organelle for water and nutrients' },
  { id: '5', term: 'Cell Membrane', definition: 'Selectively permeable barrier' },
  { id: '6', term: 'Centriole', definition: 'Organizes spindle fibers during division' },
  { id: '7', term: 'Chromatin', definition: 'Loosely coiled DNA and proteins' },
  { id: '8', term: 'Nucleolus', definition: 'Produces ribosomal RNA' },
];

// =============================================================================
// Utilities
// =============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyGamesPlayed(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    const parsed = JSON.parse(data);
    return parsed[getTodayKey()] || 0;
  } catch {
    return 0;
  }
}

function incrementDailyGames(): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    const today = getTodayKey();
    parsed[today] = (parsed[today] || 0) + 1;
    const keys = Object.keys(parsed).sort().slice(-7);
    const cleaned: Record<string, number> = {};
    keys.forEach((key) => (cleaned[key] = parsed[key]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Storage error, ignore
  }
}

// =============================================================================
// Hook Interface
// =============================================================================

export interface UseMatchingGameOptions {
  generatedPairs?: any[];
  isPro: boolean;
  onLoadingComplete?: () => void;
}

export interface UseMatchingGameReturn {
  // State
  status: GameStatus;
  difficulty: Difficulty;
  cards: Card[];
  selectedCards: Card[];
  timeRemaining: number;
  score: number;
  matchesFound: number;
  showDailyLimitModal: boolean;
  gamesPlayedToday: number;
  
  // Computed values
  pairsLeft: number;
  
  // Actions
  setDifficulty: (difficulty: Difficulty) => void;
  setShowDailyLimitModal: (show: boolean) => void;
  startGame: () => void;
  handleCountdownComplete: () => void;
  handleCardSelect: (card: Card) => void;
  handlePlayAgain: () => void;
  handleBackToMenu: () => void;
}

// =============================================================================
// Custom Hook
// =============================================================================

export function useMatchingGame({
  generatedPairs,
  isPro,
  onLoadingComplete,
}: UseMatchingGameOptions): UseMatchingGameReturn {
  // Game state
  const [status, setStatus] = useState<GameStatus>(() => {
    // Auto-start to countdown if we have generated pairs
    return generatedPairs ? 'countdown' : 'idle';
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(GAME_TIME_SECONDS);
  const [score, setScore] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);

  // Modals
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);

  // Track daily games
  const gamesPlayedToday = useRef(getDailyGamesPlayed());

  // Computed values
  const pairsLeft = PAIRS_PER_GAME - matchesFound;

  // Initialize game
  const initializeGame = useCallback(() => {
    // Use generated content from user files if available, otherwise fallback to sample data
    let pairSource: MatchPair[];
    
    if (generatedPairs && generatedPairs.length > 0) {
      // Convert generated content to MatchPair format
      pairSource = generatedPairs.map((pair: any, index: number) => ({
        id: `${index + 1}`,
        term: pair.term || pair.question || '',
        definition: pair.definition || pair.answer || '',
      }));
    } else {
      // Fallback to sample data
      pairSource = difficulty === 'hard' ? HARD_MODE_PAIRS : SAMPLE_PAIRS;
    }
    
    const selectedPairs = shuffleArray(pairSource).slice(0, PAIRS_PER_GAME);

    // Create separate arrays for terms and definitions
    const termCards: Card[] = [];
    const definitionCards: Card[] = [];
    
    selectedPairs.forEach((pair) => {
      termCards.push({
        id: `${pair.id}-term`,
        pairId: pair.id,
        content: pair.term,
        type: 'term',
        isMatched: false,
        isSelected: false,
        isWrong: false,
      });
      definitionCards.push({
        id: `${pair.id}-def`,
        pairId: pair.id,
        content: pair.definition,
        type: 'definition',
        isMatched: false,
        isSelected: false,
        isWrong: false,
      });
    });

    // Shuffle definitions independently from terms
    const allCards = [...termCards, ...shuffleArray(definitionCards)];
    setCards(allCards);
    setSelectedCards([]);
    setTimeRemaining(GAME_TIME_SECONDS);
    setScore(0);
    setMatchesFound(0);
  }, [difficulty, generatedPairs]);

  // Auto-initialize game when content is generated
  useEffect(() => {
    if (generatedPairs) {
      initializeGame();
      // Notify that loading is complete
      onLoadingComplete?.();
    }
  }, [generatedPairs, initializeGame, onLoadingComplete]);

  // Start game
  const startGame = useCallback(() => {
    // Check daily limit for free users
    if (!isPro && gamesPlayedToday.current >= FREE_DAILY_LIMIT) {
      setShowDailyLimitModal(true);
      return;
    }

    initializeGame();
    setStatus('countdown');
  }, [isPro, initializeGame]);

  // Handle countdown complete
  const handleCountdownComplete = useCallback(() => {
    setStatus('playing');
    incrementDailyGames();
    gamesPlayedToday.current += 1;
  }, []);

  // Handle card selection
  const handleCardSelect = useCallback(
    (card: Card) => {
      if (status !== 'playing' || selectedCards.length >= 2) return;

      // Can't select same card twice
      if (selectedCards.some((c) => c.id === card.id)) return;

      // Can't select same type (must match term with definition)
      if (selectedCards.length === 1 && selectedCards[0].type === card.type) {
        // Show wrong animation briefly
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, isWrong: true } : c))
        );
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === card.id ? { ...c, isWrong: false } : c))
          );
        }, 400);
        return;
      }

      // Select the card
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, isSelected: true } : c))
      );
      const newSelected = [...selectedCards, card];
      setSelectedCards(newSelected);

      // Check for match if two cards selected
      if (newSelected.length === 2) {
        const [first, second] = newSelected;
        const isMatch = first.pairId === second.pairId;

        if (isMatch) {
          // Correct match
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.pairId === first.pairId
                  ? { ...c, isMatched: true, isSelected: false }
                  : c
              )
            );
            setScore((prev) => prev + POINTS_PER_MATCH);
            setMatchesFound((prev) => prev + 1);
            setSelectedCards([]);
          }, 300);
        } else {
          // Wrong match
          setCards((prev) =>
            prev.map((c) =>
              newSelected.some((s) => s.id === c.id) ? { ...c, isWrong: true } : c
            )
          );
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                newSelected.some((s) => s.id === c.id)
                  ? { ...c, isWrong: false, isSelected: false }
                  : c
              )
            );
            setSelectedCards([]);
          }, 600);
        }
      }
    },
    [status, selectedCards]
  );

  // Timer effect
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Win condition check
  useEffect(() => {
    if (status === 'playing' && matchesFound === PAIRS_PER_GAME) {
      const timeBonus = timeRemaining * TIME_BONUS_MULTIPLIER;
      setScore((prev) => prev + timeBonus);
      setStatus('won');
    }
  }, [matchesFound, status, timeRemaining]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    if (!isPro && gamesPlayedToday.current >= FREE_DAILY_LIMIT) {
      setShowDailyLimitModal(true);
      return;
    }
    startGame();
  }, [isPro, startGame]);

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    // State
    status,
    difficulty,
    cards,
    selectedCards,
    timeRemaining,
    score,
    matchesFound,
    showDailyLimitModal,
    gamesPlayedToday: gamesPlayedToday.current,
    
    // Computed
    pairsLeft,
    
    // Actions
    setDifficulty,
    setShowDailyLimitModal,
    startGame,
    handleCountdownComplete,
    handleCardSelect,
    handlePlayAgain,
    handleBackToMenu,
  };
}

// Export constants for use in components
export { FREE_DAILY_LIMIT, GAME_TIME_SECONDS };
