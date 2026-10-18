import type { Interaction } from '../../content/types';
import type { PandaPose } from '../../panda/poses';

/** 互動家具把熊貓帶到對應的姿勢（Task 16）。 */
export function interactionPose(i: Interaction): PandaPose {
  switch (i) {
    case 'sit': return 'useSit';
    case 'sleep': return 'useSleep';
    case 'swing': return 'useSwing';
    case 'read': return 'useRead';
  }
}
