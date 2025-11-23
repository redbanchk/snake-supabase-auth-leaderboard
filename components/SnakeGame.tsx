import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, GameStatus, Direction, Point } from '../types';
import { BOARD_SIZE, INITIAL_SNAKE, INITIAL_DIRECTION, INITIAL_SPEED, KEY_MAP, MIN_SPEED, SPEED_DECREMENT } from '../constants';
import { Trophy, RefreshCcw, Play, Pause, XCircle } from 'lucide-react';
import { MobileControls } from './MobileControls';
import { getGlobalLeaderboard, submitScore, getCurrentUser, type GameMode } from '../services/api';
import type { Tables } from '../supabase/types';
import { supabase } from '../supabase/client';
import AuthModal from './AuthModal';
import Leaderboard from './Leaderboard';

const generateFood = (snake: Point[]): Point => {
  if (snake.length >= BOARD_SIZE * BOARD_SIZE) {
    return { x: -1, y: -1 };
  }
  let newFood: Point;
  let isOnSnake = true;
  let attempts = 0;
  const maxAttempts = BOARD_SIZE * BOARD_SIZE * 2;
  while (isOnSnake && attempts < maxAttempts) {
    newFood = { x: Math.floor(Math.random() * BOARD_SIZE), y: Math.floor(Math.random() * BOARD_SIZE) };
    isOnSnake = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
    if (!isOnSnake) return newFood;
    attempts++;
  }
  return { x: -1, y: -1 }; 
};

