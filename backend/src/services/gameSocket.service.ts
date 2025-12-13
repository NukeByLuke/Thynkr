/**
 * Thynkr Arcade - Real-Time Game Server
 * Socket.io server for multiplayer game synchronization
 * 
 * NOTE: Run `npx prisma generate` after migration to update Prisma client types
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from '../db/client';
import { logger } from '../lib/logger';
import { verifyAccessToken } from '../lib/jwt';
import type { Role } from '@prisma/client';

// ============ TYPES ============

interface PlayerData {
  odId: string;
  odickname: string;
  score: number;
  streak: number;
  odoinedAt: Date;
}

interface SessionData {
  gameId: string;
  hostId: string;
  hostRole: Role;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  currentQuestionIndex: number;
  players: Map<string, PlayerData>;
  questionStartTime?: number;
}

interface JoinSessionPayload {
  pinCode: string;
  nickname: string;
  token?: string; // Optional JWT for authenticated users
}

interface SubmitAnswerPayload {
  questionIndex: number;
  answer: string;
}

interface ScoreUpdate {
  odayerId: string;
  nickname: string;
  score: number;
  streak: number;
  correct: boolean;
  pointsEarned: number;
}

// ============ CORS ORIGINS ============

const ALLOWED_ORIGINS = [
  'https://thynkr.ca',
  'https://www.thynkr.ca',
  'http://thynkr.ca',
  'http://www.thynkr.ca',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

// ============ GAME SOCKET SERVER CLASS ============

export class GameSocketServer {
  private io: SocketServer;
  private sessions: Map<string, SessionData> = new Map(); // pinCode -> SessionData

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/arcade',
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    logger.info('🎮 Thynkr Arcade Socket Server initialized');
  }

  /**
   * Setup all Socket.io event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);

      // Event: Join a game session
      socket.on('join_session', (payload: JoinSessionPayload) =>
        this.handleJoinSession(socket, payload)
      );

      // Event: Host starts the game
      socket.on('start_game', () => this.handleStartGame(socket));

      // Event: Player submits an answer
      socket.on('submit_answer', (payload: SubmitAnswerPayload) =>
        this.handleSubmitAnswer(socket, payload)
      );

      // Event: Host triggers next question
      socket.on('next_question', () => this.handleNextQuestion(socket));

      // Event: Host ends the game
      socket.on('end_game', () => this.handleEndGame(socket));

      // Event: Client disconnects
      socket.on('disconnect', (reason: string) =>
        this.handleDisconnect(socket, reason)
      );
    });
  }

  /**
   * Handle player joining a session
   */
  private async handleJoinSession(
    socket: Socket,
    payload: JoinSessionPayload
  ): Promise<void> {
    try {
      const { pinCode, nickname, token } = payload;

      if (!pinCode || !nickname) {
        socket.emit('error', { message: 'PIN code and nickname are required' });
        return;
      }

      // Find the session in database
      // @ts-expect-error - Prisma types not generated yet; run migration first
      const session = await prisma.gameSession.findUnique({
        where: { pinCode },
        include: {
          game: true,
        },
      });

      if (!session) {
        socket.emit('error', { message: 'Invalid PIN code. Session not found.' });
        return;
      }

      if (session.status === 'FINISHED') {
        socket.emit('error', { message: 'This game session has already ended.' });
        return;
      }

      if (session.status === 'ACTIVE') {
        socket.emit('error', { message: 'Game already in progress. Cannot join now.' });
        return;
      }

      // Get host info for Pro tier validation
      const host = await prisma.user.findUnique({
        where: { id: session.hostId },
        select: { role: true },
      });

      if (!host) {
        socket.emit('error', { message: 'Session host not found.' });
        return;
      }

      // Pro-only game validation
      if (session.game.tier === 'PRO' && host.role === 'BASIC') {
        socket.emit('error', {
          message: 'This is a Pro-only game. Host needs a Pro subscription.',
        });
        return;
      }

      // Parse user from token if provided (authenticated user)
      let userId: string | null = null;
      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          userId = decoded.userId;
        } catch {
          // Token invalid, proceed as guest
          userId = null;
        }
      }

      // Create player in database
      // @ts-expect-error - Prisma types not generated yet; run migration first
      const player = await prisma.gamePlayer.create({
        data: {
          sessionId: session.id,
          userId,
          nickname,
          score: 0,
          streak: 0,
        },
      });

      // Initialize or get session data in memory
      let sessionData = this.sessions.get(pinCode);
      if (!sessionData) {
        sessionData = {
          gameId: session.gameId,
          hostId: session.hostId,
          hostRole: host.role,
          status: 'WAITING',
          currentQuestionIndex: 0,
          players: new Map(),
        };
        this.sessions.set(pinCode, sessionData);
      }

      // Add player to session
      sessionData.players.set(socket.id, {
        odId: player.id,
        odickname: nickname,
        score: 0,
        streak: 0,
        odoinedAt: new Date(),
      });

      // Store session info on socket for later use
      (socket as any).pinCode = pinCode;
      (socket as any).playerId = player.id;
      (socket as any).isHost = userId === session.hostId;

      // Join the socket room
      socket.join(pinCode);

      // Emit player joined to everyone in the room
      const playerList = Array.from(sessionData.players.values()).map((p) => ({
        id: p.odId,
        nickname: p.odickname,
        score: p.score,
      }));

      this.io.to(pinCode).emit('player_joined', {
        player: { id: player.id, nickname },
        players: playerList,
        playerCount: playerList.length,
      });

      // Confirm join to the player
      socket.emit('joined_session', {
        sessionId: session.id,
        gameTitle: session.game.title,
        gameType: session.game.type,
        isHost: userId === session.hostId,
        players: playerList,
      });

      logger.info(`👤 Player "${nickname}" joined session ${pinCode}`);
    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  }

  /**
   * Handle host starting the game
   */
  private async handleStartGame(socket: Socket): Promise<void> {
    try {
      const pinCode = (socket as any).pinCode;
      const isHost = (socket as any).isHost;

      if (!pinCode) {
        socket.emit('error', { message: 'Not connected to a session' });
        return;
      }

      // Security: Only host can start the game
      if (!isHost) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      const sessionData = this.sessions.get(pinCode);
      if (!sessionData) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (sessionData.status !== 'WAITING') {
        socket.emit('error', { message: 'Game has already started' });
        return;
      }

      // Update session status in database
      // @ts-expect-error - Prisma types not generated yet; run migration first
      const session = await prisma.gameSession.update({
        where: { pinCode },
        data: {
          status: 'ACTIVE',
          startedAt: new Date(),
        },
        include: {
          game: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      // Update memory state
      sessionData.status = 'ACTIVE';
      sessionData.currentQuestionIndex = 0;
      sessionData.questionStartTime = Date.now();

      const firstQuestion = session.game.questions[0];
      if (!firstQuestion) {
        socket.emit('error', { message: 'No questions in this game' });
        return;
      }

      // Emit game started with first question
      this.io.to(pinCode).emit('game_started', {
        totalQuestions: session.game.questions.length,
        currentQuestion: {
          index: 0,
          content: firstQuestion.content,
          options: firstQuestion.options,
          timeLimit: firstQuestion.timeLimit,
        },
      });

      logger.info(`🎮 Game started for session ${pinCode}`);
    } catch (error) {
      logger.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  }

  /**
   * Handle player submitting an answer
   */
  private async handleSubmitAnswer(
    socket: Socket,
    payload: SubmitAnswerPayload
  ): Promise<void> {
    try {
      const pinCode = (socket as any).pinCode;
      const playerId = (socket as any).playerId;
      const { questionIndex, answer } = payload;

      if (!pinCode || !playerId) {
        socket.emit('error', { message: 'Not connected to a session' });
        return;
      }

      const sessionData = this.sessions.get(pinCode);
      if (!sessionData || sessionData.status !== 'ACTIVE') {
        socket.emit('error', { message: 'Game is not active' });
        return;
      }

      if (questionIndex !== sessionData.currentQuestionIndex) {
        socket.emit('error', { message: 'Invalid question index' });
        return;
      }

      // Get the question from database
      // @ts-expect-error - Prisma types not generated yet; run migration first
      const session = await prisma.gameSession.findUnique({
        where: { pinCode },
        include: {
          game: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const currentQuestion = session.game.questions[questionIndex];
      if (!currentQuestion) {
        socket.emit('error', { message: 'Question not found' });
        return;
      }

      // Calculate score based on correctness and speed
      const isCorrect = answer === currentQuestion.correctAnswer;
      const timeElapsed = sessionData.questionStartTime
        ? (Date.now() - sessionData.questionStartTime) / 1000
        : currentQuestion.timeLimit;

      let pointsEarned = 0;
      let newStreak = 0;

      const playerData = sessionData.players.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      if (isCorrect) {
        // Base points + time bonus (faster = more points)
        const timeBonus = Math.max(0, currentQuestion.timeLimit - timeElapsed);
        const speedMultiplier = 1 + timeBonus / currentQuestion.timeLimit;
        const basePoints = 100;

        // Streak bonus (consecutive correct answers)
        newStreak = playerData.streak + 1;
        const streakMultiplier = 1 + newStreak * 0.1; // 10% bonus per streak

        pointsEarned = Math.round(basePoints * speedMultiplier * streakMultiplier);
        playerData.score += pointsEarned;
        playerData.streak = newStreak;
      } else {
        newStreak = 0;
        playerData.streak = 0;
      }

      // Update player in database
      // @ts-expect-error - Prisma types not generated yet; run migration first
      await prisma.gamePlayer.update({
        where: { id: playerId },
        data: {
          score: playerData.score,
          streak: newStreak,
        },
      });

      // Emit score update to the room
      const scoreUpdate: ScoreUpdate = {
        odayerId: playerId,
        nickname: playerData.odickname,
        score: playerData.score,
        streak: newStreak,
        correct: isCorrect,
        pointsEarned,
      };

      this.io.to(pinCode).emit('score_update', scoreUpdate);

      // Send individual result to the player
      socket.emit('answer_result', {
        correct: isCorrect,
        correctAnswer: currentQuestion.correctAnswer,
        pointsEarned,
        totalScore: playerData.score,
        streak: newStreak,
      });

      logger.info(
        `📝 Player "${playerData.odickname}" answered ${isCorrect ? 'correctly' : 'incorrectly'} (+${pointsEarned} pts)`
      );
    } catch (error) {
      logger.error('Error submitting answer:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  }

  /**
   * Handle host triggering next question
   */
  private async handleNextQuestion(socket: Socket): Promise<void> {
    try {
      const pinCode = (socket as any).pinCode;
      const isHost = (socket as any).isHost;

      if (!pinCode) {
        socket.emit('error', { message: 'Not connected to a session' });
        return;
      }

      // Security: Only host can advance questions
      if (!isHost) {
        socket.emit('error', { message: 'Only the host can advance questions' });
        return;
      }

      const sessionData = this.sessions.get(pinCode);
      if (!sessionData || sessionData.status !== 'ACTIVE') {
        socket.emit('error', { message: 'Game is not active' });
        return;
      }

      // Get questions from database
      // @ts-expect-error - Prisma types not generated yet; run migration first
      const session = await prisma.gameSession.findUnique({
        where: { pinCode },
        include: {
          game: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const nextIndex = sessionData.currentQuestionIndex + 1;

      // Check if game is over
      if (nextIndex >= session.game.questions.length) {
        await this.finishGame(pinCode);
        return;
      }

      // Update question index
      sessionData.currentQuestionIndex = nextIndex;
      sessionData.questionStartTime = Date.now();

      // Update database
      // @ts-expect-error - Prisma types not generated yet; run migration first
      await prisma.gameSession.update({
        where: { pinCode },
        data: { currentQuestionIndex: nextIndex },
      });

      const nextQuestion = session.game.questions[nextIndex];

      // Emit next question to room
      this.io.to(pinCode).emit('next_question', {
        index: nextIndex,
        content: nextQuestion.content,
        options: nextQuestion.options,
        timeLimit: nextQuestion.timeLimit,
        totalQuestions: session.game.questions.length,
      });

      logger.info(`➡️ Session ${pinCode} advanced to question ${nextIndex + 1}`);
    } catch (error) {
      logger.error('Error advancing question:', error);
      socket.emit('error', { message: 'Failed to advance question' });
    }
  }

  /**
   * Handle host ending the game
   */
  private async handleEndGame(socket: Socket): Promise<void> {
    try {
      const pinCode = (socket as any).pinCode;
      const isHost = (socket as any).isHost;

      if (!pinCode) {
        socket.emit('error', { message: 'Not connected to a session' });
        return;
      }

      if (!isHost) {
        socket.emit('error', { message: 'Only the host can end the game' });
        return;
      }

      await this.finishGame(pinCode);
    } catch (error) {
      logger.error('Error ending game:', error);
      socket.emit('error', { message: 'Failed to end game' });
    }
  }

  /**
   * Finish the game and emit final results
   */
  private async finishGame(pinCode: string): Promise<void> {
    const sessionData = this.sessions.get(pinCode);
    if (!sessionData) return;

    // Update database
    // @ts-expect-error - Prisma types not generated yet; run migration first
    await prisma.gameSession.update({
      where: { pinCode },
      data: {
        status: 'FINISHED',
        finishedAt: new Date(),
      },
    });

    sessionData.status = 'FINISHED';

    // Get final leaderboard
    // @ts-expect-error - Prisma types not generated yet; run migration first
    const players = await prisma.gamePlayer.findMany({
      where: { session: { pinCode } },
      orderBy: { score: 'desc' },
    });

    const leaderboard = (players as Array<{ id: string; nickname: string; score: number; streak: number }>).map(
      (p: { id: string; nickname: string; score: number; streak: number }, index: number) => ({
        rank: index + 1,
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        streak: p.streak,
      })
    );

    // Emit game finished with final results
    this.io.to(pinCode).emit('game_finished', {
      leaderboard,
      winner: leaderboard[0] || null,
    });

    logger.info(`🏁 Game finished for session ${pinCode}`);

    // Cleanup memory after a delay
    setTimeout(() => {
      this.sessions.delete(pinCode);
    }, 60000); // Keep for 1 minute for late joiners viewing results
  }

  /**
   * Handle player disconnection
   */
  private async handleDisconnect(socket: Socket, reason: string): Promise<void> {
    const pinCode = (socket as any).pinCode;
    const playerId = (socket as any).playerId;

    logger.info(`🔌 Client disconnected: ${socket.id} (${reason})`);

    if (pinCode && playerId) {
      const sessionData = this.sessions.get(pinCode);
      if (sessionData) {
        const playerData = sessionData.players.get(socket.id);
        if (playerData) {
          sessionData.players.delete(socket.id);

          // Notify others in the room
          this.io.to(pinCode).emit('player_left', {
            playerId,
            nickname: playerData.odickname,
            playerCount: sessionData.players.size,
          });
        }
      }
    }
  }

  /**
   * Get the Socket.io server instance
   */
  public getIO(): SocketServer {
    return this.io;
  }
}

// ============ FACTORY FUNCTION ============

let gameSocketServer: GameSocketServer | null = null;

export function initializeGameSocket(httpServer: HttpServer): GameSocketServer {
  if (!gameSocketServer) {
    gameSocketServer = new GameSocketServer(httpServer);
  }
  return gameSocketServer;
}

export function getGameSocketServer(): GameSocketServer | null {
  return gameSocketServer;
}
