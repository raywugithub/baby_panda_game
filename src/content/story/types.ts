import type { FriendId } from '../../core/state';
import type { PandaPose } from '../../panda/Panda';

export interface DialogueLine {
  speaker: 'panda' | FriendId | 'narrator' | 'passerby';
  text: string;
  pose?: PandaPose;
}

export interface DialogueScript {
  id: string;
  lines: DialogueLine[];
  illustration?: string;
}
