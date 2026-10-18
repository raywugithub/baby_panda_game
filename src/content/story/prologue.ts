import type { DialogueScript } from './types';

export const PROLOGUE: DialogueScript = {
  id: 'prologue',
  lines: [
    { speaker: 'narrator', text: '紙箱的蓋子慢慢掀開，一顆圓圓的腦袋探了出來。' },
    { speaker: 'panda', pose: 'blush', text: '……這裡好亮。鼻子先出來的，我慢一步。' },
    { speaker: 'narrator', text: '脖子上有一條金色的項圈，扣環是空的。' },
    { speaker: 'panda', pose: 'sit', text: '空的？那一定是有東西掉了。' },
    { speaker: 'narrator', text: '他抖了抖耳朵，身上還沾著一點遠方的風。' },
    { speaker: 'panda', pose: 'stare', text: '這裡不是我的家。我的家在很遠的地方，那裡的星星會自己發光。' },
    { speaker: 'panda', pose: 'shy', text: '墜飾就掛在扣環上的。我得把它找回來，不然，我都不知道怎麼回家。' },
    { speaker: 'narrator', text: '箱子邊貼著一張紙條：「請好好照顧他。」' },
    { speaker: 'panda', pose: 'starEyes', text: '好吧，第一件事，先找點吃的。我好像聞到什麼香香的味道了。' },
  ],
};
