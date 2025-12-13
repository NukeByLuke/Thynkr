/**
 * useGameSocket Hook
 * Real-time Socket.io connection for Thynkr Arcade multiplayer games
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ============ TYPES ============

export interface Player {
  id: string;
  nickname: string;
  score: number;
  streak?: number;
}

export interface Question {
  index: number;
  content: string;
  options: string[];
  timeLimit: number;
}

export interface ScoreUpdate {
  playerId: string;
  nickname: string;
  score: number;
  streak: number;
  correct: boolean;
  pointsEarned: number;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  pointsEarned: number;
  totalScore: number;
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  score: number;
  streak: number;
}

export interface GameState {
  isConnected: boolean;
  isHost: boolean;
  sessionId: string | null;
  gameTitle: string | null;
  gameType: string | null;
  status: 'idle' | 'connecting' | 'waiting' | 'active' | 'finished';
  players: Player[];
  currentQuestion: Question | null;
  totalQuestions: number;
  timeRemaining: number;
  leaderboard: LeaderboardEntry[];
  answerCounts: Record<string, number>;
  lastResult: AnswerResult | null;
  error: string | null;
}

interface UseGameSocketOptions {
  autoConnect?: boolean;
}

// ============ HOOK ============

export function useGameSocket(options: UseGameSocketOptions = {}) {
  const { autoConnect = false } = options;
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<GameState>({
    isConnected: false,
    isHost: false,
    sessionId: null,
    gameTitle: null,
    gameType: null,
    status: 'idle',
    players: [],
    currentQuestion: null,
    totalQuestions: 0,
    timeRemaining: 0,
    leaderboard: [],
    answerCounts: {},
    lastResult: null,
    error: null,
  });

  // Get socket URL - use current origin for WebSocket (nginx will proxy to backend)
  const getSocketUrl = () => {
    // In production/Docker, use current origin (nginx proxies /arcade to backend)
    // In dev with Vite, use the API URL without /api
    if (import.meta.env.PROD) {
      return window.location.origin;
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return apiUrl.replace('/api', '');
  };

  // Connect to socket server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setState((prev) => ({ ...prev, status: 'connecting', error: null }));

    const socket = io(getSocketUrl(), {
      path: '/arcade',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    // ============ CONNECTION EVENTS ============

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        status: 'idle',
      }));
    });

    socket.on('error', (data: { message: string }) => {
      setState((prev) => ({ ...prev, error: data.message }));
    });

    // ============ LOBBY EVENTS ============

    socket.on('joined_session', (data: {
      sessionId: string;
      gameTitle: string;
      gameType: string;
      isHost: boolean;
      players: Player[];
    }) => {
      setState((prev) => ({
        ...prev,
        sessionId: data.sessionId,
        gameTitle: data.gameTitle,
        gameType: data.gameType,
        isHost: data.isHost,
        players: data.players,
        status: 'waiting',
      }));
    });

    socket.on('player_joined', (data: {
      player: Player;
      players: Player[];
      playerCount: number;
    }) => {
      setState((prev) => ({ ...prev, players: data.players }));
    });

    socket.on('player_left', (data: {
      playerId: string;
      nickname: string;
      playerCount: number;
    }) => {
      setState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== data.playerId),
      }));
    });

    // ============ GAME EVENTS ============

    socket.on('game_started', (data: {
      totalQuestions: number;
      currentQuestion: Question;
    }) => {
      setState((prev) => ({
        ...prev,
        status: 'active',
        totalQuestions: data.totalQuestions,
        currentQuestion: data.currentQuestion,
        timeRemaining: data.currentQuestion.timeLimit,
        answerCounts: {},
        lastResult: null,
      }));
      startTimer(data.currentQuestion.timeLimit);
    });

    socket.on('next_question', (data: Question & { totalQuestions: number }) => {
      setState((prev) => ({
        ...prev,
        currentQuestion: {
          index: data.index,
          content: data.content,
          options: data.options,
          timeLimit: data.timeLimit,
        },
        totalQuestions: data.totalQuestions,
        timeRemaining: data.timeLimit,
        answerCounts: {},
        lastResult: null,
      }));
      startTimer(data.timeLimit);
    });

    socket.on('score_update', (data: ScoreUpdate) => {
      // Update answer counts for bar chart
      setState((prev) => {
        const newCounts = { ...prev.answerCounts };
        // Increment the count (we don't know which answer, just track total)
        return {
          ...prev,
          answerCounts: newCounts,
          players: prev.players.map((p) =>
            p.id === data.playerId
              ? { ...p, score: data.score, streak: data.streak }
              : p
          ),
        };
      });
    });

    socket.on('answer_result', (data: AnswerResult) => {
      setState((prev) => ({ ...prev, lastResult: data }));
    });

    socket.on('game_finished', (data: {
      leaderboard: LeaderboardEntry[];
      winner: LeaderboardEntry | null;
    }) => {
      stopTimer();
      setState((prev) => ({
        ...prev,
        status: 'finished',
        leaderboard: data.leaderboard,
        currentQuestion: null,
      }));
    });
  }, []);

  // Start countdown timer
  const startTimer = (seconds: number) => {
    stopTimer();
    let remaining = seconds;

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setState((prev) => ({ ...prev, timeRemaining: remaining }));

      if (remaining <= 0) {
        stopTimer();
      }
    }, 1000);
  };

  // Stop countdown timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Disconnect from socket
  const disconnect = useCallback(() => {
    stopTimer();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState({
      isConnected: false,
      isHost: false,
      sessionId: null,
      gameTitle: null,
      gameType: null,
      status: 'idle',
      players: [],
      currentQuestion: null,
      totalQuestions: 0,
      timeRemaining: 0,
      leaderboard: [],
      answerCounts: {},
      lastResult: null,
      error: null,
    });
  }, []);

  // Join a game session
  const joinSession = useCallback((pinCode: string, nickname: string, token?: string) => {
    if (!socketRef.current) {
      connect();
    }
    // Wait for connection then emit
    const tryJoin = () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_session', { pinCode, nickname, token });
      } else {
        setTimeout(tryJoin, 100);
      }
    };
    tryJoin();
  }, [connect]);

  // Start the game (host only)
  const startGame = useCallback(() => {
    if (socketRef.current?.connected && state.isHost) {
      socketRef.current.emit('start_game');
    }
  }, [state.isHost]);

  // Submit an answer
  const submitAnswer = useCallback((answer: string) => {
    if (socketRef.current?.connected && state.currentQuestion) {
      socketRef.current.emit('submit_answer', {
        questionIndex: state.currentQuestion.index,
        answer,
      });
    }
  }, [state.currentQuestion]);

  // Move to next question (host only)
  const nextQuestion = useCallback(() => {
    if (socketRef.current?.connected && state.isHost) {
      socketRef.current.emit('next_question');
    }
  }, [state.isHost]);

  // End the game (host only)
  const endGame = useCallback(() => {
    if (socketRef.current?.connected && state.isHost) {
      socketRef.current.emit('end_game');
    }
  }, [state.isHost]);

  // Auto-connect if specified
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    joinSession,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
  };
}

export default useGameSocket;
