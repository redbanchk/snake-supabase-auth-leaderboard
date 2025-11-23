import { Direction, Point } from './types';

export const BOARD_SIZE = 20; // 20x20 grid
export const INITIAL_SPEED = 150; // ms per tick
export const MIN_SPEED = 50; // Fastest speed
export const SPEED_DECREMENT = 2; // How much speed increases per food

export const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

export const INITIAL_DIRECTION = Direction.UP;

// Mapping keyboard keys to directions
export const KEY_MAP: Record<string, Direction> = {
  ArrowUp: Direction.UP,
  w: Direction.UP,
  ArrowDown: Direction.DOWN,
  s: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  a: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  d: Direction.RIGHT,
};