export const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<Tables<'leaderboard_global'>[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  const RAINBOW_PALETTE = ['red','orange','yellow','green','sky','blue','indigo','violet','pink'] as const;
  const COLOR_CLASS: Record<(typeof RAINBOW_PALETTE)[number], string> = {
    red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500', green: 'bg-green-500', sky: 'bg-sky-500', blue: 'bg-blue-500', indigo: 'bg-indigo-500', violet: 'bg-violet-500', pink: 'bg-pink-500', };
  const initialSegmentColors = useMemo(() => INITIAL_SNAKE.map((_, i) => COLOR_CLASS[RAINBOW_PALETTE[i % RAINBOW_PALETTE.length]]), []);
  const [segmentColors, setSegmentColors] = useState<string[]>(initialSegmentColors);
  const lastEatColorRef = useRef<string>(COLOR_CLASS[RAINBOW_PALETTE[0]]);
  const pickNextColor = useCallback((prev: string) => { const idx = RAINBOW_PALETTE.findIndex((c) => COLOR_CLASS[c] === prev); const nextIdx = (idx + 1 + RAINBOW_PALETTE.length) % RAINBOW_PALETTE.length; return COLOR_CLASS[RAINBOW_PALETTE[nextIdx]]; }, []);

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const lastRenderedDirectionRef = useRef<Direction>(INITIAL_DIRECTION);

  useEffect(() => {
    const saved = localStorage.getItem('snake-highscore'); if (saved) setHighScore(parseInt(saved, 10)); setFood(generateFood(INITIAL_SNAKE)); getCurrentUser().then(setUser).catch(() => setUser(null)); const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => { setUser(session?.user ?? null); }); return () => { authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (score > highScore) { setHighScore(score); localStorage.setItem('snake-highscore', score.toString()); } }, [score, highScore]);

  const fetchLeaderboard = useCallback(async () => { const data = await getGlobalLeaderboard({ limit: 10, offset: 0 }); setLeaderboard(data ?? []); }, []);
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);
  useEffect(() => { const channel = supabase.channel('scores-updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scores' }, () => { fetchLeaderboard(); }).subscribe(); return () => { supabase.removeChannel(channel); }; }, [fetchLeaderboard]);

  const gameTick = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0]; const currentDir = directionRef.current; lastRenderedDirectionRef.current = currentDir; const newHead = { ...head };
      switch (currentDir) { case Direction.UP: newHead.y -= 1; break; case Direction.DOWN: newHead.y += 1; break; case Direction.LEFT: newHead.x -= 1; break; case Direction.RIGHT: newHead.x += 1; break; }
      if (newHead.x < 0 || newHead.x >= BOARD_SIZE || newHead.y < 0 || newHead.y >= BOARD_SIZE) { setStatus(GameStatus.GAME_OVER); return prevSnake; }
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) { setStatus(GameStatus.GAME_OVER); return prevSnake; }
      const newSnake = [newHead, ...prevSnake];
      const ate = newHead.x === food.x && newHead.y === food.y; if (ate) { setScore((s) => s + 1); setSpeed((s) => Math.max(MIN_SPEED, s - SPEED_DECREMENT)); const nextFood = generateFood(newSnake); setFood(nextFood); } else { newSnake.pop(); }
      setSegmentColors((prevColors) => { const headPrev = prevColors[0] ?? COLOR_CLASS[RAINBOW_PALETTE[0]]; if (ate) { let candidate = pickNextColor(lastEatColorRef.current); if (candidate === headPrev) { candidate = pickNextColor(candidate); } lastEatColorRef.current = candidate; return [candidate, ...prevColors]; } const shifted = [headPrev, ...prevColors]; shifted.pop(); return shifted; });
      return newSnake;
    });
  }, [food]);

  useEffect(() => { if (status !== GameStatus.PLAYING) return; const intervalId = setInterval(gameTick, speed); return () => clearInterval(intervalId); }, [status, speed, gameTick]);

  const handleDirectionChange = useCallback((newDir: Direction) => { const currentLastDir = lastRenderedDirectionRef.current; const isOpposite = (newDir === Direction.UP && currentLastDir === Direction.DOWN) || (newDir === Direction.DOWN && currentLastDir === Direction.UP) || (newDir === Direction.LEFT && currentLastDir === Direction.RIGHT) || (newDir === Direction.RIGHT && currentLastDir === Direction.LEFT); if (!isOpposite) { setDirection(newDir); directionRef.current = newDir; } }, []);
  useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if (KEY_MAP[e.key]) { e.preventDefault(); handleDirectionChange(KEY_MAP[e.key]); } if (e.key === ' ' && (status === GameStatus.PLAYING || status === GameStatus.PAUSED)) { togglePause(); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleDirectionChange, status]);

  const startGame = () => { setSnake(INITIAL_SNAKE); setDirection(INITIAL_DIRECTION); directionRef.current = INITIAL_DIRECTION; lastRenderedDirectionRef.current = INITIAL_DIRECTION; setScore(0); setSpeed(INITIAL_SPEED); setStatus(GameStatus.PLAYING); setFood(generateFood(INITIAL_SNAKE)); setSegmentColors(initialSegmentColors); lastEatColorRef.current = COLOR_CLASS[RAINBOW_PALETTE[0]]; startTimeRef.current = Date.now(); };
  const togglePause = () => { if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED); else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING); };
  useEffect(() => { if (status !== GameStatus.GAME_OVER) return; const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : null; if (user) { submitScore(score, { mode: 'classic' as GameMode, duration_seconds: duration ?? undefined, grid_size: BOARD_SIZE }).then(() => fetchLeaderboard()).catch(() => {}); } else { fetchLeaderboard(); } }, [status, user, score, fetchLeaderboard]);

  const gridCells = useMemo(() => { return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => { const x = i % BOARD_SIZE; const y = Math.floor(i / BOARD_SIZE); return { x, y, id: i }; }); }, []);

  return (
    <div className="flex items-start justify-center w-full max-w-5xl mx-auto p-4 h-full gap-4">
      <div className="flex w-full justify-between items-center mb-4 bg-game-board p-3 rounded-xl border border-game-grid shadow-lg">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-yellow-900/30 rounded-full">
             <Trophy className="w-5 h-5 text-yellow-500" />
           </div>
           <div className="flex flex-col">
             <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">High Score</span>
             <span className="text-xl font-mono font-bold text-yellow-400">{highScore}</span>
           </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Current</span>
          <span className="text-2xl font-mono font-bold text-white">{score}</span>
        </div>
        <div className="flex items-center gap-2">
          {!user ? (
            <button onClick={() => setAuthOpen(true)} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded border border-gray-700">登录</button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{user.email ?? '已登录'}</span>
              <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded border border-gray-700">退出</button>
            </div>
          )}
        </div>
      </div>

      <div className="relative group flex-1 aspect-square max-h-[70vh]">
        <div className="w-full h-full grid bg-game-board border-4 border-game-grid rounded-lg shadow-2xl overflow-hidden" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
          {gridCells.map((cell) => {
            const segIdx = snake.findIndex((s) => s.x === cell.x && s.y === cell.y);
            const isSnakeSegment = segIdx >= 0; const isSnakeHead = segIdx === 0; const isFood = food.x === cell.x && food.y === cell.y;
            let cellClass = "w-full h-full border-[0.5px] border-game-grid/30 ";
            if (isSnakeSegment) { const colorClass = segmentColors[segIdx] ?? COLOR_CLASS[RAINBOW_PALETTE[segIdx % RAINBOW_PALETTE.length]]; if (isSnakeHead) { cellClass += `${colorClass} rounded-sm z-10 scale-105 shadow-md shadow-black/40`; } else { cellClass += `${colorClass} rounded-sm opacity-90`; } } else if (isFood) { cellClass += "bg-game-food rounded-full animate-pulse shadow-md shadow-red-900/50 scale-75"; }
            return <div key={cell.id} className={cellClass} />;
          })}
        </div>

        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg z-20">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-6 drop-shadow-lg tracking-tighter">SNAKE</h1>
            <button onClick={startGame} className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30">
              <Play className="w-5 h-5" fill="currentColor" />
              START GAME
            </button>
            <p className="mt-4 text-gray-400 text-sm">Use Arrow Keys or Swipe</p>
          </div>
        )}

        {status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-md rounded-lg z-20 animate-in fade-in duration-300">
            <XCircle className="w-16 h-16 text-white mb-4 opacity-80" />
            <h2 className="text-4xl font-bold text-white mb-2">GAME OVER</h2>
            <p className="text-xl text-white/80 mb-6">Score: {score}</p>
            <button onClick={startGame} className="flex items中心 gap-2 px-6 py-3 bg-white text-red-600 font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-xl">
              <RefreshCcw className="w-5 h-5" />
              TRY AGAIN
            </button>
          </div>
        )}

        {status === GameStatus.PAUSED && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg z-20">
            <h2 className="text-3xl font-bold text-white mb-6 tracking-widest">PAUSED</h2>
            <button onClick={togglePause} className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg">
              <Play className="w-5 h-5" fill="currentColor" />
              RESUME
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 w-full flex justify-between items-center gap-4">
        <div className="flex-1">
           <div className="hidden md:block text-sm text-gray-500">
             <span className="kbd bg-gray-800 px-1 rounded border border-gray-700">Space</span> to Pause
           </div>
        </div>
        <div className="flex md:hidden items-center justify-center">
             <MobileControls onDirectionChange={handleDirectionChange} />
        </div>
         <div className="flex-1 flex justify-end">
            {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
              <button onClick={togglePause} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 text-gray-300 transition-colors" aria-label="Pause/Resume">
                {status === GameStatus.PAUSED ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </button>
            )}
         </div>
      </div>

      <Leaderboard items={leaderboard} currentUserId={user?.id ?? null} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={() => {}} />
    </div>
  );
};
