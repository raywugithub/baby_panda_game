import { FRIENDS } from '../friends';
import { hash, mulberry32, pick } from '../../core/rng';
import { COLLAR_CLUES } from './chapters';
import type { DialogueScript } from './types';

/**
 * 小傳說模板（spec 6.5）：每 5 個地點完成一則，v1 共 10 種。
 * 每則 3–5 句，至少含 {clue}（主線線索名）或 {friend}（朋友名）其中一個。
 * 結構與語氣各不相同：傳聞、吐槽、溫情、謎題、條列、快報、紙條、詩意、留白等。
 */
export const LEGEND_TEMPLATES: { id: string; lines: string[] }[] = [
  {
    id: 'rumor-clue',
    lines: [
      '今天早上，雲朵郵局門口的小黑板多了一行字：「關於{clue}，請勿外傳。」',
      '我當然不信，所以我去看了。粉筆還是溫的。',
      '然後我發現，那行字的筆跡跟我的字一模一樣。',
      '……這件事我先不告訴任何人，連棉花也不說。',
    ],
  },
  {
    id: 'race-friend',
    lines: [
      '{friend}宣布要辦全鎮最快的賽跑，報名表上只有一個名字：熊貓。',
      '我跑到一半才發現，終點線是{friend}自己畫的，畫在別人家的牆上。',
      '結果我贏了，但被罰去擦牆。擦完之後，{friend}請我吃了一整袋餅乾。',
      '你說這算贏還是輸？我覺得是餅乾贏。',
    ],
  },
  {
    id: 'night-letter-clue',
    lines: [
      '夜裡風很大，我把窗戶關好，抱著棉被想起「{clue}」。',
      '它陪我走過很遠的路，那時候我還不知道，路是會回頭看我的。',
      '明天醒來，我要再多走一步。',
    ],
  },
  {
    id: 'riddle-friend',
    lines: [
      '{friend}出了一道謎題：「什麼東西越分享越多？」',
      '我想了三分鐘，答案是「餅乾」。{friend}搖頭，說答案是「笑聲」。',
      '我偷偷把餅乾藏起來，決定下次先吃掉，再來笑。',
    ],
  },
  {
    id: 'checklist-clue',
    lines: [
      '我找到一張紙條，上面寫著：',
      '一、把「{clue}」擦亮。二、{friend}的早餐要藏好。三、不准再偷吃。',
      '字跡很熟悉，我看了很久，最後發現是自己小時候寫的。',
    ],
  },
  {
    id: 'story-friend',
    lines: [
      '{friend}講了一個故事：從前有一隻熊貓，每天都要多走一步。',
      '講到一半，{friend}忽然停下來問我：「你猜，下一步會走到哪裡？」',
      '我說：「會走到還沒有人去過的地方吧。」故事就這樣接著往下講。',
    ],
  },
  {
    id: 'moon-clue',
    lines: [
      '有人說，「{clue}」會在月亮最圓的晚上亮一下。',
      '我等了一整晚，只看見一隻蝸牛從窗台慢慢爬過。',
      '蝸牛很有禮貌地說：「快了，光總是慢慢來的。」',
    ],
  },
  {
    id: 'bulletin-friend',
    lines: [
      '【小鎮快報】今天下午三點，{friend}的帽子被一隻鴿子叼走了。',
      '鴿子留下字條：「這頂帽子歸我，想要的話，拿一顆星砂來換。」',
      '最後{friend}用一顆糖果把帽子換了回來。新聞到此為止。',
    ],
  },
  {
    id: 'adventure-steps-clue',
    lines: [
      '第一條規則：先找到「{clue}」。',
      '第二條規則：不准用眼睛以外的器官偷看。',
      '第三條規則：把它帶回家，放在最顯眼的地方。',
      '後來我才發現，最後一條其實是：先跟{friend}說一聲。',
    ],
  },
  {
    id: 'open-ending-clue',
    lines: [
      '傳說裡沒說完的那一段，大概藏在「{clue}」的另一面。',
      '也許有一天，會有人從很遠的地方寄來回信。',
      '在那之前，我先把這一頁折起來，等你翻開它。',
    ],
  },
];

/** 第 n 則小傳說（n 為全域累計完成地點數，n ≥ 20 且為 5 的倍數）。 */
export function legendScript(seed: number, n: number): DialogueScript {
  const t = pick(mulberry32(hash(seed, n, 'legend')), LEGEND_TEMPLATES);
  const clueIndex = (((n / 5 - 4) % COLLAR_CLUES.length) + COLLAR_CLUES.length) % COLLAR_CLUES.length;
  const clue = COLLAR_CLUES[clueIndex].name;
  const friend = FRIENDS[hash(seed, n, 'friend') % FRIENDS.length].name;
  return {
    id: `legend-${n}`,
    lines: t.lines.map(text => ({
      speaker: 'narrator',
      text: text.split('{clue}').join(clue).split('{friend}').join(friend),
    })),
  };
}
