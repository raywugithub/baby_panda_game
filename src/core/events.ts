import type { FriendId, GameState } from './state';

export type GameEvent =
  | { type: 'reward'; xp: number; starSand: number; energy: number; chain: number; items: Record<string, number> }
  | { type: 'markUp'; mark: number }
  | { type: 'stageUp'; stage: number; title: string }
  | { type: 'slotUnlocked'; slots: number }
  | { type: 'recipeDiscovered'; recipeId: string }
  | { type: 'storyBeat'; beatId: string }
  | { type: 'friendLevelUp'; friendId: FriendId; level: number }
  | { type: 'milestone'; category: string; count: number }
  | { type: 'nodesSpawned'; ids: number[] };
export interface Outcome { state: GameState; events: GameEvent[] }

export interface Reward { xp?: number; starSand?: number; energy?: number; chain?: number; items?: Record<string, number>; marshmallow?: number }
